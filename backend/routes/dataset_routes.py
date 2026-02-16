from fastapi import APIRouter, File, Query, Request, UploadFile

from controllers.dataset_controller import DatasetController
from schemas.dataset_schemas import BalanceRequest

router = APIRouter(prefix="/api", tags=["dataset"])


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    return await DatasetController.upload_file(file)


@router.get("/dataset/{dataset_id}/status")
async def get_processing_status(dataset_id: str):
    return await DatasetController.get_processing_status(dataset_id)


@router.get("/dataset/{dataset_id}/summary")
async def get_dataset_summary(dataset_id: str):
    return await DatasetController.get_dataset_summary(dataset_id)


@router.get("/dataset/{dataset_id}/preview")
async def get_dataset_preview(
    dataset_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    type: str = Query("head"),
    refresh: bool = Query(False),
):
    return await DatasetController.get_dataset_preview(dataset_id, page, per_page, type, refresh)


@router.post("/dataset/{dataset_id}/refresh-random")
async def refresh_random_sample(dataset_id: str):
    return await DatasetController.refresh_random_sample(dataset_id)


@router.post("/dataset/{dataset_id}/missing-values")
async def handle_missing_values(dataset_id: str, request: Request):
    body = await request.json()
    return await DatasetController.handle_missing_values(
        dataset_id=dataset_id,
        strategy=body.get("strategy", "mean"),
        columns=body.get("columns"),
        fill_value=body.get("fill_value"),
        async_processing=bool(body.get("async", False)),
    )


@router.post("/dataset/{dataset_id}/normalize")
async def normalize_data(dataset_id: str, request: Request):
    body = await request.json()
    return await DatasetController.normalize_data(
        dataset_id=dataset_id,
        method=body.get("method", "standard"),
        columns=body.get("columns"),
        async_processing=bool(body.get("async", False)),
    )


@router.post("/dataset/{dataset_id}/encode")
async def encode_categorical(dataset_id: str, request: Request):
    body = await request.json()
    return await DatasetController.encode_categorical(
        dataset_id=dataset_id,
        method=body.get("method", "label"),
        columns=body.get("columns"),
        async_processing=bool(body.get("async", False)),
    )


@router.post("/dataset/{dataset_id}/outliers")
async def remove_outliers(dataset_id: str, request: Request):
    body = await request.json()
    return await DatasetController.remove_outliers(
        dataset_id=dataset_id,
        method=body.get("method", "iqr"),
        columns=body.get("columns"),
        threshold=float(body.get("threshold", 1.5)),
        async_processing=bool(body.get("async", False)),
    )


@router.delete("/dataset/{dataset_id}/duplicates")
async def remove_duplicates(dataset_id: str):
    return await DatasetController.remove_duplicates(dataset_id)


@router.get("/dataset/{dataset_id}/correlation")
async def get_correlation_analysis(dataset_id: str):
    return await DatasetController.get_correlation_analysis(dataset_id)


@router.get("/dataset/{dataset_id}/export")
async def export_dataset(dataset_id: str):
    return await DatasetController.export_dataset(dataset_id)


@router.post("/dataset/{dataset_id}/reset")
async def reset_dataset(dataset_id: str):
    return await DatasetController.reset_dataset(dataset_id)


@router.get("/dataset/{dataset_id}/history")
async def get_processing_history(dataset_id: str):
    return await DatasetController.get_processing_history(dataset_id)

#Himanshi's contribution for class imbalance analysis and balancing
@router.get("/dataset/{dataset_id}/imbalance")
async def analyze_imbalance(dataset_id: str, target: str):
    return await DatasetController.analyze_class_imbalance(dataset_id, target)

@router.post("/dataset/{dataset_id}/balance")
async def balance_dataset(dataset_id: str, request: BalanceRequest):
    return await DatasetController.apply_class_balancing(
        dataset_id,
        request.target,
        request.method
    )

# @router.post("/dataset/{dataset_id}/balance")
# async def balance_dataset(dataset_id: str, request: Request):
#     try:
#         body = await request.json()
#     except Exception:
#         return {"error": "JSON body required"}

#     if not body or "target" not in body:
#         return {"error": "Target field required"}

#     return await DatasetController.apply_class_balancing(
#         dataset_id,
#         body.get("target"),
#         body.get("method", "random_over")
#     )
#ends