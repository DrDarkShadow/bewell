from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime
import json
import os
import sys

# Ensure project root is in path to import the agent
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(current_dir))))
if project_root not in sys.path:
    sys.path.append(project_root)

from config.database import get_db
from api.dependencies import get_current_user, require_professional
from models.user import User, UserRole
from models.appointment import AppointmentRequest, RequestReceiver, Appointment
from models.conversation import Conversation, Message
from schemas.escalation import EscalateRequestCreate, AddDoctorRequest, EscalationResponse, RequestStatusResponse
from utils.snowflake import generate_id
from agent.chatbot.agent import agent

router = APIRouter(tags=["Escalations"])

# --- 1. Get Professionals ---
@router.get("/patient/professionals")
async def get_professionals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a list of available professionals for the directory page.
    """
    professionals = db.query(User).filter(User.role == UserRole.PROFESSIONAL, User.is_deleted == False).all()
    
    return [{
        "id": str(p.id),
        "name": p.name,
        "email": p.email,
        # Mocking extra data since we don't have specialties/fees yet
        "specialty": "Therapist",
        "fee": 150,
        "rating": 4.8,
        "next_available": "Today"
    } for p in professionals]


# --- 2. Create Escalation Request (Centralized) ---
@router.post("/patient/escalate/request", response_model=EscalationResponse)
async def create_escalation_request(
    request: EscalateRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Fetch patient's latest active conversation to summarize
    latest_conv = db.query(Conversation).filter(
        Conversation.patient_id == current_user.id
    ).order_by(desc(Conversation.created_at)).first()
    
    summary_text = "No recent conversation found."
    
    if latest_conv:
        messages = db.query(Message).filter(Message.conversation_id == latest_conv.id).order_by(Message.timestamp.asc()).all()
        if messages:
            chat_transcript = "\n".join([f"{'Patient' if m.sender_type == 'patient' else 'AI'}: {m.content}" for m in messages[-20:]])
            
            summary_prompt = f"Please generate a brief, clinical summary of the following conversation for a therapist. Focus on the core issues and emotional state. Conversation:\n{chat_transcript}"
            
            try:
                # Use Bedrock agent to summarize
                result = agent.invoke({"messages": [{"role": "user", "content": summary_prompt}]})
                ai_content = result["messages"][-1].content
                if isinstance(ai_content, list):
                    summary_text = "".join(b["text"] for b in ai_content if "text" in b)
                else:
                    summary_text = str(ai_content)
                    
                import re
                summary_text = re.sub(r'<thinking>.*?<\/thinking>', '', summary_text, flags=re.DOTALL).strip()
            except Exception as e:
                summary_text = f"Failed to generate summary: {str(e)}"
    
    # 2. Create the unified AppointmentRequest record
    request_id = generate_id()
    appt_request = AppointmentRequest(
        id=request_id,
        patient_id=current_user.id,
        encrypted_summary=summary_text, # Assuming frontend handles encryption/decryption or just private column
        patient_note=request.note,
        status="pending"
    )
    db.add(appt_request)
    
    # 3. Create receivers (the doctors being pinged)
    for doc_id in request.doctor_ids:
        receiver = RequestReceiver(
            id=generate_id(),
            request_id=request_id,
            professional_id=doc_id,
            status="pending"
        )
        db.add(receiver)
        
    db.commit()
    
    return {"request_id": str(request_id), "status": "pending"}


# --- 3. Add Another Doctor to Existing Request (No Waiting) ---
@router.post("/patient/escalate/request/{request_id}/add-doctor")
async def add_doctor_to_request(
    request_id: int,
    request: AddDoctorRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify request belongs to patient and is still pending
    appt_request = db.query(AppointmentRequest).filter(
        AppointmentRequest.id == request_id,
        AppointmentRequest.patient_id == current_user.id,
        AppointmentRequest.status == "pending"
    ).first()
    
    if not appt_request:
        raise HTTPException(status_code=404, detail="Active request not found")
        
    # Check if doctor is already in receivers
    existing = db.query(RequestReceiver).filter(
        RequestReceiver.request_id == request_id,
        RequestReceiver.professional_id == request.doctor_id
    ).first()
    
    if existing:
        return {"status": "already_added"}
        
    receiver = RequestReceiver(
        id=generate_id(),
        request_id=request_id,
        professional_id=request.doctor_id,
        status="pending"
    )
    db.add(receiver)
    db.commit()
    
    return {"status": "added"}


# --- 4. Polling Status for Patient ---
@router.get("/patient/escalate/request/{request_id}/status", response_model=RequestStatusResponse)
async def check_request_status(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    appt_request = db.query(AppointmentRequest).filter(
        AppointmentRequest.id == request_id,
        AppointmentRequest.patient_id == current_user.id
    ).first()
    
    if not appt_request:
        raise HTTPException(status_code=404, detail="Request not found")
        
    accepted_by = None
    if appt_request.status == "fulfilled":
        accepted_receiver = db.query(RequestReceiver).filter(
            RequestReceiver.request_id == request_id, 
            RequestReceiver.status == "accepted"
        ).first()
        if accepted_receiver:
            accepted_by = str(accepted_receiver.professional_id)
            
    return {
        "request_id": str(request_id),
        "status": appt_request.status,
        "accepted_by": accepted_by
    }


# --- 5. Get Active Pending Requests for a Doctor ---
@router.get("/doctor/escalate/requests")
async def get_doctor_requests(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_professional)
):
    user_id = current_user.get("user_id") if isinstance(current_user, dict) else current_user.id
    
    # Get all pending receivers for this doctor
    receivers = db.query(RequestReceiver).filter(
        RequestReceiver.professional_id == user_id,
        RequestReceiver.status == "pending"
    ).all()
    
    results = []
    for r in receivers:
        # Check if the master request is still pending
        req = db.query(AppointmentRequest).filter(
            AppointmentRequest.id == r.request_id,
            AppointmentRequest.status == "pending"
        ).first()
        
        if req:
            # Fetch patient details safely
            patient = db.query(User).filter(User.id == req.patient_id).first()
            patient_name = patient.name if patient else "Unknown Patient"
            
            results.append({
                "request_id": str(req.id),
                "patient_name": patient_name,
                "note": req.patient_note,
                "created_at": req.created_at.isoformat()
            })
            
    return results


# --- 6. Doctor Accepts the Request ---
@router.post("/doctor/escalate/request/{request_id}/accept")
async def doctor_accept_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_professional)
):
    user_id = current_user.get("user_id") if isinstance(current_user, dict) else current_user.id
    
    # Find master request
    appt_request = db.query(AppointmentRequest).filter(
        AppointmentRequest.id == request_id,
        AppointmentRequest.status == "pending"
    ).with_for_update().first() # Lock the row to prevent race conditions
    
    if not appt_request:
        raise HTTPException(status_code=400, detail="Request is no longer available or already fulfilled")
        
    # Mark master as fulfilled
    appt_request.status = "fulfilled"
    
    # Mark all receivers as rejected first
    db.query(RequestReceiver).filter(RequestReceiver.request_id == request_id).update({"status": "rejected"})
    
    # Then mark this doctor's receiver as accepted
    db.query(RequestReceiver).filter(
        RequestReceiver.request_id == request_id, 
        RequestReceiver.professional_id == user_id
    ).update({"status": "accepted"})
    
    # Create the final appointment
    # We schedule it slightly in the future as a placeholder (e.g. tomorrow)
    # The actual system might let doctors pick available slots
    from datetime import timedelta
    new_appt = Appointment(
        id=generate_id(),
        patient_id=appt_request.patient_id,
        professional_id=user_id,
        request_id=request_id,
        scheduled_at=datetime.utcnow() + timedelta(days=1),
        patient_notes=appt_request.patient_note,
        therapist_notes=appt_request.encrypted_summary, # Provide the decrypted summary to the therapist
        status="confirmed"
    )
    db.add(new_appt)
    db.commit()
    
    return {"status": "success", "appointment_id": str(new_appt.id)}
