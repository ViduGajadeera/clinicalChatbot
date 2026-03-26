from fastapi import APIRouter
from app.models.schemas import Scenario
from app.services.scenario_service import add_scenario

router = APIRouter()

@router.post("/")
def upload_scenario(scenario: Scenario):
    return add_scenario(scenario)