from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.domain import User, Attempt
from app.services.auth_service import get_current_user

router = APIRouter()

import re

def extract_score(feedback: str):
    if not feedback:
        return None
    match = re.search(r'Evaluation Score: (\d+)/100', feedback)
    if match:
        return float(match.group(1))
    return None

@router.get("/attempts")
def get_student_attempts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can view this")
        
    attempts = db.query(Attempt).filter(Attempt.student_id == current_user.id).order_by(Attempt.timestamp.asc()).all()
    
    result = []
    for a in attempts:
        scenario_title = a.scenario.title if a.scenario else "Unknown Scenario"
        score = extract_score(a.ai_feedback)
        result.append({
            "attempt_id": a.id, 
            "timestamp": a.timestamp,
            "scenario_title": scenario_title,
            "score": score
        })
    return result
