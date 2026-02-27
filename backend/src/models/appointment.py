from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, Integer, Text, Boolean, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from config.database import Base

class AppointmentRequest(Base):
    """
    Centralized broadcast request when a patient escalates to a professional.
    Can be sent to multiple professionals simultaneously.
    """
    __tablename__ = "appointment_requests"
    
    id = Column(BigInteger, primary_key=True, index=True)
    patient_id = Column(BigInteger, ForeignKey('users.id'), nullable=False, index=True)
    
    status = Column(String(50), default="pending")  # pending, fulfilled, canceled
    
    # Payload
    encrypted_summary = Column(Text, nullable=True) # AI generated chat summary
    patient_note = Column(Text, nullable=True)      # Optional context from patient
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    receivers = relationship("RequestReceiver", back_populates="appointment_request", cascade="all, delete-orphan")


class RequestReceiver(Base):
    """
    Joining table linking a doctor to a specific broadcast request.
    Allows multiple doctors to see the single request.
    """
    __tablename__ = "request_receivers"
    
    id = Column(BigInteger, primary_key=True, index=True)
    request_id = Column(BigInteger, ForeignKey('appointment_requests.id'), nullable=False, index=True)
    professional_id = Column(BigInteger, ForeignKey('users.id'), nullable=False, index=True)
    
    status = Column(String(50), default="pending")  # pending, accepted, rejected, expired
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    appointment_request = relationship("AppointmentRequest", back_populates="receivers")


class Appointment(Base):
    """
    Therapy appointments
    """
    __tablename__ = "appointments"
    
    # Primary
    id = Column(BigInteger, primary_key=True)
    
    # Relationships
    patient_id = Column(BigInteger, ForeignKey('users.id'), nullable=False, index=True)
    professional_id = Column(BigInteger, ForeignKey('users.id'), nullable=False, index=True)
    escalation_id = Column(BigInteger, ForeignKey('escalations.id'), nullable=True)  # Optional link
    request_id = Column(BigInteger, ForeignKey('appointment_requests.id'), nullable=True) # Optional link to the broadcast request that spawned this
    
    # Appointment Details
    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    appointment_type = Column(String(50), default="therapy")  # therapy/consultation/followup
    
    # Status
    status = Column(String(50), default="scheduled")       # scheduled/confirmed/completed/cancelled
    
    # Notes
    patient_notes = Column(Text, nullable=True)            # Patient's notes before session
    therapist_notes = Column(Text, nullable=True)          # Therapist's session notes
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "patient_id": self.patient_id,
            "professional_id": self.professional_id,
            "scheduled_at": self.scheduled_at.isoformat(),
            "status": self.status
        }
