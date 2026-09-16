from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import Scenario, User
from app.services.auth_service import get_current_user

router = APIRouter()

@router.get("/")
def get_scenarios(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scenarios = db.query(Scenario).all()
    # Provide a fallback description since we removed the description field
    return [{"id": s.id, "scenario_id": s.scenario_id, "title": s.title, "description": s.presentation.get('chief_complaint', 'Clinical Scenario')} for s in scenarios]