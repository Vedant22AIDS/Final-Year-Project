# routers/health.py
from fastapi import APIRouter
from utils.response_utils import standardize_response
from models.user import user_storage
from models.dataset import dataset_storage
from datetime import datetime

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return standardize_response(
        True,
        {
            "status": "healthy",
            "active_datasets": dataset_storage.get_dataset_count(),
            "active_users": len(user_storage.get_all_users()),
            "timestamp": datetime.now().isoformat(),
        },
        "Service is healthy",
    )
