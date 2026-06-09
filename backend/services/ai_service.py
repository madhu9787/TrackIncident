"""
AI service — Groq (cloud, fast) or Ollama (local).

Key design: ONE AI call per incident, ALL candidates in a single prompt.
The model picks the best commit and returns one compact JSON.
~300-400 tokens per incident (vs ~800-1200 for 3 sequential calls).

Provider routing via AI_PROVIDER env var.
"""
import json
import logging
import httpx

from config import AI_PROVIDER, GROQ_API_KEY, GROQ_MODEL, OLLAMA_URL, OLLAMA_MODEL
from services.correlator import heuristic_analysis

log = logging.getLogger(__name__)

# Chars of diff to include per candidate — lean keeps token cost low
_MAX_DIFF_PER_CANDIDATE = 400


# ── Prompt builder ────────────────────────────────────────────────────────────

def _build_prompt(incident: dict, candidates: list) -> str:
    """
    Single prompt — all candidates at once.
    AI returns ONE JSON picking the best commit.
    Compact format: no filler, just the facts needed to decide.
    """
    cands_txt = ""
    for i, c in enumerate(candidates, 1):
        diff  = (c.get("diff") or "")[:_MAX_DIFF_PER_CANDIDATE]
        files = ", ".join(c.get("files_changed") or [])
        cands_txt += (
            f"\nCOMMIT {i}: {c['commit_id']} | {c.get('author', '?')} | {c['delta_minutes']}min before incident"
            f"\nMessage: {c.get('message', '')}"
            f"\nFiles: {files}"
            f"\nDiff:\n{diff}\n"
        )

    return (
        f"You are an SRE. Pick which commit most likely caused this incident.\n\n"
        f"INCIDENT: {incident['title']}\n"
        f"DESCRIPTION: {incident.get('description', '')}\n"
        f"SEVERITY: {incident.get('severity', 'medium')}\n\n"
        f"CANDIDATES:{cands_txt}\n"
        f"Respond ONLY with this JSON (no markdown, no extra text):\n"
        f'{{"commit_id":"<exact id from above>","confidence":<integer 0-100>,'
        f'"explanation":"<2 sentences max>","recommendation":"<1 sentence action>",'
        f'"blast_radius":"<low|medium|high|critical>","affected_components":["<comp1>"]}}'
    )


# ── Groq ──────────────────────────────────────────────────────────────────────

def _call_groq_sync(prompt: str) -> str | None:
    if not GROQ_API_KEY:
        log.warning("[Groq] GROQ_API_KEY is not set — skipping AI, using heuristic")
        return None
    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY, timeout=60.0)
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=350,   # one compact JSON — 350 is plenty
        )
        raw = completion.choices[0].message.content
        log.debug("[Groq] raw response: %s", raw[:300])
        return raw
    except Exception as e:
        log.error("[Groq] API error — %s: %s", type(e).__name__, e)
        return None


async def _call_groq(prompt: str) -> str | None:
    import asyncio
    return await asyncio.get_event_loop().run_in_executor(None, _call_groq_sync, prompt)


# ── Ollama ────────────────────────────────────────────────────────────────────

async def _call_ollama(prompt: str) -> str | None:
    payload = {
        "model":   OLLAMA_MODEL,
        "prompt":  prompt,
        "stream":  False,
        "options": {"temperature": 0.1, "num_predict": 350},
    }
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:  # 5 min — Ollama on CPU can be slow
            resp = await client.post(f"{OLLAMA_URL}/api/generate", json=payload)
            resp.raise_for_status()
            raw = resp.json().get("response", "")
            log.debug("[Ollama] raw response: %s", raw[:300])
            return raw
    except (httpx.ConnectError, httpx.TimeoutException) as e:
        log.error("[Ollama] connection error — %s: %s", type(e).__name__, e)
        return None
    except Exception as e:
        log.error("[Ollama] unexpected error — %s: %s", type(e).__name__, e)
        return None


# ── JSON parser ───────────────────────────────────────────────────────────────

