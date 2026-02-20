from sqlalchemy import Column, BigInteger, String, Integer, Text, Boolean, DateTime, ForeignKey, DECIMAL, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from config.database import Base
from datetime import datetime

class ProfessionalProfile(Base):
    """
    Professional Profile for doctors/therapists.
    Extensions of the User model.
    """
    __tablename__ = "professional_profiles"

    id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey('users.id'), unique=True, nullable=False)

    # Professional Info
    specialization = Column(Text)
    license_number = Column(String(100))
    years_of_experience = Column(Integer)
    education = Column(Text)
    bio = Column(Text)

    # Availability
    working_hours = Column(JSONB)  # Store availability as JSON

    # Status
    verified = Column(Boolean, default=False)
    accepting_patients = Column(Boolean, default=True)
    current_patient_count = Column(Integer, default=0)

    # Profile
    profile_image_url = Column(Text)
    languages = Column(Text)

    # Ratings (computed from reviews)
    average_rating = Column(DECIMAL(3, 2), default=0.0)
    total_reviews = Column(Integer, default=0)
    total_appointments = Column(Integer, default=0)

    # Pricing
    consultation_fee = Column(DECIMAL(10, 2))

    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="professional_profile")
    reviews = relationship("ProfessionalReview", back_populates="professional")

    # Indexes (defined via __table_args__ for complex indexes)
    __table_args__ = (
        Index('idx_professional_user_id', 'user_id'),
        Index('idx_professional_rating', 'average_rating', postgresql_ops={"average_rating": "DESC"}),
        Index('idx_professional_accepting', 'accepting_patients', postgresql_where=(accepting_patients == True)),
        {'extend_existing': True}
    )

class ProfessionalReview(Base):
    """
    Reviews for professionals by patients.
    """
    __tablename__ = "professional_reviews"

    id = Column(BigInteger, primary_key=True)
    professional_id = Column(BigInteger, ForeignKey('users.id'), nullable=False)
    patient_id = Column(BigInteger, ForeignKey('users.id'), nullable=False)
    appointment_id = Column(BigInteger, ForeignKey('appointments.id'), nullable=True)

    rating = Column(Integer, nullable=False)
    review_text = Column(Text)

    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    professional = relationship("ProfessionalProfile", back_populates="reviews", foreign_keys=[professional_id], primaryjoin="ProfessionalProfile.user_id == ProfessionalReview.professional_id")

    __table_args__ = (
        Index('idx_review_professional', 'professional_id', 'created_at'),
        Index('idx_review_rating', 'professional_id', 'rating'),
        {'extend_existing': True}
    )
