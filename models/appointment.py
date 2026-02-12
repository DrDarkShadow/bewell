from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, Integer, Text
from datetime import datetime
from config.database import Base

class Appointment(Base):
    """
    Therapy appointments
    """
    __tablename__ = "appointments"
    
    # Primary
    id = Column(BigInteger, primary_key=True)
    
    # Relationships
    patient_id = Column(String(50), ForeignKey('users.id'), nullable=False, index=True)
    professional_id = Column(String(50), ForeignKey('users.id'), nullable=False, index=True)
    escalation_id = Column(BigInteger, ForeignKey('escalations.id'), nullable=True)  # Optional link
    
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
