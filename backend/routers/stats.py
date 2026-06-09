"""Stats router."""
from fastapi import APIRouter
from database import get_db

router = APIRouter(tags=["stats"])


@router.get("/stats")
def get_stats():
    with get_db() as conn:
        incidents_count = conn.execute("SELECT COUNT(*) AS n FROM incidents").fetchone()["n"]
        commits_count   = conn.execute("SELECT COUNT(*) AS n FROM commits").fetchone()["n"]
        analyses_count  = conn.execute("SELECT COUNT(*) AS n FROM analyses").fetchone()["n"]
        runs_count      = conn.execute("SELECT COUNT(DISTINCT run_id) AS n FROM analyses").fetchone()["n"]
        avg_row         = conn.execute("SELECT AVG(confidence) AS a FROM analyses").fetchone()
        last_row        = conn.execute("SELECT MAX(created_at) AS t FROM upload_sessions").fetchone()

    last_upload = last_row["t"]
    if last_upload is not None:
        last_upload = str(last_upload)

    return {
        "incidents":      incidents_count,
        "commits":        commits_count,
        "analyses":       analyses_count,
        "runs":           runs_count,
        "avg_confidence": round(float(avg_row["a"] or 0), 1),
        "last_upload":    last_upload,
    }
