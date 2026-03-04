from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import desc, text
from typing import List, Optional, Dict
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
from models.professional import ProfessionalProfile
from models.appointment import AppointmentRequest, RequestReceiver, Appointment
from models.conversation import Conversation, Message
from schemas.escalation import EscalateRequestCreate, AddDoctorRequest, EscalationResponse, RequestStatusResponse
from utils.snowflake import generate_id
from agent.chatbot.agent import agent

router = APIRouter(tags=["Escalations"])

# --- WebSocket Connection Manager ---
class ConnectionManager:
    def __init__(self):
        # Maps user_id to a list of active WebSocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except BaseException:
                    pass

manager = ConnectionManager()

# --- 1. Get Professionals ---
@router.get("/patient/professionals")
async def get_professionals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a list of available professionals for the directory page.
    """
    query = text("""
        SELECT u.id, u.name, u.email, p.specialization, p.consultation_fee, p.average_rating 
        FROM users u 
        LEFT JOIN professional_profiles p ON u.id = p.user_id 
        WHERE u.role = 'PROFESSIONAL' AND u.is_deleted = false
    """)
    results = db.execute(query).fetchall()
    
    professionals = []
    for row in results:
        professionals.append({
            "id": str(row.id),
            "name": row.name,
            "email": row.email,
            "specialty": row.specialization if row.specialization else "Therapist",
            "fee": float(row.consultation_fee) if row.consultation_fee else 150.0,
            "rating": float(row.average_rating) if row.average_rating else 4.8,
            "next_available": "Today"
        })
        
    return professionals


# --- 2. Create Escalation Request (Centralized) ---
@router.post("/patient/escalate/request", response_model=EscalationResponse)
async def create_escalation_request(
    request: EscalateRequestCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        user_id = int(current_user.get("sub"))
        
        # 1. Fetch patient's latest active conversation to summarize
        latest_conv = db.query(Conversation).filter(
            Conversation.patient_id == user_id
        ).order_by(desc(Conversation.started_at)).first()
        
        summary_text = "No recent conversation found."
        
        if request.share_summary and latest_conv:
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
        elif not request.share_summary:
            summary_text = "Patient withheld consent for AI summary sharing."
        
        # 2. Create the unified AppointmentRequest record
        request_id = generate_id()
        appt_request = AppointmentRequest(
            id=request_id,
            patient_id=user_id,
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
                professional_id=int(doc_id),
                status="pending"
            )
            db.add(receiver)
            
        db.commit()
        db.refresh(appt_request)
        
        # Broadcast to doctors in background
        user_obj = db.query(User).filter(User.id == user_id).first()
        patient_name = user_obj.name if user_obj and user_obj.name else "A Patient"
        
        for doc_id in request.doctor_ids:
            # We need to await inside an async function so we launch it via FastAPI's background tasks
            # OR since we are inside `async def create_escalation_request`, we can just `await` directly!
            payload = {
                "type": "new_request",
                "request_id": str(request_id),
                "patient_name": patient_name,
                "note": request.note,
                "created_at": appt_request.created_at.isoformat() if appt_request.created_at else None
            }
            await manager.send_personal_message(payload, int(doc_id))
        
        return {"request_id": str(request_id), "status": "pending"}
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"CRASH IN ESCALATION: {error_trace}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}\n\nTraceback: {error_trace}")


# --- 3. Add Another Doctor to Existing Request (No Waiting) ---
@router.post("/patient/escalate/request/{request_id}/add-doctor")
async def add_doctor_to_request(
    request_id: int,
    request: AddDoctorRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user.get("sub"))
    
    # Verify request belongs to patient and is still pending
    appt_request = db.query(AppointmentRequest).filter(
        AppointmentRequest.id == request_id,
        AppointmentRequest.patient_id == user_id,
        AppointmentRequest.status == "pending"
    ).first()
    
    if not appt_request:
        raise HTTPException(status_code=404, detail="Active request not found")
        
    # Check if doctor is already in receivers
    existing = db.query(RequestReceiver).filter(
        RequestReceiver.request_id == request_id,
        RequestReceiver.professional_id == int(request.doctor_id)
    ).first()
    
    if existing:
        return {"status": "already_added"}
        
    receiver = RequestReceiver(
        id=generate_id(),
        request_id=request_id,
        professional_id=int(request.doctor_id),
        status="pending"
    )
    db.add(receiver)
    db.commit()
    
    return {"status": "added"}


# --- 3.5. Withdraw a Doctor from Active Request ---
@router.delete("/patient/escalate/request/{request_id}/withdraw-doctor/{doctor_id}")
async def withdraw_doctor_from_request(
    request_id: int,
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user.get("sub"))
    
    # Verify request belongs to this patient and is still pending
    appt_request = db.query(AppointmentRequest).filter(
        AppointmentRequest.id == request_id,
        AppointmentRequest.patient_id == user_id,
        AppointmentRequest.status == "pending"
    ).first()
    
    if not appt_request:
        raise HTTPException(status_code=404, detail="Active request not found")
    
    # Delete the receiver record for this doctor
    db.query(RequestReceiver).filter(
        RequestReceiver.request_id == request_id,
        RequestReceiver.professional_id == doctor_id,
        RequestReceiver.status == "pending"
    ).delete()
    db.commit()
    
    # If no receivers remain, cancel the whole request
    remaining = db.query(RequestReceiver).filter(
        RequestReceiver.request_id == request_id
    ).count()
    
    if remaining == 0:
        appt_request.status = "cancelled"
        db.commit()
        return {"status": "request_cancelled"}
    
    return {"status": "withdrawn"}


# --- 4. Polling Status for Patient ---
@router.get("/patient/escalate/request/{request_id}/status", response_model=RequestStatusResponse)
async def check_request_status(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user.get("sub"))
    
    # Use expire_all to force fresh data from database
    db.expire_all()
    
    appt_request = db.query(AppointmentRequest).filter(
        AppointmentRequest.id == request_id,
        AppointmentRequest.patient_id == user_id
    ).first()
    
    if not appt_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # If pending but no receivers remain, auto-cancel it
    if appt_request.status == "pending":
        remaining = db.query(RequestReceiver).filter(
            RequestReceiver.request_id == request_id,
            RequestReceiver.status == "pending"
        ).count()
        if remaining == 0:
            appt_request.status = "cancelled"
            db.commit()
            db.refresh(appt_request)
        
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


# --- 4.5. Get Current Active Request for Patient ---
@router.get("/patient/escalate/request/current")
async def get_current_escalation_request(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user.get("sub"))
    
    appt_request = db.query(AppointmentRequest).filter(
        AppointmentRequest.patient_id == user_id,
        AppointmentRequest.status == "pending"
    ).first()
    
    if not appt_request:
        return {"has_active": False}
        
    # Return only PENDING receivers — rejected ones should revert to "Send Request"
    receivers = db.query(RequestReceiver).filter(
        RequestReceiver.request_id == appt_request.id,
        RequestReceiver.status == "pending"
    ).all()
    
    # If no pending receivers remain (all rejected/withdrawn), treat as no active request
    if not receivers:
        appt_request.status = "expired"
        db.commit()
        return {"has_active": False}
    
    return {
        "has_active": True,
        "request_id": str(appt_request.id),
        "requested_doctor_ids": [str(r.professional_id) for r in receivers]
    }


# --- 5. Get Active Pending Requests for a Doctor ---
@router.get("/doctor/escalate/requests")
async def get_doctor_requests(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_professional)
):
    user_id = int(current_user.get("sub")) if isinstance(current_user, dict) else current_user.id
    
    # Force fresh data from database
    db.expire_all()
    
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
        else:
            # Master request is no longer pending, mark this receiver as rejected
            r.status = "rejected"
            db.commit()
            
    return results


# --- 6. Doctor Accepts the Request ---
@router.post("/doctor/escalate/request/{request_id}/accept")
async def doctor_accept_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_professional)
):
    try:
        user_id = int(current_user.get("sub")) if isinstance(current_user, dict) else current_user.id
        
        print(f"[Accept] Doctor {user_id} attempting to accept request {request_id}")
        
        # Find master request (removed with_for_update for SQLite compatibility)
        appt_request = db.query(AppointmentRequest).filter(
            AppointmentRequest.id == request_id,
            AppointmentRequest.status == "pending"
        ).first()
        
        if not appt_request:
            print(f"[Accept] Request {request_id} not found or not pending")
            raise HTTPException(status_code=400, detail="Request is no longer available or already fulfilled")
        
        print(f"[Accept] Found request {request_id}, patient_id={appt_request.patient_id}")
        
        # Verify this doctor actually has a pending receiver for this request
        my_receiver = db.query(RequestReceiver).filter(
            RequestReceiver.request_id == request_id,
            RequestReceiver.professional_id == user_id,
            RequestReceiver.status == "pending"
        ).first()
        
        if not my_receiver:
            print(f"[Accept] Doctor {user_id} has no pending receiver for request {request_id}")
            raise HTTPException(status_code=400, detail="You don't have a pending request for this appointment")
        
        print(f"[Accept] Doctor {user_id} has valid pending receiver")
            
        # Mark master as fulfilled
        appt_request.status = "fulfilled"
        
        # Get all receivers for this request
        all_receivers = db.query(RequestReceiver).filter(
            RequestReceiver.request_id == request_id
        ).all()
        
        print(f"[Accept] Found {len(all_receivers)} receivers to update")
        
        # Update each receiver individually to avoid synchronize_session issues
        for receiver in all_receivers:
            if receiver.professional_id == user_id:
                receiver.status = "accepted"
            else:
                receiver.status = "rejected"
        
        print(f"[Accept] Creating appointment...")
        
        # Create the final appointment
        from datetime import timedelta
        new_appt = Appointment(
            id=generate_id(),
            patient_id=appt_request.patient_id,
            professional_id=user_id,
            request_id=request_id,
            scheduled_at=datetime.utcnow() + timedelta(days=1),
            patient_notes=appt_request.patient_note,
            therapist_notes=appt_request.encrypted_summary,
            status="confirmed",
            appointment_type="therapy",
            duration_minutes=60
        )
        db.add(new_appt)
        
        print(f"[Accept] Committing changes...")
        
        # Commit all changes before sending notifications
        db.commit()
        db.refresh(appt_request)
        db.refresh(new_appt)
        
        print(f"[Accept] Appointment {new_appt.id} created successfully")
        
        # Fetch doctor name for notification
        doctor = db.query(User).filter(User.id == user_id).first()
        doctor_name = doctor.name if doctor else "Your Doctor"
        
        print(f"[Accept] Sending WebSocket notifications...")
        
        # Notify the patient in real-time via WebSocket
        await manager.send_personal_message({
            "type": "request_accepted",
            "request_id": str(request_id),
            "doctor_name": doctor_name,
            "appointment_id": str(new_appt.id),
            "accepted_by": str(user_id)
        }, appt_request.patient_id)
        
        # Notify all doctors who had this request so they remove the card
        for recv in all_receivers:
            # Notify ALL doctors including the one who accepted (for UI consistency)
            await manager.send_personal_message({
                "type": "request_fulfilled",
                "request_id": str(request_id)
            }, recv.professional_id)
        
        print(f"[Accept] Success! Returning response")
        
        return {"status": "success", "appointment_id": str(new_appt.id)}
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR IN ACCEPT ENDPOINT: {error_trace}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


# --- 6.5. Doctor Rejects the Request ---
@router.post("/doctor/escalate/request/{request_id}/reject")
async def doctor_reject_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_professional)
):
    user_id = int(current_user.get("sub")) if isinstance(current_user, dict) else current_user.id
    
    # Mark this doctor's receiver as rejected
    db.query(RequestReceiver).filter(
        RequestReceiver.request_id == request_id, 
        RequestReceiver.professional_id == user_id,
        RequestReceiver.status == "pending"
    ).update({"status": "rejected"})
    
    db.commit()
    
    # Check if ALL receivers have now rejected — if so, notify the patient
    remaining = db.query(RequestReceiver).filter(
        RequestReceiver.request_id == request_id,
        RequestReceiver.status == "pending"
    ).count()
    
    if remaining == 0:
        appt_request = db.query(AppointmentRequest).filter(
            AppointmentRequest.id == request_id
        ).first()
        if appt_request and appt_request.status == "pending":
            appt_request.status = "expired"
            db.commit()
            await manager.send_personal_message({
                "type": "request_expired",
                "request_id": str(request_id)
            }, appt_request.patient_id)
    
    return {"status": "success"}


# --- 7. Doctor WebSocket Endpoint ---
@router.websocket("/ws/doctor/{user_id}")
async def doctor_websocket(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


# --- 7.5. Patient WebSocket Endpoint ---
@router.websocket("/ws/patient/{user_id}")
async def patient_websocket(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)


# --- 8. Doctor Dashboard Democking ---
@router.get("/doctor/dashboard")
async def get_doctor_dashboard_data(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_professional)
):
    user_id = int(current_user.get("sub")) if isinstance(current_user, dict) else current_user.id
    
    # 1. Active Patients / Recent Patients
    # We find unique patients from Appointments.
    recent_patients_query = text("""
        SELECT u.name, u.email, MAX(a.scheduled_at) as last_session, COUNT(a.id) as sessions
        FROM appointments a
        JOIN users u ON a.patient_id = u.id
        WHERE a.professional_id = :prof_id
        GROUP BY u.name, u.email
        ORDER BY last_session DESC
        LIMIT 10
    """)
    recent_results = db.execute(recent_patients_query, {"prof_id": user_id}).fetchall()
    
    recent_patients = []
    for row in recent_results:
        initials = "".join([n[0] for n in row.name.split(" ") if n])[:2].upper()
        recent_patients.append({
            "name": row.name,
            "initials": initials,
            "lastSession": row.last_session.isoformat() if row.last_session else "N/A",
            "sessions": row.sessions,
            "stressScore": 50, # Mock since we don't track aggregate score per patient right now
            "trend": "stable",
            "nextSession": "Unscheduled"
        })
        
    # 2. Upcoming Sessions (in the future)
    upcoming_query = text("""
        SELECT u.name, a.scheduled_at, a.appointment_type 
        FROM appointments a
        JOIN users u ON a.patient_id = u.id
        WHERE a.professional_id = :prof_id 
        AND a.scheduled_at > :now
        ORDER BY a.scheduled_at ASC
        LIMIT 5
    """)
    upcoming_results = db.execute(upcoming_query, {"prof_id": user_id, "now": datetime.utcnow()}).fetchall()
    
    upcoming_sessions = []
    for row in upcoming_results:
        initials = "".join([n[0] for n in row.name.split(" ") if n])[:2].upper()
        # Parse ISO date safely
        dt = row.scheduled_at
        if isinstance(dt, str):
            dt = datetime.fromisoformat(dt)
            
        upcoming_sessions.append({
            "patient": row.name,
            "initials": initials,
            "time": dt.strftime("%I:%M %p"),
            "date": dt.strftime("%b %d"),
            "type": row.appointment_type.capitalize()
        })
        
    return {
        "recentPatients": recent_patients,
        "upcomingSessions": upcoming_sessions,
        "activePatientsCount": len(recent_patients),
        "sessionsThisWeek": len(upcoming_sessions),
        "flaggedAlerts": 0,
        "aiSummariesReady": len(recent_patients) # just a proxy stat
    }


# --- 9. Get Patient Appointments ---
@router.get("/patient/appointments")
async def get_patient_appointments(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user.get("sub"))
    
    # Get all appointments for this patient
    appointments = db.query(Appointment).filter(
        Appointment.patient_id == user_id
    ).order_by(desc(Appointment.scheduled_at)).all()
    
    results = []
    for appt in appointments:
        # Fetch doctor details
        doctor = db.query(User).filter(User.id == appt.professional_id).first()
        doc_profile = db.query(ProfessionalProfile).filter(ProfessionalProfile.user_id == appt.professional_id).first()
        
        results.append({
            "id": str(appt.id),
            "doctor_id": str(appt.professional_id),
            "doctor_name": doctor.name if doctor else "Unknown",
            "specialty": doc_profile.specialization if doc_profile else "Therapist",
            "scheduled_at": appt.scheduled_at.isoformat() if appt.scheduled_at else None,
            "status": appt.status,
            "type": appt.appointment_type,
            "duration_minutes": appt.duration_minutes
        })
        
    return results
