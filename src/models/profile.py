from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, Text, Boolean, Integer
from datetime import datetime
from config.database import Base

class Profile(Base):
    """
    Unified Profile for both Patients and Professionals.
    Stores additional details based on role.
    """
    __tablename__ = "profiles"
    
    id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey('users.id'), unique=True, nullable=False)
    
    # Patient Specific
    age = Column(Integer, nullable=True)
    gender = Column(String(50), nullable=True)
    medical_history = Column(Text, nullable=True) # JSON
    emergency_contact = Column(Text, nullable=True) # JSON
    
    # Professional Specific
    license_number = Column(String(100), nullable=True)
    specialization = Column(String(255), nullable=True)
    years_of_experience = Column(Integer, nullable=True)
    bio = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False)
    
    def to_dict(self):
        return {
            "user_id": self.user_id,
            "age": self.age,
            "specialization": self.specialization,
            "is_verified": self.is_verified
        }
