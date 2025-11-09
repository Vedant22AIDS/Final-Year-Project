# utils/response_helper.py
from fastapi.responses import JSONResponse
from datetime import datetime
from typing import Any, Optional


def standardize_response(success: bool = True, data: Any = None, message: str = "", error: Optional[str] = None, status_code: int = 200):
    """Standardize all API responses for FastAPI"""
    response = {
        "success": success,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }

    if success:
        response["data"] = data
    else:
        response["error"] = error or message

    return JSONResponse(content=response, status_code=status_code)
