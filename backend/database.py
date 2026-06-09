"""
Database layer — PostgreSQL only (psycopg2).
Public API:
    get_db()   → context-manager-compatible connection wrapper
    init_db()  → idempotent schema bootstrap (safe to call on every startup)
"""
import logging
import psycopg2
import psycopg2.extras

from config import CONNECTION_STRING_PSQL

log = logging.getLogger(__name__)


# ── Connection wrapper ────────────────────────────────────────────────────────

class _PgConn:
    """Thin psycopg2 wrapper — exposes .execute() / .commit() / .close()."""

    def __init__(self, conn):
        self._conn = conn

    def execute(self, sql: str, params=None):
        cur = self._conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql, params or ())
        return cur

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()

    # context-manager support
    def __enter__(self):
        return self

    def __exit__(self, exc_type, *_):
        if exc_type:
            self.rollback()
        self.close()


# ── Public factory ────────────────────────────────────────────────────────────

def get_db() -> _PgConn:
    if not CONNECTION_STRING_PSQL:
        raise RuntimeError(
            "CONNECTION_STRING_PSQL is not set. "
            "Add it to backend/.env before starting the server."
        )
    conn = psycopg2.connect(CONNECTION_STRING_PSQL)
    return _PgConn(conn)


# ── Schema ────────────────────────────────────────────────────────────────────
# Every table uses a BIGSERIAL surrogate PK so uploads NEVER conflict.
# incident_ref / commit_hash carry the original caller-supplied identifiers
# (with a plain index, not UNIQUE) so the same CSV/JSON can be re-uploaded.

_SCHEMA = """
CREATE TABLE IF NOT EXISTS incidents (
    id            BIGSERIAL PRIMARY KEY,
    incident_ref  TEXT        NOT NULL DEFAULT '',
    title         TEXT        NOT NULL,
    description   TEXT        NOT NULL DEFAULT '',
    timestamp     TEXT        NOT NULL,
    severity      TEXT        NOT NULL DEFAULT 'medium',
    uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_ref ON incidents (incident_ref);

CREATE TABLE IF NOT EXISTS commits (
    id            BIGSERIAL PRIMARY KEY,
    commit_hash   TEXT        NOT NULL DEFAULT '',
    author        TEXT        NOT NULL DEFAULT 'Unknown',
    email         TEXT        NOT NULL DEFAULT '',
    message       TEXT        NOT NULL DEFAULT '',
    timestamp     TEXT        NOT NULL,
    branch        TEXT        NOT NULL DEFAULT 'main',
    files_changed TEXT        NOT NULL DEFAULT '[]',
    diff          TEXT        NOT NULL DEFAULT '',
    uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commits_hash ON commits (commit_hash);

CREATE TABLE IF NOT EXISTS analyses (
    id              BIGSERIAL PRIMARY KEY,
    run_id          TEXT        NOT NULL DEFAULT '',
    run_label       TEXT,
    incident_id     BIGINT      REFERENCES incidents(id) ON DELETE CASCADE,
    commit_id       BIGINT      REFERENCES commits(id)   ON DELETE CASCADE,
    author          TEXT,
    confidence      FLOAT       NOT NULL DEFAULT 0,
    explanation     TEXT,
    recommendation  TEXT,
    affected_files  TEXT        NOT NULL DEFAULT '[]',
    blast_radius    TEXT        NOT NULL DEFAULT 'medium',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyses_run ON analyses (run_id);

CREATE TABLE IF NOT EXISTS upload_sessions (
    id           BIGSERIAL PRIMARY KEY,
    type         TEXT        NOT NULL,
    filename     TEXT,
    record_count INTEGER     NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""


def init_db() -> None:
    log.info("Initialising PostgreSQL schema …")
    with get_db() as conn:
        for stmt in _SCHEMA.strip().split(";"):
            stmt = stmt.strip()
            if stmt:
                conn.execute(stmt + ";")
        conn.commit()
    log.info("PostgreSQL schema ready.")
