"""
Release Incident Correlator — FastAPI application factory.

All business logic lives in routers/ and services/.
This file is intentionally thin: wire up middleware, routers, and startup.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS
from database import init_db
from routers import health, upload, analysis, stats, chat

# ── App factory ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="Release Incident Correlator API",
    version="2.0.0",
    description="Correlates production incidents to their likely root-cause git commits using AI.",
)

# ── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Database initialisation ───────────────────────────────────────────────────

@app.on_event("startup")
def on_startup():
    init_db()

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(health.router)
app.include_router(upload.router)
app.include_router(analysis.router)
app.include_router(stats.router)
app.include_router(chat.router)

# ── Dev entry-point ───────────────────────────────────────────────────────────
 
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
