"""Upload router — incidents (CSV) and commits (JSON)."""
import csv
import io
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, File, HTTPException, UploadFile
from database import get_db

log = logging.getLogger(__name__)
router = APIRouter(prefix="/upload", tags=["upload"])


# ── Incidents (CSV) ───────────────────────────────────────────────────────────

@router.post("/incidents")
async def upload_incidents(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "File must be a .csv")

    content = await file.read()
    try:
        reader = csv.DictReader(io.StringIO(content.decode("utf-8-sig")))
        rows = list(reader)
    except Exception as e:
        raise HTTPException(400, f"Could not parse CSV: {e}")

    if not rows:
        raise HTTPException(400, "CSV is empty")

    required = {"title", "timestamp"}
    missing = required - set(rows[0].keys())
    if missing:
        raise HTTPException(400, f"CSV missing required columns: {missing}")

    inserted = 0
    errors = []

    with get_db() as conn:
        try:
            for n, row in enumerate(rows, start=1):
                try:
                    conn.execute(
                        """
                        INSERT INTO incidents
                            (incident_ref, title, description, timestamp, severity)
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (
                            (row.get("id") or "").strip(),
                            row["title"].strip(),
                            row.get("description", "").strip(),
                            row["timestamp"].strip(),
                            (row.get("severity", "medium").strip() or "medium"),
                        ),
                    )
                    inserted += 1
                except Exception as e:
                    log.error("Row %d insert failed: %s", n, e)
                    errors.append(f"row {n}: {e}")
                    conn.rollback()   # clear failed txn state, continue

            conn.execute(
                """
                INSERT INTO upload_sessions (type, filename, record_count)
                VALUES (%s, %s, %s)
                """,
                ("incidents", file.filename, inserted),
            )
            conn.commit()
        except Exception as e:
            conn.rollback()
            log.error("Incident upload failed: %s", e)
            raise HTTPException(500, f"Upload failed: {e}")

    msg = f"Uploaded {inserted} incident(s)"
    if errors:
        msg += f" ({len(errors)} row(s) failed)"
    return {"message": msg, "count": inserted, "errors": errors}


# ── Commits (JSON) ────────────────────────────────────────────────────────────

@router.post("/commits")
async def upload_commits(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".json"):
        raise HTTPException(400, "File must be a .json")

    content = await file.read()
    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        raise HTTPException(400, f"Invalid JSON: {e}")

    if not isinstance(data, list):
        raise HTTPException(400, "JSON root must be an array of commit objects")

    required = {"commit_id", "timestamp"}
    for i, c in enumerate(data):
        missing = required - set(c.keys())
        if missing:
            raise HTTPException(400, f"Commit at index {i} missing fields: {missing}")

    inserted = 0
    errors = []

    with get_db() as conn:
        try:
            for i, c in enumerate(data):
                try:
                    conn.execute(
                        """
                        INSERT INTO commits
                            (commit_hash, author, email, message,
                             timestamp, branch, files_changed, diff)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            c["commit_id"],
                            c.get("author", "Unknown"),
                            c.get("email", ""),
                            c.get("message", ""),
                            c["timestamp"],
                            c.get("branch", "main"),
                            json.dumps(c.get("files_changed", [])),
                            c.get("diff", ""),
                        ),
                    )
                    inserted += 1
                except Exception as e:
                    log.error("Commit index %d insert failed: %s", i, e)
                    errors.append(f"index {i}: {e}")
                    conn.rollback()

            conn.execute(
                """
                INSERT INTO upload_sessions (type, filename, record_count)
                VALUES (%s, %s, %s)
                """,
                ("commits", file.filename, inserted),
            )
            conn.commit()
        except Exception as e:
            conn.rollback()
            log.error("Commit upload failed: %s", e)
            raise HTTPException(500, f"Upload failed: {e}")

    msg = f"Uploaded {inserted} commit(s)"
    if errors:
        msg += f" ({len(errors)} commit(s) failed)"
    return {"message": msg, "count": inserted, "errors": errors}
