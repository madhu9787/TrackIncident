#!/usr/bin/env python3
"""
Standalone report generator: reads incidents.csv + commits.json,
correlates by time window, optionally calls Ollama for AI diff analysis,
outputs a self-contained HTML report.

Usage:
  python generate_report.py \
    --incidents data/incidents.csv \
    --commits data/commits.json \
    --output report.html \
    --window 6 \
    [--ollama http://localhost:11434] [--model llama3]
"""

import argparse
import csv
import json
import sys
import os
import html
from datetime import datetime, timedelta, timezone

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False


def parse_ts(ts):
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def time_window_candidates(inc_ts, commits, window_h):
    start = inc_ts - timedelta(hours=window_h)
    result = []
    for c in commits:
        c_ts = parse_ts(c["timestamp"])
        if start <= c_ts <= inc_ts:
            delta = int((inc_ts - c_ts).total_seconds() / 60)
            result.append({**c, "_delta_min": delta})
    return sorted(result, key=lambda x: x["_delta_min"])


def heuristic_score(incident, commit):
    kw_map = {
        "login|auth|token|jwt|session": ["auth", "token", "jwt", "session", "login"],
        "payment|checkout|stripe|billing": ["payment", "stripe", "checkout", "billing", "webhook"],
        "database|db|connection|pool": ["db", "pool", "connection", "database", "query"],
        "email|mail|ses|smtp|notification": ["email", "ses", "smtp", "notification", "mail"],
        "search|elastic|cache|redis|index": ["search", "elastic", "cache", "index", "redis"],
    }
    title = (incident.get("title", "") + " " + incident.get("description", "")).lower()
    diff = (commit.get("diff", "") + " " + commit.get("message", "")).lower()
    files = " ".join(commit.get("files_changed", [])).lower()

    score = 45
    for _, kws in kw_map.items():
        if any(k in title for k in kws) and any(k in diff or k in files for k in kws):
            score += 35
            break

    delta = commit["_delta_min"]
    if delta < 30: score += 15
    elif delta < 120: score += 8

    suspicious = sum(1 for w in ["todo", "fixme", "bug", "warning", "hack"] if w in diff)
    score = min(98, score + suspicious * 5)
    return min(score, 98)


def call_ollama_sync(prompt, url, model):
    if not HAS_HTTPX:
        return None
    try:
        r = httpx.post(f"{url}/api/generate", json={
            "model": model, "prompt": prompt, "stream": False,
            "options": {"temperature": 0.1, "num_predict": 600}
        }, timeout=90)
        return r.json().get("response", "")
    except Exception:
        return None


def analyze(incident, commit, ollama_url, model):
    diff = (commit.get("diff") or "")[:1200]
    files = ", ".join(commit.get("files_changed") or [])
    delta = commit["_delta_min"]

    if ollama_url:
        prompt = f"""You are a senior SRE analyzing a production incident.

INCIDENT: {incident['title']}
DESCRIPTION: {incident.get('description','')}
SEVERITY: {incident.get('severity','unknown')}

SUSPECT COMMIT ({delta}min before incident):
- ID: {commit['commit_id']}
- Author: {commit.get('author','')}
- Message: {commit.get('message','')}
- Files: {files}

DIFF:
{diff}

Respond ONLY with JSON:
{{"confidence":0-100,"explanation":"2-3 sentences","recommendation":"specific action","blast_radius":"low|medium|high|critical"}}"""

        resp = call_ollama_sync(prompt, ollama_url, model)
        if resp:
            try:
                clean = resp.strip()
                if clean.startswith("```"):
                    clean = clean.split("```")[1]
                    if clean.startswith("json"): clean = clean[4:]
                data = json.loads(clean.strip())
                return {
                    "confidence": float(data.get("confidence", 50)),
                    "explanation": data.get("explanation", ""),
                    "recommendation": data.get("recommendation", ""),
                    "blast_radius": data.get("blast_radius", "medium"),
                    "mode": "ai"
                }
            except Exception:
                pass

    conf = heuristic_score(incident, commit)
    return {
        "confidence": float(conf),
        "explanation": f"Commit '{commit.get('message','')}' by {commit.get('author','')} deployed {delta}m before incident. Time proximity and code pattern matching suggest causation.",
        "recommendation": f"Rollback commit {commit['commit_id']}. Review {', '.join((commit.get('files_changed') or [])[:2])} for regressions.",
        "blast_radius": "high" if conf > 80 else "medium" if conf > 60 else "low",
        "mode": "heuristic"
    }


SEVERITY_COLORS = {"critical": "#ef4444", "high": "#f97316", "medium": "#eab308", "low": "#22c55e"}
BLAST_COLORS = {"critical": "#ef4444", "high": "#f97316", "medium": "#eab308", "low": "#22c55e"}


