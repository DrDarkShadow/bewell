from sqlalchemy import Column, BigInteger, Integer, String, Boolean, DateTime, Enum as SQLEnum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from config.database import Base

class UserRole(str, enum.Enum):
    """User roles"""
    PATIENT = "patient"
    PROFESSIONAL = "professional"

class User(Base):
    """
    User model - patients and professionals
    
    Indexes:
    - email (unique) - for login lookups
    - role - for filtering by user type
    - created_at - for analytics queries
    """
    __tablename__ = "users"
    
    # Primary Key
    id = Column(BigInteger, primary_key=True, index=True)
    
    # Authentication
    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True  # ✅ Index for fast lookup
    )
    password_hash = Column(String(255), nullable=False)
    
    # Profile
    role = Column(
        SQLEnum(UserRole),
        nullable=False,
        index=True  # ✅ Index for filtering
    )
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    
    # Timestamps - ✅ Using func.now() (evaluated at INSERT time)
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),  # Database handles default
        index=True  # For analytics queries
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()  # Auto-update on modification
    )
    
    # Soft delete (optional - good practice)
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    
    # Composite index for common query pattern
    __table_args__ = (
        Index('idx_user_role_created', 'role', 'created_at'),  # For dashboard queries
    )
    
    def __repr__(self):
        return f"<User {self.email} ({self.role.value})>"
    
    def to_dict(self, include_sensitive=False):
        """
        Convert to dictionary
        
        Args:
            include_sensitive: Include password_hash (for internal use only)
        """
        data = {
            "id": str(self.id),
            "email": self.email,
            "role": self.role.value,
            "name": self.name,
            "phone": self.phone,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
        
        if include_sensitive:
            data["password_hash"] = self.password_hash
        
        return data