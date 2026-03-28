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
    # backend/app/services -> parents[2] == backend root (works locally and in Docker
    # where only `backend/` is copied — repo-level `sources/` is not on the image).
    backend_root = Path(__file__).resolve().parents[2]
    default_file = backend_root / "data" / "docone.json"
    legacy_file = Path(__file__).resolve().parents[3] / "sources" / "docone.json"
    for path in (default_file, legacy_file):
        if not path.exists():
            continue
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            scenario = Scenario(**payload)
        except Exception:
            continue
        scenarios_db.setdefault(scenario.scenario_id, scenario)
        return


_load_default_scenario()