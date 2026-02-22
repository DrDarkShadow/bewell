from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
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

# Import the intern's agents
from agent.listening_agent.transcriber import WhisperTranscriber
from agent.listening_agent.summarizer import generate_medical_summary, generate_treatment_plan

router = APIRouter(prefix="/patient/listening", tags=["Patient Listening Agent"])

# Initialize transcriber once to avoid reloading model
transcriber = WhisperTranscriber()

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
        try:
            text = transcriber.transcribe_bytes(audio_bytes)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Failed to decode audio: {exc}")
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
        # Too small to transcribe meaningfully (< 1KB = silence/noise)
        return {"text": ""}
    try:
        text = transcriber.transcribe_bytes(audio_bytes)
        return {"text": text or ""}
    except Exception as exc:
        # Don't fail the whole session on a bad chunk — just skip it
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
