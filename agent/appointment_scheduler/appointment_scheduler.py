"""
AWS Bedrock-powered Appointment Scheduler
Intelligently processes natural language appointment requests
"""

import json
from datetime import datetime
import os
from langchain_aws import ChatBedrock
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import Optional

import sys
import os

# Ensure backend root is in path to import settings
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
if backend_root not in sys.path:
    sys.path.append(backend_root)

from backend.src.config.settings import settings

# Initialize Bedrock LLM
llm = ChatBedrock(
    model_id=settings.BEDROCK_MODEL_ID,
    region_name=settings.AWS_REGION,
    temperature=0.3,
    model_kwargs={"max_tokens": 1024}
)


class Message(BaseModel):
    role: str
    content: str

class AppointmentRequest(BaseModel):
    message: str
    conversation_history: Optional[list[Message]] = None
    existing_appointment: Optional[dict] = None

class AppointmentExtraction(BaseModel):
    """Extracted appointment details from natural language"""
    date: Optional[str] = Field(None, description="Preferred date (YYYY-MM-DD format)")
    time: Optional[str] = Field(None, description="Preferred time (HH:MM format)")
    description: Optional[str] = Field(None, description="Additional notes or requirements")
    confidence: float = Field(default=0.0, description="Confidence score (0-1)")
    is_complete: bool = Field(default=False, description="Whether enough info was provided")
    clarification_needed: Optional[str] = Field(None, description="What additional info is needed")


class AppointmentResponse(BaseModel):
    """Response for appointment scheduling"""
    success: bool
    message: str
    appointment: Optional[dict] = None
    next_question: Optional[str] = None
    extracted_data: Optional[AppointmentExtraction] = None


def extract_appointment_details(user_message: str, conversation_history: list = None) -> AppointmentExtraction:
    """
    Use AWS Bedrock to extract appointment details from natural language
    """
    
    prompt_template = PromptTemplate(
        input_variables=["user_message", "history"],
        template="""You are an appointment scheduling assistant. Extract appointment details from the user's message.

Conversation context:
{history}

User message: {user_message}

Extract the following in JSON format:
- date: The appointment date mentioned (YYYY-MM-DD format, or null)
- time: The appointment time mentioned (HH:MM format, or null)
- description: Any additional notes or specific requirements
- confidence: Your confidence in the extracted data (0.0 to 1.0)
- is_complete: Whether you have enough info to book (true/false)
- clarification_needed: What additional info is needed (or null if you have everything)

Return ONLY valid JSON, no additional text."""
    )
    
    # Build conversation history
    history_text = ""
    if conversation_history:
        for msg in conversation_history[-5:]:  # Last 5 messages for context
            role = msg.get("role", "user")
            content = msg.get("content", "")
            history_text += f"{role.capitalize()}: {content}\n"
    
    # Create prompt
    prompt = prompt_template.format(
        user_message=user_message,
        history=history_text or "No previous messages"
    )
    
    try:
        # Call Bedrock
        response = llm.invoke(prompt)
        response_text = response.content
        
        # Parse JSON
        json_start = response_text.find("{")
        json_end = response_text.rfind("}") + 1
        
        if json_start >= 0 and json_end > json_start:
            json_str = response_text[json_start:json_end]
            data = json.loads(json_str)
            return AppointmentExtraction(**data)
        else:
            return AppointmentExtraction(
                is_complete=False,
                clarification_needed="Could not parse appointment details"
            )
    except Exception as e:
        return AppointmentExtraction(
            is_complete=False,
            clarification_needed=f"Error processing request: {str(e)}"
        )


def generate_appointment_response(
    user_message: str,
    conversation_history: list = None,
    existing_appointment_data: dict = None
) -> AppointmentResponse:
    """
    Generate a smart response for appointment scheduling using Bedrock
    """
    
    # Extract appointment details
    extracted = extract_appointment_details(user_message, conversation_history)
    
    # Build appointment object if we have all details
    appointment = None
    if existing_appointment_data:
        appointment = existing_appointment_data.copy()
        if extracted.date:
            appointment["date"] = extracted.date
        if extracted.time:
            appointment["time"] = extracted.time
        if extracted.description:
            appointment["description"] = extracted.description
    else:
        if extracted.date and extracted.time and extracted.description:
            appointment = {
                "date": extracted.date,
                "time": extracted.time,
                "description": extracted.description,
                "domain": "Mental Health",
                "status": "Confirmed"
            }
    
    # Generate response
    if extracted.is_complete and appointment:
        # All information provided - ready to book
        response_message = f"""Perfect! ✅ I've got all the details for your mental health appointment:

📅 **Date**: {appointment.get('date')}
🕐 **Time**: {appointment.get('time')}
💬 **Notes**: {appointment.get('description') or 'None'}

Your appointment has been confirmed! You'll receive a reminder 24 hours before your session. Is there anything else you'd like to adjust?"""
        
        return AppointmentResponse(
            success=True,
            message=response_message,
            appointment=appointment,
            extracted_data=extracted
        )
    
    elif extracted.clarification_needed:
        # Need more information
        response_message = f"""Great! I'm gathering your appointment details. {extracted.clarification_needed}

Could you please provide this information so I can complete your booking?"""
        
        return AppointmentResponse(
            success=False,
            message=response_message,
            next_question=extracted.clarification_needed,
            extracted_data=extracted
        )
    
    else:
        # Generic guidance
        response_message = """I'd be happy to help you schedule your therapy session! 

Please let me know:
1. **When** would you like to schedule? (e.g., "Next Monday at 2 PM")
2. **Any specific needs?** (e.g., "I'd prefer after work hours")
3. **Anything else** I should know about your session?

Feel free to share as much detail as you'd like!"""
        
        return AppointmentResponse(
            success=False,
            message=response_message,
            extracted_data=extracted
        )


def validate_appointment_date_time(date_str: str, time_str: str) -> tuple[bool, str]:
    """Validate that date and time are in the future"""
    try:
        appointment_dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        if appointment_dt <= datetime.now():
            return False, "Appointment date and time must be in the future"
        return True, "Valid"
    except ValueError:
        return False, "Invalid date or time format"
