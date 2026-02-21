from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class ActivityCreateRequest(BaseModel):
    """
    Schema for creating a new wellness activity record from the frontend
    """
    activity_type: str = Field(..., description="Type of the activity (e.g., 'breathing', 'emoji_guess', 'gratitude')")
    score: Optional[int] = Field(None, description="Score achieved (if scoring game)")
    duration_secs: Optional[int] = Field(None, description="Time spent on the activity in seconds (if timed)")
    metadata_json: Optional[Dict[str, Any]] = Field(None, description="Optional game-specific metadata payload")

class ActivityResponse(BaseModel):
    """
    Schema for returning wellness activity records to the frontend
    """
    id: str
    patient_id: str
    activity_type: str
    score: Optional[int]
    duration_secs: Optional[int]
    metadata_json: Optional[Dict[str, Any]]
    created_at: str
