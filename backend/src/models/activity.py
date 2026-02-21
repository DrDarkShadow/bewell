from sqlalchemy import Column, BigInteger, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from config.database import Base

class WellnessActivity(Base):
    """
    Tracks patient wellness activities (games, breathing exercises)
    
    Indexes:
    - patient_id - for looking up a patient's activity history
    - activity_type - for filtering by type (e.g. 'breathing')
    - created_at - for time-series analytics and charts
    """
    __tablename__ = "wellness_activities"
    
    # Primary Key
    id = Column(BigInteger, primary_key=True, index=True)
    
    # Relationships
    patient_id = Column(BigInteger, ForeignKey('users.id'), nullable=False, index=True)
    
    # Activity Classification
    activity_type = Column(String(50), nullable=False, index=True)
    
    # Metrics (Unified Baseline)
    score = Column(Integer, nullable=True)
    duration_secs = Column(Integer, nullable=True)
    
    # Flexible custom data per specific game
    metadata_json = Column(JSONB, nullable=True)
    
    # Timestamps
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        index=True
    )
    
    def __repr__(self):
        return f"<WellnessActivity {self.activity_type} - Patient {self.patient_id}>"
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "patient_id": str(self.patient_id),
            "activity_type": self.activity_type,
            "score": self.score,
            "duration_secs": self.duration_secs,
            "metadata_json": self.metadata_json,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
