from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.domain import User, Attempt
from app.services.auth_service import get_current_user

router = APIRouter()

@router.get("/attempts")
def get_student_attempts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can view this")
        
    attempts = db.query(Attempt).filter(Attempt.student_id == current_user.id).order_by(Attempt.timestamp.desc()).all()
    return [{"attempt_id": a.id, "timestamp": a.timestamp} for a in attempts]
