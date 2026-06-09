"""
Commit correlation service:
  - Time-window candidate finder
  - Rule-based heuristic fallback analyser
"""
from datetime import datetime, timedelta, timezone


def parse_timestamp(ts: str) -> datetime:
    """Parse ISO-8601 timestamp → UTC-aware datetime."""
    ts = ts.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(ts)
    except Exception:
        return datetime.now(timezone.utc)


def find_candidate_commits(incident_ts: datetime, commits: list, window_hours: int = 6) -> list:
    """
    Return commits deployed within *window_hours* before *incident_ts*,
    sorted by closest to the incident first (ascending delta).
    """
    window_start = incident_ts - timedelta(hours=window_hours)
    candidates = []
    for c in commits:
        c_ts = parse_timestamp(c["timestamp"])
        if window_start <= c_ts <= incident_ts:
            delta_minutes = int((incident_ts - c_ts).total_seconds() / 60)
            candidates.append({**c, "delta_minutes": delta_minutes})
    candidates.sort(key=lambda x: x["delta_minutes"])
    return candidates


def heuristic_analysis(incident: dict, commit: dict, delta_minutes: int) -> dict:
    """
    Rule-based fallback when Ollama is unavailable.
    Scores by keyword overlap between incident title and commit diff/files.
    """
    title_lower = incident["title"].lower()
    msg_lower   = commit["message"].lower()
    diff_lower  = (commit.get("diff") or "").lower()
    files       = " ".join(commit.get("files_changed") or []).lower()

    DOMAIN_KEYWORDS: dict[str, list[str]] = {
        "login":    ["auth", "token", "jwt", "session", "login", "credential"],
        "payment":  ["payment", "stripe", "checkout", "billing", "webhook"],
        "database": ["db", "pool", "connection", "database", "query", "sql"],
        "email":    ["email", "ses", "smtp", "notification", "mail"],
        "search":   ["search", "elastic", "cache", "index", "redis"],
        "api":      ["rate", "limit", "throttle", "oauth", "api"],
    }

    score = 50
    matched_domain: str | None = None

    for domain, kws in DOMAIN_KEYWORDS.items():
        if any(k in title_lower for k in kws):
            if any(k in msg_lower or k in files or k in diff_lower for k in kws):
                score = min(95, score + 35)
                matched_domain = domain
                break

    # Time-proximity bonus
    if delta_minutes < 30:
        score = min(98, score + 15)
    elif delta_minutes < 120:
        score = min(98, score + 8)

    # Suspicious markers in diff
    suspicious = sum(1 for w in ["todo", "fixme", "bug", "warning", "hack"] if w in diff_lower)
    score = min(98, score + suspicious * 5)

    changed_files_preview = commit.get("files_changed", [])

    return {
        "confidence": float(score),
        "explanation": (
            f"Commit '{commit['message']}' by {commit['author']} was deployed "
            f"{delta_minutes}m before the incident. "
            + ("Changed files overlap with the affected component."
               if matched_domain else "Time proximity suggests possible causation.")
        ),
        "recommendation": (
            f"Rollback commit {commit['commit_id']} and verify the affected service. "
            f"Check {', '.join(changed_files_preview[:2]) or 'changed files'} for regressions."
        ),
        "blast_radius": "high" if score > 80 else "medium" if score > 60 else "low",
        "affected_components": changed_files_preview[:3],
    }
