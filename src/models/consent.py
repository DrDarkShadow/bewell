from sqlalchemy import Column, BigInteger, String, DateTime, Boolean, ForeignKey, Text
from datetime import datetime
from config.database import Base

class ConsentLog(Base):
    """Track user consent for data sharing and escalation"""
    __tablename__ = "consent_logs"
    
    id = Column(BigInteger, primary_key=True)
    
    # ID type change: BigInteger -> String (UUID match)
    user_id = Column(String(50), ForeignKey('users.id'), nullable=False, index=True)
    
    consent_type = Column(String(100), nullable=False)  # 'escalation', 'data_sharing'
    granted = Column(Boolean, default=False)
    requested_at = Column(DateTime, default=datetime.utcnow)
    granted_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    context = Column(Text, nullable=True)  # JSON string - context when requested
    
    def __repr__(self):
        return f"<Consent {self.consent_type} - {'Granted' if self.granted else 'Pending'}>"
