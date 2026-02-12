from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, Text, JSON
from datetime import datetime
from config.database import Base

class Conversation(Base):
    """Conversation between patient and AI"""
    __tablename__ = "conversations"
    
    id = Column(BigInteger, primary_key=True)
    
    # ID type change: String -> BigInteger (Snowflake match)
    patient_id = Column(BigInteger, ForeignKey('users.id'), nullable=False, index=True)
    
    status = Column(String(50), default="active")  # active, escalated, closed
    started_at = Column(DateTime, default=datetime.utcnow)
    last_message_at = Column(DateTime, default=datetime.utcnow)
    summary = Column(Text, nullable=True)  # AI-generated summary of conversation
    
    def __repr__(self):
        return f"<Conversation {self.id} - Patient {self.patient_id}>"

class Message(Base):
    """Individual messages in conversation"""
    __tablename__ = "messages"
    
    id = Column(BigInteger, primary_key=True)
    conversation_id = Column(BigInteger, ForeignKey('conversations.id'), nullable=False, index=True)
    sender_type = Column(String(20), nullable=False)  # 'patient' or 'ai'
    content = Column(Text, nullable=False)  # Message content (encrypted later)
    emotion_score = Column(JSON, nullable=True)  # JSON structure {"stress": 0.7}
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Message {self.id} from {self.sender_type}>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "conversation_id": str(self.conversation_id),
            "sender": self.sender_type,
            "content": self.content,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "emotion_score": self.emotion_score
        }
