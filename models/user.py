from sqlalchemy import Column, BigInteger, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from config.database import Base

class UserRole(str, enum.Enum):
    """User roles"""
    PATIENT = "patient"
    PROFESSIONAL = "professional"

class User(Base):
    """User model - patients and professionals dono"""
    __tablename__ = "users"
    
    # Columns
    id = Column(BigInteger, primary_key=True, index=True)  # Snowflake ID
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
    
    def to_dict(self):
        """Convert to dictionary (JSON response ke liye)"""
        return {
            "id": str(self.id),  # String mein convert (JavaScript ke liye)
            "email": self.email,
            "role": self.role.value,
            "name": self.name,
            "phone": self.phone,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }