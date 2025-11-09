# middleware/auth.py
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Callable

async def validate_dataset_id(request: Request, call_next: Callable):
    """
    FastAPI middleware to validate that a dataset_id path parameter exists.
    This version replaces Flask's @wraps decorator middleware.
    """

    # Extract path params
    dataset_id = request.path_params.get("dataset_id")

    if not dataset_id:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": "Dataset ID is required",
                "timestamp": "2025-06-06T11:56:10.000Z"
            },
        )

    # Continue with request if valid
    response = await call_next(request)
    return response
