"""
Analysis router — core business logic.

Key behaviour:
  - POST /analyze         → APPENDS a new run (run_id = UUID).
                            Operates on the most-recently-uploaded incidents and commits
                            (BIGSERIAL ids, newest batch wins).
  - GET  /analyses        → all stored analyses, newest run first.
  - GET  /analyses/runs   → run summaries for History page grouping.
  - DELETE /analyses/runs/{run_id} → delete a single run.
"""
import json
import uuid
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from config import TIME_WINDOW_HOURS
from database import get_db
from services.ai_service import analyze_candidates_with_ai
from services.correlator import find_candidate_commits, parse_timestamp

log = logging.getLogger(__name__)
router = APIRouter(tags=["analysis"])


# ── POST /analyze ─────────────────────────────────────────────────────────────

@router.post("/analyze")
async def run_analysis():
    with get_db() as conn:
        # Only use the MOST RECENTLY UPLOADED batch of incidents and commits.
        # upload_sessions.created_at is set in the same transaction as the
        # individual rows (PostgreSQL NOW() = transaction start time), so
        # uploaded_at >= that timestamp isolates exactly that upload batch.
        incidents = [
            dict(r)
            for r in conn.execute("""
                SELECT i.*, i.incident_ref AS incident_ref_display
                FROM   incidents i
                WHERE  i.uploaded_at >= (
                    SELECT created_at FROM upload_sessions
                    WHERE  type = 'incidents'
                    ORDER  BY id DESC LIMIT 1
                )
                ORDER  BY i.id
            """).fetchall()
        ]
        commits_raw = [
            dict(r)
            for r in conn.execute("""
                SELECT c.*, c.commit_hash AS commit_id
                FROM   commits c
                WHERE  c.uploaded_at >= (
                    SELECT created_at FROM upload_sessions
                    WHERE  type = 'commits'
                    ORDER  BY id DESC LIMIT 1
                )
                ORDER  BY c.id
            """).fetchall()
        ]

    if not incidents:
        raise HTTPException(400, "No incidents uploaded. Upload incidents.csv first.")
    if not commits_raw:
        raise HTTPException(400, "No commits uploaded. Upload commits.json first.")

    # Deserialise files_changed JSON strings
    for c in commits_raw:
        try:
            c["files_changed"] = json.loads(c.get("files_changed") or "[]")
        except Exception:
            c["files_changed"] = []

    run_id    = str(uuid.uuid4())
    run_label = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    results = []
    with get_db() as conn:
        try:
            for incident in incidents:
                inc_ts     = parse_timestamp(incident["timestamp"])
                candidates = find_candidate_commits(inc_ts, commits_raw, TIME_WINDOW_HOURS)

                if not candidates:
                    results.append({
                        "incident": incident,
                        "result":   None,
                        "message":  "No commits found in the correlation window",
                    })
                    continue

                # ONE AI call — all candidates in a single prompt.
                # The model picks the best commit and returns one compact JSON.
                best = await analyze_candidates_with_ai(incident, candidates[:3])

                if best:
                    conn.execute(
                        """
                        INSERT INTO analyses
                            (run_id, run_label, incident_id, commit_id, author,
                             confidence, explanation, recommendation,
                             affected_files, blast_radius)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            run_id,
                            run_label,
                            incident["id"],            # BIGSERIAL FK (incidents.id)
                            best["commit"]["id"],      # BIGSERIAL FK (commits.id)
                            best["commit"].get("author"),
                            best["confidence"],
                            best.get("explanation"),
                            best.get("recommendation"),
                            json.dumps(best.get("affected_components", [])),
                            best.get("blast_radius", "medium"),
                        ),
                    )
                    results.append({
                        "incident":           incident,
                        "result":             best,
                        "candidates_checked": len(candidates[:3]),
                    })

            conn.commit()
        except Exception as e:
            conn.rollback()
            log.error("Analysis run failed: %s", e)
            raise HTTPException(500, f"Analysis failed: {e}")

    return {
        "run_id":    run_id,
        "run_label": run_label,
        "analyses":  results,
        "total":     len(results),
    }


# ── GET /analyses ─────────────────────────────────────────────────────────────

@router.get("/analyses")
def get_analyses():
    with get_db() as conn:
        rows = conn.execute("""
            SELECT
                a.*,
                i.title       AS incident_title,
                i.severity,
                i.description AS incident_description,
                i.incident_ref,
                c.message     AS commit_message,
                c.files_changed,
                c.branch,
                c.commit_hash,
                c.diff        AS commit_diff
            FROM   analyses a
            JOIN   incidents i ON a.incident_id = i.id
            JOIN   commits   c ON a.commit_id   = c.id
            ORDER  BY a.created_at DESC
        """).fetchall()

    result = []
    for r in rows:
        d = dict(r)
        d["affected_files"] = _safe_json(d.get("affected_files"))
        d["files_changed"]  = _safe_json(d.get("files_changed"))
        result.append(d)

    return {"analyses": result}


# ── GET /analyses/runs ────────────────────────────────────────────────────────

@router.get("/analyses/runs")
def get_runs():
    with get_db() as conn:
        rows = conn.execute("""
            SELECT   run_id,
                     run_label,
                     MIN(created_at)  AS created_at,
                     COUNT(*)         AS incident_count,
                     AVG(confidence)  AS avg_confidence
            FROM     analyses
            GROUP BY run_id, run_label
            ORDER BY created_at DESC
        """).fetchall()

    return {
        "runs": [
            {
                "run_id":         r["run_id"],
                "run_label":      r["run_label"] or r["run_id"][:8],
                "created_at":     str(r["created_at"]),
                "incident_count": r["incident_count"],
                "avg_confidence": round(float(r["avg_confidence"] or 0), 1),
            }
            for r in rows
        ]
    }


# ── DELETE /analyses/runs/{run_id} ────────────────────────────────────────────

@router.delete("/analyses/runs/{run_id}")
def delete_run(run_id: str):
    with get_db() as conn:
        cursor  = conn.execute("DELETE FROM analyses WHERE run_id = %s", (run_id,))
        deleted = cursor.rowcount
        conn.commit()

    if deleted == 0:
        raise HTTPException(404, f"Run '{run_id}' not found")

    return {"message": f"Deleted run '{run_id}' ({deleted} analyses removed)", "deleted": deleted}


# ── helpers ───────────────────────────────────────────────────────────────────

def _safe_json(value) -> list:
    try:
        return json.loads(value or "[]")
    except Exception:
        return []
