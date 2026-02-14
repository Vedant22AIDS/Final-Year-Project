from fastapi import APIRouter

from controllers.validation_controller import run_validation

router = APIRouter(prefix="/api/validation", tags=["Validation"])

@router.post("/run/{dataset_id}")
async def run_validation_route(dataset_id: str, payload: dict):
    return await run_validation(dataset_id, payload)
