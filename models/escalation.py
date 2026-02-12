from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, Text, Float
from datetime import datetime
from config.database import Base

class Escalation(Base):
    """
    Patient escalation to professional
    Created when consent is granted
    """
    __tablename__ = "escalations"
    
    # Primary
    id = Column(BigInteger, primary_key=True)
    
    # Relationships
    patient_id = Column(String(50), ForeignKey('users.id'), nullable=False, index=True)
    professional_id = Column(String(50), ForeignKey('users.id'), nullable=True)  # Assigned later
    conversation_id = Column(BigInteger, ForeignKey('conversations.id'), nullable=False)
    consent_id = Column(BigInteger, ForeignKey('consent_logs.id'), nullable=False)
    
    # AI Generated Summary
    summary = Column(Text, nullable=True)                  # Professional Agent output
    chief_concerns = Column(Text, nullable=True)           # JSON array
    risk_assessment = Column(String(50), nullable=True)    # low/medium/high
    recommendations = Column(Text, nullable=True)          # JSON array
    
    # Status
    status = Column(String(50), default="pending")         # pending/assigned/in_progress/resolved
    priority = Column(String(20), default="normal")        # low/normal/high/urgent
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    assigned_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "patient_id": self.patient_id,
            "professional_id": self.professional_id,
            "status": self.status,
            "priority": self.priority,
            "risk_assessment": self.risk_assessment,
            "created_at": self.created_at.isoformat()
        }
