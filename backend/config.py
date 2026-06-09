"""
Application-wide configuration.

Loads from .env automatically via python-dotenv (dev convenience).
In production, set env vars directly — dotenv is a no-op when vars are already set.

AI Provider:
  AI_PROVIDER=groq    + GROQ_API_KEY=gsk_...   → Groq cloud (~3-8s per analysis)
  AI_PROVIDER=ollama  + OLLAMA_URL=...           → local Ollama (default)

⚠  All string values are .strip()ed to protect against trailing-space typos in .env
"""
import os
from dotenv import load_dotenv

# Load .env from the same directory as this file (backend/.env)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

def _env(key: str, default: str = "") -> str:
    """Get env var and strip surrounding whitespace + quotes."""
    return os.getenv(key, default).strip()

# ── Database (PostgreSQL only) ───────────────────────────────────────────────
CONNECTION_STRING_PSQL: str = _env("CONNECTION_STRING_PSQL", "")

# ── AI Provider ───────────────────────────────────────────────────────────────
AI_PROVIDER: str = _env("AI_PROVIDER", "ollama").lower()   # "groq" | "ollama"

# ── Groq ──────────────────────────────────────────────────────────────────────
GROQ_API_KEY: str = _env("GROQ_API_KEY", "")
GROQ_MODEL:   str = _env("GROQ_MODEL",   "llama-3.1-8b-instant")  # fast default; override in .env

# ── Ollama ────────────────────────────────────────────────────────────────────
OLLAMA_URL:   str = _env("OLLAMA_URL",   "http://localhost:11434")
OLLAMA_MODEL: str = _env("OLLAMA_MODEL", "llama3.1:8b")

# ── Correlation ───────────────────────────────────────────────────────────────
TIME_WINDOW_HOURS: int = int(_env("TIME_WINDOW_HOURS", "6"))

# ── CORS ─────────────────────────────────────────────────────────────────────
CORS_ORIGINS: list[str] = [o.strip() for o in _env("CORS_ORIGINS", "*").split(",")]
