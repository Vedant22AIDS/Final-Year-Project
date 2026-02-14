import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from routes.dataset_routes import router as dataset_router
from routes.health_routes import router as health_router
from routes.text_routes import router as text_router
from routes.validation_routes import router as validation_router
from utils.response_helper import standardize_response

logging.basicConfig(level=logging.WARNING, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Data Preprocessing API")
app.include_router(text_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(dataset_router)
app.include_router(text_router)
app.include_router(validation_router)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return standardize_response(False, error=exc.detail if exc.detail else "HTTP Error", status_code=exc.status_code)


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Internal server error: %s", str(exc))
    return standardize_response(False, error="Internal server error", status_code=500)


if __name__ == "__main__":
    import uvicorn

    print("Starting Data Preprocessing API Server...")
    print("Server running on http://localhost:5000")
    print("Health check: http://localhost:5000/api/health")
    uvicorn.run("app:app", host="0.0.0.0", port=5000, log_level="warning")