def _parse_ai_json(raw: str) -> dict | None:
    """Strip markdown fences and parse JSON. Returns None on failure (logged)."""
    if not raw:
        return None
    clean = raw.strip()
    if clean.startswith("```"):
        parts = clean.split("```")
        clean = parts[1] if len(parts) > 1 else clean
        if clean.startswith("json"):
            clean = clean[4:]
        clean = clean.strip()
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        pass
    start, end = clean.find("{"), clean.rfind("}")
    if start != -1 and end != -1:
        try:
            return json.loads(clean[start: end + 1])
        except json.JSONDecodeError as e:
            log.error("[AI] JSON parse failed after brace extraction: %s | raw: %s", e, raw[:400])
    else:
        log.error("[AI] No JSON object found in response: %s", raw[:400])
    return None


# ── Public interface ──────────────────────────────────────────────────────────

async def _call_ai(prompt: str) -> str | None:
    if AI_PROVIDER == "groq":
        return await _call_groq(prompt)
    return await _call_ollama(prompt)


async def analyze_candidates_with_ai(incident: dict, candidates: list) -> dict:
    """
    ONE AI call for ALL candidates → AI picks the best commit.

    Returns a dict with keys:
        confidence, explanation, recommendation, blast_radius,
        affected_components, commit   (the matched candidate dict)

    Falls back to heuristic on the closest candidate (candidates[0]) if AI
    is unreachable or returns an unparseable / unmatched response.
    """
    if not candidates:
        raise ValueError("candidates list must not be empty")

    prompt = _build_prompt(incident, candidates)
    raw    = await _call_ai(prompt)
    result = _parse_ai_json(raw)

    if result:
        # Match commit_id back to the actual candidate dict
        ai_commit_id = result.get("commit_id", "")
        matched = next(
            (c for c in candidates if c["commit_id"] == ai_commit_id),
            candidates[0],   # fallback to closest if AI returned a bad id
        )
        log.info(
            "[AI] %s — picked %s | confidence=%s | %d candidates in 1 call",
            AI_PROVIDER, ai_commit_id, result.get("confidence"), len(candidates),
        )
        return {
            "confidence":          float(result.get("confidence", 50)),
            "explanation":         result.get("explanation", ""),
            "recommendation":      result.get("recommendation", ""),
            "blast_radius":        result.get("blast_radius", "medium"),
            "affected_components": result.get("affected_components", []),
            "commit":              matched,
        }

    log.warning("[AI] Falling back to heuristic for incident '%s'", incident.get("title"))
    fallback = heuristic_analysis(incident, candidates[0], candidates[0]["delta_minutes"])
    return {**fallback, "commit": candidates[0]}


# ── Chatbot interface ─────────────────────────────────────────────────────────

def _chat_groq_sync(messages: list) -> str:
    if not GROQ_API_KEY:
        log.warning("[Groq Chat] GROQ_API_KEY is not set.")
        return "Sorry, the AI is not configured right now. Please provide a Groq API key."
    try:
        from groq import Groq
        client = Groq(api_key=GROQ_API_KEY, timeout=60.0)
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=500,
        )
        return completion.choices[0].message.content
    except Exception as e:
        log.error("[Groq Chat] API error — %s: %s", type(e).__name__, e)
        return "Oops, I encountered an error communicating with the AI. Please try again."

async def chat_with_ai(messages: list) -> str:
    """
    Handles a conversation with the user.
    """
    system_prompt = {
        "role": "system",
        "content": (
            "You are a helpful AI assistant built into the Release Incident Correlator application. "
            "Your job is to help users understand how to use the tool, answer their queries, "
            "and guide them through uploading incidents (CSV) and commits (JSON) to find the root-cause commit. "
            "Keep your answers concise, friendly, and helpful. Do not output raw JSON unless specifically requested."
        )
    }
    
    # Prepend the system prompt if it's not already there
    full_messages = [system_prompt] + messages
    
    import asyncio
    if AI_PROVIDER == "groq":
        return await asyncio.get_event_loop().run_in_executor(None, _chat_groq_sync, full_messages)
    
    # Fallback for Ollama
    payload = {
        "model": OLLAMA_MODEL,
        "messages": full_messages,
        "stream": False,
        "options": {"temperature": 0.7, "num_predict": 500},
    }
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
            resp.raise_for_status()
            return resp.json().get("message", {}).get("content", "")
    except Exception as e:
        log.error("[Ollama Chat] error — %s: %s", type(e).__name__, e)
        return "I am having trouble connecting to the local AI. Please try again later."

