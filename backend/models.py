"""
Pydantic response/request models for the API.
"""
from pydantic import BaseModel
from typing import Optional, List


class HealthResponse(BaseModel):
    status: str
    ollama_url: str
    model: str
    time_window_hours: int


class UploadResponse(BaseModel):
    message: str
    count: int


class StatsResponse(BaseModel):
    incidents: int
    commits: int
    analyses: int
    runs: int
    avg_confidence: float
    last_upload: Optional[str]


class AnalysisResult(BaseModel):
    run_id: str
    run_label: Optional[str]
    incident_id: str
    incident_title: Optional[str]
    incident_description: Optional[str]
    severity: Optional[str]
    commit_id: str
    commit_message: Optional[str]
    author: Optional[str]
    confidence: float
    explanation: Optional[str]
    recommendation: Optional[str]
    affected_files: List[str]
    blast_radius: Optional[str]
    files_changed: List[str]
    branch: Optional[str]
    created_at: str


class RunSummary(BaseModel):
    run_id: str
    run_label: str
    created_at: str
    incident_count: int
    avg_confidence: float
