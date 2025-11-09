# routers/dataset.py
from fastapi import APIRouter, UploadFile, File, Query, Request, Depends
from fastapi.responses import StreamingResponse
from typing import Optional

from controllers.dataset_controller import DatasetController
from middleware.dataset import dataset_storage  # dataset_storage instance from your middleware/dataset.py
from services.data_service import data_service  # used by controller static methods

router = APIRouter(prefix="/api/datasets", tags=["dataset"])

# Instantiate controller using storage objects
controller = DatasetController(
    datasets_storage=dataset_storage.datasets,
    processing_status_storage=dataset_storage.processing_status,
    dataset_lock=dataset_storage.lock,
)


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload dataset file"""
    return await controller.upload_file(file)


@router.get("/{dataset_id}/preview")
async def get_preview(
    dataset_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    type: str = Query("head"),
):
    """Preview dataset (instance-level preview that uses stored datasets)"""
    return await controller.get_preview(dataset_id=dataset_id, page=page, per_page=per_page, view_type=type)


@router.get("/{dataset_id}/status")
async def get_processing_status(dataset_id: str):
    """Get processing status"""
    # using static controller method that uses data_service
    return await DatasetController.get_processing_status(dataset_id)


@router.get("/{dataset_id}/summary")
async def get_dataset_summary(dataset_id: str):
    """Get dataset summary"""
    return await DatasetController.get_dataset_summary(dataset_id)


@router.get("/{dataset_id}/preview-data")
async def get_dataset_preview(
    dataset_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    type: str = Query("head"),
):
    """Get dataset preview (via data_service helper)"""
    return await DatasetController.get_dataset_preview(dataset_id, page=page, per_page=per_page, view_type=type)


@router.post("/{dataset_id}/missing-values")
async def handle_missing_values(dataset_id: str, request: Request):
    """Handle missing values (body includes strategy, columns, fill_value)"""
    return await DatasetController.handle_missing_values(dataset_id, request)


@router.post("/{dataset_id}/normalize")
async def normalize_data(dataset_id: str, request: Request):
    """Normalize dataset"""
    return await DatasetController.normalize_data(dataset_id, request)


@router.post("/{dataset_id}/encode")
async def encode_categorical(dataset_id: str, request: Request):
    """Encode categorical variables"""
    return await DatasetController.encode_categorical(dataset_id, request)


@router.get("/{dataset_id}/export")
async def export_dataset(dataset_id: str):
    """Export processed dataset as CSV (streaming)"""
    return await DatasetController.export_dataset(dataset_id)
