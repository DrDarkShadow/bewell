from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, Boolean, Text
from datetime import datetime
from config.database import Base

class Notification(Base):
    """
    System notifications
    """
    __tablename__ = "notifications"
    
    # Primary
    id = Column(BigInteger, primary_key=True)
    
    # Relationships
    user_id = Column(BigInteger, ForeignKey('users.id'), nullable=False, index=True)
    
    # Notification Details
    notification_type = Column(String(50), nullable=False) # appointment/escalation/message
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Action Link (optional)
    action_id = Column(String(50), nullable=True)          # ID of related entity (as string for flexibility)
    
    # Status
    read = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "type": self.notification_type,
            "title": self.title,
            "message": self.message,
            "read": self.read,
            "created_at": self.created_at.isoformat()
        }
