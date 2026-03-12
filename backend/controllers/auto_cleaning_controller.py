import logging
from typing import Any

from services.auto_cleaning_service import auto_cleaning_service
from utils.response_helper import standardize_response

logger = logging.getLogger(__name__)


class AutoCleaningController:
    @staticmethod
    async def run(dataset_id: str) -> Any:
        try:
            data = await auto_cleaning_service.run(dataset_id)
            return standardize_response(True, data, "Auto cleaning completed successfully")
        except ValueError as exc:
            return standardize_response(False, error=str(exc), status_code=404)
        except Exception as exc:
            logger.error("Auto cleaning failed: %s", str(exc))
            return standardize_response(False, error=str(exc), status_code=500)
