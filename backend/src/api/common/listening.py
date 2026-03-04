import httpx
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import sys

from config.database import get_db
from api.dependencies import get_current_user
from models.user import User
from models.conversation import Conversation
from utils.snowflake import generate_id

# Ensure project root is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(current_dir))))
if project_root not in sys.path:
    sys.path.append(project_root)

from agent.listening_agent.summarizer import generate_medical_summary, generate_treatment_plan

router = APIRouter(prefix="/patient/listening", tags=["Patient Listening Agent"])

# Model server URL — Whisper runs here independently (never restarts with backend)
MODEL_SERVER_URL = os.environ.get("MODEL_SERVER_URL", "http://localhost:6000")


async def _call_transcribe(audio_bytes: bytes, filename: str = "audio") -> str:
    """Send audio bytes to the model server and return transcribed text."""
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{MODEL_SERVER_URL}/transcribe",
                files={"audio": (filename, audio_bytes, "application/octet-stream")},
            )
            response.raise_for_status()
            return response.json().get("text", "")
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Model server is not running. Start it with: python backend/model_server/server.py",
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Model server timed out.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Model server error: {exc}")

class TreatmentPlanRequest(BaseModel):
    transcript: str
    summary: Optional[str] = None
    session_notes: Optional[str] = None
    mental_health_only: Optional[bool] = True

class SummarizeRequest(BaseModel):
    transcript: str
    mental_health_only: Optional[bool] = True

@router.post("/transcribe-summarize")
async def transcribe_and_summarize(
    files: List[UploadFile] = File(...),
    speakers: List[str] = Form(...),
    mental_health_only: bool = Form(True),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Transcribe audio files and generate medical summary.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No audio files provided.")

    if len(files) != len(speakers):
        raise HTTPException(
            status_code=400,
            detail="Speakers count must match number of audio files.",
        )

    lines: List[str] = []

    for speaker, uploaded in zip(speakers, files):
        audio_bytes = await uploaded.read()
        if not audio_bytes:
            continue
        text = await _call_transcribe(audio_bytes, uploaded.filename or "audio")
        if text:
            lines.append(f"{speaker}: {text}")

    if not lines:
        raise HTTPException(status_code=400, detail="No audio could be decoded.")

    transcript = "\n".join(lines)
    
    try:
        from agent.listening_agent.summarizer import MENTAL_HEALTH_SUMMARY_PROMPT, GENERAL_MEDICAL_SUMMARY_PROMPT
        prompt = MENTAL_HEALTH_SUMMARY_PROMPT if mental_health_only else GENERAL_MEDICAL_SUMMARY_PROMPT
        
        summary = generate_medical_summary(transcript=transcript, custom_prompt=prompt)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to summarize transcript: {exc}")

    # Save to PostgreSQL Database
    try:
        new_conv = Conversation(
            id=generate_id(),
            patient_id=current_user.id,
            status="closed",
            summary=summary
        )
        db.add(new_conv)
        db.commit()
    except Exception as e:
        print(f"Error saving to db: {e}")

    return {
        "transcript": transcript,
        "summary": summary
    }

@router.post("/transcribe-chunk")
async def transcribe_chunk(
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Transcribe a single audio chunk in real-time.
    Called repeatedly by the frontend MediaRecorder as chunks arrive.
    Returns just the transcribed text for that chunk.
    """
    audio_bytes = await audio.read()
    if not audio_bytes or len(audio_bytes) < 1000:
        return {"text": ""}
    try:
        text = await _call_transcribe(audio_bytes, audio.filename or "chunk")
        return {"text": text or ""}
    except HTTPException:
        # Don't fail the real-time session on a bad chunk
        return {"text": ""}


@router.post("/summarize")
async def summarize_transcript(
    payload: SummarizeRequest,
    current_user: User = Depends(get_current_user)
):
    if not payload.transcript or not payload.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty.")

    try:
        from agent.listening_agent.summarizer import MENTAL_HEALTH_SUMMARY_PROMPT, GENERAL_MEDICAL_SUMMARY_PROMPT
        prompt = MENTAL_HEALTH_SUMMARY_PROMPT if payload.mental_health_only else GENERAL_MEDICAL_SUMMARY_PROMPT
        
        summary = generate_medical_summary(transcript=payload.transcript, custom_prompt=prompt)
        return {"summary": summary}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {exc}")

@router.post("/generate-treatment-plan")
async def build_treatment_plan(
    payload: TreatmentPlanRequest,
    current_user: User = Depends(get_current_user)
):
    if not payload.transcript or not payload.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty.")

    try:
        plan = generate_treatment_plan(transcript=payload.transcript)
        return {"treatment_plan": plan}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to generate treatment plan: {exc}")
