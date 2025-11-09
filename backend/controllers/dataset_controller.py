# dataset_controller.py — FastAPI version
from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Query,
    HTTPException,
    Request,
    Depends,
)
from fastapi.responses import StreamingResponse, JSONResponse
import pandas as pd
import io
import uuid
import logging
from datetime import datetime

from services.data_service import DataService, data_service, safe_convert_to_json
from utils.response_helper import standardize_response
from middleware.auth import validate_dataset_id  # assumed FastAPI-compatible decorator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dataset", tags=["Dataset"])

class DatasetController:
    def __init__(self, datasets_storage, processing_status_storage, dataset_lock):
        self.datasets = datasets_storage
        self.processing_status = processing_status_storage
        self.dataset_lock = dataset_lock

    async def upload_file(self, file: UploadFile = File(...)):
        """Handle file upload"""
        if not file.filename:
            return standardize_response(False, error="No file selected", status_code=400)

        if not file.filename.lower().endswith((".csv", ".xlsx", ".xls")):
            return standardize_response(
                False,
                error="Invalid file format. Please upload CSV, XLSX, or XLS files.",
                status_code=400,
            )

        dataset_id = str(uuid.uuid4())

        try:
            content = await file.read()
            if file.filename.lower().endswith(".csv"):
                df = pd.read_csv(io.BytesIO(content))
            else:
                df = pd.read_excel(io.BytesIO(content))

            if df.empty:
                return standardize_response(False, error="File is empty", status_code=400)

            if len(df) > 100000:
                return standardize_response(
                    False,
                    error="File too large. Maximum 100,000 rows allowed.",
                    status_code=400,
                )

            with self.dataset_lock:
                from backend.app_fastapi import EnhancedDataPreprocessor
                preprocessor = EnhancedDataPreprocessor(df, dataset_id)
                self.datasets[dataset_id] = preprocessor
                self.processing_status[dataset_id] = {
                    "status": "idle",
                    "progress": 0,
                    "message": "Dataset loaded successfully",
                }

            summary = preprocessor.get_comprehensive_summary()
            sample_data = df.head(10).fillna("null").to_dict("records")

            logger.info(f"Dataset {dataset_id} uploaded successfully: {file.filename}")

            return standardize_response(
                True,
                {
                    "dataset_id": dataset_id,
                    "filename": file.filename,
                    "summary": summary,
                    "sample_data": sample_data,
                },
                f'File "{file.filename}" uploaded successfully',
            )

        except Exception as e:
            logger.error(f"Error uploading file: {str(e)}")
            return standardize_response(False, error=f"Error reading file: {str(e)}", status_code=400)

    async def get_preview(
        self,
        dataset_id: str,
        page: int = Query(1, ge=1),
        per_page: int = Query(10, ge=1, le=50),
        view_type: str = Query("head"),
    ):
        """Get dataset preview with pagination"""
        if dataset_id not in self.datasets:
            return standardize_response(False, error="Dataset not found", status_code=404)

        preprocessor = self.datasets[dataset_id]
        df = preprocessor.df

        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page

        if view_type == "tail":
            sample_df = df.tail(per_page)
        elif view_type == "random":
            sample_df = DataService.get_random_sample(df, per_page)
        else:
            sample_df = df.iloc[start_idx:end_idx]

        data = sample_df.fillna("null").to_dict("records")

        return standardize_response(
            True,
            {
                "data": data,
                "total_rows": len(df),
                "page": page,
                "per_page": per_page,
                "total_pages": (len(df) + per_page - 1) // per_page,
                "view_type": view_type,
            },
            "Preview data retrieved successfully",
        )

    # ---------- STATIC METHODS BELOW ----------

    @staticmethod
    @validate_dataset_id
    async def get_processing_status(dataset_id: str):
        try:
            status = data_service.processing_status.get(
                dataset_id,
                {"status": "not_found", "progress": 0, "message": "Dataset not found"},
            )
            return standardize_response(True, status, "Status retrieved successfully")
        except Exception as e:
            return standardize_response(False, error=str(e), status_code=500)

    @staticmethod
    @validate_dataset_id
    async def get_dataset_summary(dataset_id: str):
        try:
            dataset = data_service.get_dataset(dataset_id)
            summary = DatasetController._get_summary(dataset["data"])
            return standardize_response(True, summary, "Summary retrieved successfully")
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=404)
        except Exception as e:
            return standardize_response(False, error=str(e), status_code=500)

    @staticmethod
    @validate_dataset_id
    async def get_dataset_preview(
        dataset_id: str,
        page: int = Query(1, ge=1),
        per_page: int = Query(10, ge=1, le=50),
        view_type: str = Query("head"),
    ):
        try:
            preview_data = data_service.get_preview_data(dataset_id, page, per_page, view_type)
            return standardize_response(True, preview_data, "Preview data retrieved successfully")
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=404)
        except Exception as e:
            return standardize_response(False, error=str(e), status_code=500)

    @staticmethod
    @validate_dataset_id
    async def handle_missing_values(dataset_id: str, request: Request):
        try:
            data = await request.json()
            strategy = data.get("strategy", "mean")
            columns = data.get("columns", None)
            fill_value = data.get("fill_value", None)

            valid_strategies = [
                "mean",
                "median",
                "mode",
                "constant",
                "forward_fill",
                "backward_fill",
                "knn",
                "remove",
            ]
            if strategy not in valid_strategies:
                return standardize_response(
                    False,
                    error=f"Invalid strategy. Must be one of: {valid_strategies}",
                    status_code=400,
                )

            results = data_service.handle_missing_values(dataset_id, strategy, columns, fill_value)
            summary = DatasetController._get_summary(data_service.get_dataset(dataset_id)["data"])

            return standardize_response(
                True,
                {"results": results, "summary": summary},
                f"Missing values handled using {strategy} strategy",
            )
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=404)
        except Exception as e:
            return standardize_response(False, error=str(e), status_code=500)

    @staticmethod
    @validate_dataset_id
    async def normalize_data(dataset_id: str, request: Request):
        try:
            data = await request.json()
            method = data.get("method", "standard")
            columns = data.get("columns", None)

            valid_methods = ["standard", "minmax", "robust", "zscore"]
            if method not in valid_methods:
                return standardize_response(
                    False,
                    error=f"Invalid method. Must be one of: {valid_methods}",
                    status_code=400,
                )

            results = data_service.normalize_data(dataset_id, method, columns)
            summary = DatasetController._get_summary(data_service.get_dataset(dataset_id)["data"])

            return standardize_response(
                True,
                {"results": results, "summary": summary},
                f"Data normalized using {method} method",
            )
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=404)
        except Exception as e:
            return standardize_response(False, error=str(e), status_code=500)

    @staticmethod
    @validate_dataset_id
    async def encode_categorical(dataset_id: str, request: Request):
        try:
            data = await request.json()
            method = data.get("method", "label")
            columns = data.get("columns", None)

            valid_methods = ["label", "onehot", "binary"]
            if method not in valid_methods:
                return standardize_response(
                    False,
                    error=f"Invalid method. Must be one of: {valid_methods}",
                    status_code=400,
                )

            results = data_service.encode_categorical(dataset_id, method, columns)
            summary = DatasetController._get_summary(data_service.get_dataset(dataset_id)["data"])

            return standardize_response(
                True,
                {"results": results, "summary": summary},
                f"Categorical variables encoded using {method} encoding",
            )
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=404)
        except Exception as e:
            return standardize_response(False, error=str(e), status_code=500)

    @staticmethod
    @validate_dataset_id
    async def export_dataset(dataset_id: str):
        try:
            dataset = data_service.get_dataset(dataset_id)
            df = dataset["data"]

            output = io.StringIO()
            df.to_csv(output, index=False)
            output.seek(0)

            csv_bytes = io.BytesIO(output.getvalue().encode("utf-8"))
            headers = {
                "Content-Disposition": f'attachment; filename="processed_{dataset["filename"]}"'
            }

            return StreamingResponse(csv_bytes, media_type="text/csv", headers=headers)
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=404)
        except Exception as e:
            return standardize_response(False, error=str(e), status_code=500)

    @staticmethod
    def _get_summary(df):
        """Generate dataset summary"""
        try:
            summary = {
                "shape": df.shape,
                "columns": df.columns.tolist(),
                "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
                "missing_values": {col: int(count) for col, count in df.isnull().sum().items()},
                "memory_usage": f"{df.memory_usage(deep=True).sum() / 1024:.2f} KB",
                "duplicate_rows": int(df.duplicated().sum()),
            }

            numerical_cols = df.select_dtypes(include=["number"]).columns
            if len(numerical_cols) > 0:
                numerical_stats = {}
                for col in numerical_cols:
                    if df[col].notna().sum() > 0:
                        numerical_stats[col] = {
                            "count": int(df[col].count()),
                            "mean": float(df[col].mean()),
                            "std": float(df[col].std()),
                            "min": float(df[col].min()),
                            "25%": float(df[col].quantile(0.25)),
                            "50%": float(df[col].quantile(0.50)),
                            "75%": float(df[col].quantile(0.75)),
                            "max": float(df[col].max()),
                        }
                summary["numerical_stats"] = numerical_stats

            categorical_cols = df.select_dtypes(include=["object", "category"]).columns
            if len(categorical_cols) > 0:
                categorical_stats = {}
                for col in categorical_cols:
                    if df[col].notna().sum() > 0:
                        value_counts = df[col].value_counts().head(10)
                        categorical_stats[col] = {
                            "unique_count": int(df[col].nunique()),
                            "top_values": {str(k): int(v) for k, v in value_counts.items()},
                        }
                summary["categorical_stats"] = categorical_stats

            return summary

        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            raise
