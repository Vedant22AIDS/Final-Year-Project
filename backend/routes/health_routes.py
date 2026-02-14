from datetime import datetime

from fastapi import APIRouter

from core.storage import dataset_storage
from utils.response_helper import standardize_response

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check():
    return standardize_response(
        True,
        {
            "status": "healthy",
            "active_datasets": len(dataset_storage.datasets),
            "timestamp": datetime.now().isoformat(),
        },
        "Service is healthy",
    )

