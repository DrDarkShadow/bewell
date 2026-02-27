from pydantic import BaseModel, Field
from typing import List, Optional

class EscalateRequestCreate(BaseModel):
    doctor_ids: List[int] = Field(..., description="List of professional IDs to send the request to")
    note: Optional[str] = Field(None, description="Optional note for the doctors")

class AddDoctorRequest(BaseModel):
    doctor_id: int = Field(..., description="Professional ID to add to the existing request")

class EscalationResponse(BaseModel):
    request_id: str
    status: str

class RequestStatusResponse(BaseModel):
    request_id: str
    status: str
    accepted_by: Optional[str] = None
