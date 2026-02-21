from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from config.database import get_db
from models.user import User
from models.activity import WellnessActivity
from schemas.activity import ActivityCreateRequest, ActivityResponse
from api.common.auth import get_current_user

router = APIRouter(prefix="/patient/activities", tags=["Activities"])

@router.post("", response_model=ActivityResponse)
async def log_wellness_activity(
    activity: ActivityCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log a new patient wellness activity (e.g. breathing exercise, mini-game score)
    """
    try:
        new_activity = WellnessActivity(
            patient_id=current_user.id,
            activity_type=activity.activity_type,
            score=activity.score,
            duration_secs=activity.duration_secs,
            metadata_json=activity.metadata_json
        )
        
        db.add(new_activity)
        db.commit()
        db.refresh(new_activity)
        
        return new_activity.to_dict()
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to log wellness activity: {str(e)}"
        )

@router.get("", response_model=List[ActivityResponse])
async def get_wellness_activities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve history of completed wellness activities for the current patient
    """
    activities = db.query(WellnessActivity)\
        .filter(WellnessActivity.patient_id == current_user.id)\
        .order_by(WellnessActivity.created_at.desc())\
        .all()
        
    return [a.to_dict() for a in activities]
