from fastapi import APIRouter

from controllers.auto_cleaning_controller import AutoCleaningController

router = APIRouter(prefix="/api/auto-cleaning", tags=["auto-cleaning"])


@router.post("/{dataset_id}/run")
async def run_auto_cleaning(dataset_id: str):
    return await AutoCleaningController.run(dataset_id)
