from typing import Any, Dict

from services.validation_service import execute_validation
from utils.response_helper import standardize_response


async def run_validation(dataset_id: str, payload: Dict[str, Any]):
    rules = payload.get("rules", [])
    if not rules:
        return standardize_response(False, error="No validation rules provided", status_code=400)

    try:
        results = execute_validation(dataset_id, rules)
        return standardize_response(
            True,
            {"dataset_id": dataset_id, "results": results},
            "Validation completed successfully",
        )
    except ValueError as e:
        return standardize_response(False, error=str(e), status_code=404)
    except Exception as e:
        return standardize_response(False, error=str(e), status_code=500)

