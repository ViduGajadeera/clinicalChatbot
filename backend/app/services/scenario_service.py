import json
import logging
from pathlib import Path

from app.models.schemas import Scenario
from app.services.vector_service import store_scenario

logger = logging.getLogger(__name__)

# Temporary in-memory storage used by the chat route.
scenarios_db: dict[str, Scenario] = {}

# Fallback if JSON files are missing from the image (Render/Docker path quirks).
_EMBEDDED_SC001: dict = {
    "scenario_id": "SC001",
    "title": "Chest Pain Case",
    "description": "A 55-year-old male presents with chest pain and sweating.",
    "questions": [
        {
            "question_id": "Q1",
            "question": "What is your first action?",
            "expected_answer": "Assess vital signs",
            "media": [],
        },
        {
            "question_id": "Q2",
            "question": "What condition do you suspect?",
            "expected_answer": "Myocardial infarction",
            "media": [],
        },
    ],
}


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
    here = Path(__file__).resolve()
    backend_root = here.parents[2]
    default_file = backend_root / "data" / "docone.json"
    legacy_file = here.parents[3] / "sources" / "docone.json"
    for path in (default_file, legacy_file):
        if not path.exists():
            continue
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            scenario = Scenario(**payload)
        except Exception as exc:
            logger.warning("Could not load scenario from %s: %s", path, exc)
            continue
        scenarios_db.setdefault(scenario.scenario_id, scenario)
        return

    # Always ensure SC001 exists for /chat (avoids empty DB on mis-packaged deploys).
    if "SC001" not in scenarios_db:
        try:
            scenarios_db["SC001"] = Scenario(**_EMBEDDED_SC001)
            logger.warning(
                "Loaded embedded default scenario SC001 (no file at %s or %s)",
                default_file,
                legacy_file,
            )
        except Exception as exc:
            logger.exception("Embedded default scenario failed: %s", exc)


_load_default_scenario()