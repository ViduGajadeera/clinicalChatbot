import json
from pathlib import Path

from app.models.schemas import Scenario
from app.services.vector_service import store_scenario

# Temporary in-memory storage used by the chat route.
scenarios_db: dict[str, Scenario] = {}


def add_scenario(scenario: Scenario):
    scenarios_db[scenario.scenario_id] = scenario
    store_scenario(scenario)
    return {"message": "Scenario stored successfully", "scenario_id": scenario.scenario_id}


def get_scenario(scenario_id: str | None = None) -> Scenario | None:
    if scenario_id:
        scenario = scenarios_db.get(scenario_id)
        if scenario:
            return scenario
    return next(iter(scenarios_db.values()), None)


def _load_default_scenario() -> None:
    repo_root = Path(__file__).resolve().parents[3]
    default_file = repo_root / "sources" / "docone.json"

    if not default_file.exists():
        return

    try:
        payload = json.loads(default_file.read_text(encoding="utf-8"))
        scenario = Scenario(**payload)
    except Exception:
        return

    scenarios_db.setdefault(scenario.scenario_id, scenario)


_load_default_scenario()