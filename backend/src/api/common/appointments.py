from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from config.database import get_db
from api.dependencies import get_current_user
from models.user import User
from models.appointment import Appointment
from pydantic import BaseModel

import sys
import os

# Ensure project root is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(current_dir))))
if project_root not in sys.path:
    sys.path.append(project_root)

# Import the intern's agent
from agent.appointment_scheduler.appointment_scheduler import (
    generate_appointment_response,
    validate_appointment_date_time,
    AppointmentRequest as AgentAppointmentRequest,
    AppointmentResponse as AgentAppointmentResponse
)
from utils.snowflake import generate_id

router = APIRouter(prefix="/patient/appointments", tags=["Patient Appointments"])


@router.post("/chat", response_model=AgentAppointmentResponse)
async def appointment_chat(
    request: AgentAppointmentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Handle natural language appointment requests using AWS Bedrock in the Appointment Agent.
    """
    try:
        # Pass conversation history to the agent to extract details
        result = generate_appointment_response(
            user_message=request.message,
            conversation_history=[
                {"role": m.role, "content": m.content} for m in request.conversation_history
            ] if request.conversation_history else None,
            existing_appointment_data=request.existing_appointment
        )

        # If the agent confirms an appointment, save it to the actual PostgreSQL database
        if result.success and result.appointment:
            # We need a dummy professional_id for the database since we're auto-scheduling
            # In a real app, the Bedrock agent would let you pick a professional.
            default_pro_id = 999 

            # Validate date/time format again 
            is_valid, _ = validate_appointment_date_time(result.appointment['date'], result.appointment['time'])
            if is_valid:
                parsed_date = datetime.strptime(f"{result.appointment['date']} {result.appointment['time']}", "%Y-%m-%d %H:%M")
                
                # Save to PostgreSQL database
                new_appt = Appointment(
                    id=generate_id(),
                    patient_id=current_user.id,
                    professional_id=default_pro_id,
                    scheduled_at=parsed_date,
                    patient_notes=result.appointment.get('description', ''),
                    status="confirmed"
                )
                db.add(new_appt)
                db.commit()

        return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Appointment agent error: {str(e)}"
        )
