"""Health check router — exposes active AI provider info."""
from fastapi import APIRouter
from config import AI_PROVIDER, OLLAMA_URL, OLLAMA_MODEL, GROQ_MODEL, GROQ_API_KEY, TIME_WINDOW_HOURS

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    if AI_PROVIDER == "groq":
        return {
            "status":            "ok",
            "ai_provider":       "groq",
            "model":             GROQ_MODEL,
            "groq_key_set":      bool(GROQ_API_KEY),
            "time_window_hours": TIME_WINDOW_HOURS,
        }
    return {
        "status":            "ok",
        "ai_provider":       "ollama",
        "ollama_url":        OLLAMA_URL,
        "model":             OLLAMA_MODEL,
        "time_window_hours": TIME_WINDOW_HOURS,
    }