def render_html(results, meta):
    items_html = ""
    for r in results:
        inc = r["incident"]
        sev_color = SEVERITY_COLORS.get(inc.get("severity", "medium"), "#6b6b8a")
        if not r.get("result"):
            items_html += f"""
<div class="card no-match">
  <div class="card-header" style="border-left: 3px solid #3a3a5e">
    <span class="title">{html.escape(inc.get('title',''))}</span>
    <span class="badge badge-sev" style="background:{sev_color}22;color:{sev_color}">{inc.get('severity','').upper()}</span>
    <span class="ts">{inc.get('timestamp','')}</span>
  </div>
  <div class="no-match-body">No commits found in correlation window</div>
</div>"""
            continue

        res = r["result"]
        commit = res["commit"]
        conf = round(res["confidence"])
        conf_color = "#22c55e" if conf >= 80 else "#eab308" if conf >= 60 else "#ef4444"
        blast_color = BLAST_COLORS.get(res.get("blast_radius", "medium"), "#6b6b8a")
        files_html = "".join(f'<span class="file-tag">{html.escape(f.split("/")[-1])}</span>' for f in (commit.get("files_changed") or [])[:5])
        ai_badge = '<span class="badge badge-ai">AI</span>' if res.get("mode") == "ai" else '<span class="badge badge-heuristic">Heuristic</span>'

        items_html += f"""
<div class="card">
  <div class="card-header" style="border-left: 3px solid {sev_color}">
    <div class="header-left">
      <span class="title">{html.escape(inc.get('title',''))}</span>
      <span class="badge badge-sev" style="background:{sev_color}22;color:{sev_color}">{inc.get('severity','').upper()}</span>
      {ai_badge}
    </div>
    <span class="ts">{inc.get('timestamp','')}</span>
  </div>
  <div class="card-body">
    <div class="conf-col">
      <svg viewBox="0 0 80 80" width="80" height="80">
        <circle cx="40" cy="40" r="34" fill="none" stroke="#1f1f2e" stroke-width="8"/>
        <circle cx="40" cy="40" r="34" fill="none" stroke="{conf_color}" stroke-width="8"
          stroke-dasharray="{round(2 * 3.14159 * 34 * conf / 100, 1)} 999"
          stroke-dashoffset="{round(2 * 3.14159 * 34 * 0.25, 1)}"
          stroke-linecap="round"/>
        <text x="40" y="37" text-anchor="middle" fill="{conf_color}" font-size="16" font-weight="800" font-family="monospace">{conf}%</text>
        <text x="40" y="52" text-anchor="middle" fill="#6b6b8a" font-size="9">confidence</text>
      </svg>
    </div>
    <div class="details-col">
      <div class="commit-box">
        <div class="commit-meta">
          <code class="commit-id">{html.escape(commit.get('commit_id',''))}</code>
          <span class="delta">{commit.get('_delta_min',0)}m before incident</span>
          <span class="blast-tag" style="background:{blast_color}22;color:{blast_color}">{res.get('blast_radius','').upper()} blast radius</span>
        </div>
        <div class="commit-msg">{html.escape(commit.get('message',''))}</div>
        <div class="author">👤 {html.escape(commit.get('author',''))}</div>
        <div class="files">{files_html}</div>
      </div>
      <div class="analysis-grid">
        <div class="analysis-box expl-box">
          <div class="box-label">Root Cause</div>
          <div class="box-content">{html.escape(res.get('explanation',''))}</div>
        </div>
        <div class="analysis-box rec-box">
          <div class="box-label">Recommendation</div>
          <div class="box-content">{html.escape(res.get('recommendation',''))}</div>
        </div>
      </div>
    </div>
  </div>
</div>"""

    matched = [r for r in results if r.get("result")]
    avg_conf = round(sum(r["result"]["confidence"] for r in matched) / len(matched)) if matched else 0

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Release Incident Correlator — Report</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ background: #0f0f13; color: #c2c2e0; font-family: 'Segoe UI', system-ui, sans-serif; padding: 32px 24px; }}
  a {{ color: #6366f1; }}
  .hero {{ max-width: 900px; margin: 0 auto 32px; }}
  .hero h1 {{ font-size: 26px; color: #e2e2f0; font-weight: 800; margin-bottom: 6px; }}
  .hero .sub {{ color: #6b6b8a; font-size: 14px; }}
  .stats {{ display: flex; gap: 16px; margin-top: 20px; }}
  .stat {{ background: #16161d; border: 1px solid #1f1f2e; border-radius: 10px; padding: 14px 20px; flex: 1; }}
  .stat .v {{ font-size: 24px; font-weight: 800; margin-bottom: 2px; }}
  .stat .l {{ font-size: 12px; color: #6b6b8a; }}
  .card {{ max-width: 900px; margin: 0 auto 16px; background: #16161d; border: 1px solid #1f1f2e; border-radius: 12px; overflow: hidden; }}
  .card-header {{ padding: 14px 20px; background: #1a1a24; display: flex; justify-content: space-between; align-items: center; }}
  .header-left {{ display: flex; align-items: center; gap: 10px; }}
  .title {{ color: #e2e2f0; font-weight: 700; font-size: 15px; }}
  .ts {{ color: #6b6b8a; font-size: 12px; }}
  .badge {{ font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }}
  .badge-sev {{ }}
  .badge-ai {{ background: #6366f122; color: #818cf8; border: 1px solid #6366f133; }}
  .badge-heuristic {{ background: #eab30822; color: #fbbf24; border: 1px solid #eab30833; }}
  .card-body {{ padding: 20px; display: flex; gap: 20px; }}
  .conf-col {{ flex-shrink: 0; display: flex; align-items: flex-start; padding-top: 4px; }}
  .details-col {{ flex: 1; min-width: 0; }}
  .commit-box {{ background: #0f0f13; border: 1px solid #2a2a3e; border-radius: 8px; padding: 14px; margin-bottom: 12px; }}
  .commit-meta {{ display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 8px; }}
  .commit-id {{ background: #2a1a10; color: #fb923c; padding: 2px 8px; border-radius: 4px; font-size: 12px; }}
  .delta {{ color: #6b6b8a; font-size: 12px; }}
  .blast-tag {{ font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }}
  .commit-msg {{ color: #9898b8; font-size: 13px; margin-bottom: 6px; }}
  .author {{ color: #6b6b8a; font-size: 12px; margin-bottom: 8px; }}
  .files {{ display: flex; gap: 6px; flex-wrap: wrap; }}
  .file-tag {{ background: #1e1e2a; border: 1px solid #2a2a3e; color: #9898b8; font-size: 11px; padding: 2px 8px; border-radius: 4px; font-family: monospace; }}
  .analysis-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }}
  .analysis-box {{ border-radius: 8px; padding: 12px 14px; }}
  .expl-box {{ background: #0a100f; border: 1px solid #22c55e22; }}
  .rec-box {{ background: #0f100a; border: 1px solid #eab30822; }}
  .box-label {{ font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: #6b6b8a; font-weight: 600; margin-bottom: 6px; }}
  .box-content {{ font-size: 13px; color: #c2c2e0; line-height: 1.6; }}
  .no-match {{ }}
  .no-match-body {{ padding: 14px 20px; color: #6b6b8a; font-size: 13px; }}
  .footer {{ max-width: 900px; margin: 24px auto 0; text-align: center; color: #4a4a6a; font-size: 12px; }}
</style>
</head>
<body>
<div class="hero">
  <h1>🔍 Release → Incident Correlator</h1>
  <div class="sub">Generated {meta['generated_at']} · Window: ±{meta['window_h']}h · Mode: {meta['mode']}</div>
  <div class="stats">
    <div class="stat"><div class="v" style="color:#ef4444">{meta['incidents']}</div><div class="l">Incidents</div></div>
    <div class="stat"><div class="v" style="color:#6366f1">{meta['commits']}</div><div class="l">Commits</div></div>
    <div class="stat"><div class="v" style="color:#22c55e">{len(matched)}</div><div class="l">Correlated</div></div>
    <div class="stat"><div class="v" style="color:#eab308">{avg_conf}%</div><div class="l">Avg Confidence</div></div>
  </div>
</div>
{items_html}
<div class="footer">Release Incident Correlator · {meta['generated_at']}</div>
</body>
</html>"""


def main():
    parser = argparse.ArgumentParser(description="Generate RIC HTML report")
    parser.add_argument("--incidents", default="data/incidents.csv")
    parser.add_argument("--commits", default="data/commits.json")
    parser.add_argument("--output", default="report.html")
    parser.add_argument("--window", type=int, default=6)
    parser.add_argument("--ollama", default=None, help="Ollama URL, e.g. http://localhost:11434")
    parser.add_argument("--model", default="llama3")
    args = parser.parse_args()

    # Load data
    with open(args.incidents, newline="", encoding="utf-8-sig") as f:
        incidents = list(csv.DictReader(f))
    with open(args.commits, encoding="utf-8") as f:
        commits = json.load(f)

    print(f"Loaded {len(incidents)} incidents, {len(commits)} commits")

    results = []
    for inc in incidents:
        inc_ts = parse_ts(inc["timestamp"])
        candidates = time_window_candidates(inc_ts, commits, args.window)
        if not candidates:
            print(f"  [{inc['id']}] No candidates in window")
            results.append({"incident": inc, "result": None})
            continue

        best = None
        for commit in candidates[:3]:
            a = analyze(inc, commit, args.ollama, args.model)
            if best is None or a["confidence"] > best["confidence"]:
                best = {**a, "commit": commit}
        print(f"  [{inc['id']}] → {best['commit']['commit_id']} ({round(best['confidence'])}% conf, {best['mode']})")
        results.append({"incident": inc, "result": best})

    mode = "Ollama/Llama3" if args.ollama else "Heuristic"
    html_content = render_html(results, {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "window_h": args.window,
        "mode": mode,
        "incidents": len(incidents),
        "commits": len(commits),
    })

    with open(args.output, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"\n✅ Report saved to {args.output}")


if __name__ == "__main__":
    main()
