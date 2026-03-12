import logging
from typing import Any, Dict, Optional

from fastapi import HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from services.dataset_service import dataset_service
from services.database_connector_service import database_connector_service
from utils.response_helper import standardize_response

logger = logging.getLogger(__name__)


class DatasetController:
    @staticmethod
    def _to_bool(value: Any, default: bool = False) -> bool:
        if value is None:
            return default
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.strip().lower() in {"true", "1", "yes", "on"}
        return bool(value)

    @staticmethod
    async def upload_file(file: UploadFile) -> Any:
        if not file.filename:
            return standardize_response(False, error="No file selected", status_code=400)

        if not file.filename.lower().endswith((".csv", ".xlsx", ".xls")):
            return standardize_response(
                False,
                error="Invalid file format. Please upload CSV, XLSX, or XLS files.",
                status_code=400,
            )

        try:
            content = await file.read()
            data = dataset_service.create_dataset_from_upload(file.filename, content)
            return standardize_response(True, data, f'File "{file.filename}" uploaded successfully')
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=400)
        except Exception as e:
            logger.error("Upload failed: %s", str(e))
            return standardize_response(False, error=f"Error reading file: {str(e)}", status_code=500)

    @staticmethod
    async def test_database_connection(payload: Dict[str, Any]) -> Any:
        try:
            data = database_connector_service.test_connection(payload)
            return standardize_response(True, data, "Database connection successful")
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=400)
        except Exception as e:
            logger.error("Database test connection failed: %s", str(e))
            return standardize_response(False, error="Database connection failed", status_code=500)

    @staticmethod
    async def connect_database_and_import(payload: Dict[str, Any]) -> Any:
        try:
            data = database_connector_service.connect_and_import(payload)
            return standardize_response(True, data, "Database connected and data imported successfully")
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=400)
        except Exception as e:
            logger.error("Database connect and import failed: %s", str(e))
            return standardize_response(False, error="Database import failed", status_code=500)

    @staticmethod
    async def get_processing_status(dataset_id: str) -> Any:
        return standardize_response(True, dataset_service.get_status(dataset_id), "Status retrieved successfully")

    @staticmethod
    async def get_dataset_summary(dataset_id: str) -> Any:
        try:
            preprocessor = dataset_service.get_preprocessor(dataset_id)
            return standardize_response(True, preprocessor.get_comprehensive_summary(), "Summary retrieved successfully")
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=404)

    @staticmethod
    async def get_dataset_preview(dataset_id: str, page: int, per_page: int, view_type: str, refresh: bool = False) -> Any:
        try:
            data = dataset_service.get_preview(dataset_id, page, per_page, view_type, refresh)
            return standardize_response(True, data, "Preview data retrieved successfully")
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=404)

    @staticmethod
    async def refresh_random_sample(dataset_id: str) -> Any:
        try:
            data = dataset_service.refresh_random_sample(dataset_id)
            return standardize_response(True, data, "Random sample refreshed successfully")
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=404)

    @staticmethod
    async def handle_missing_values(
        dataset_id: str,
        strategy: str,
        columns: Optional[list],
        fill_value: Any,
        async_processing: bool,
    ) -> Any:
        valid_strategies = ["mean", "median", "mode", "constant", "forward_fill", "backward_fill", "knn", "remove"]
        if strategy not in valid_strategies:
            return standardize_response(
                False,
                error=f"Invalid strategy. Must be one of: {valid_strategies}",
                status_code=400,
            )

        try:
            data = dataset_service.handle_missing_values(dataset_id, strategy, columns, fill_value, async_processing)
            message = "Missing value handling started" if async_processing else f"Missing values handled using {strategy} strategy"
            return standardize_response(True, data, message)
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=404)
        except Exception as e:
            return standardize_response(False, error=str(e), status_code=500)

    @staticmethod
    async def normalize_data(dataset_id: str, method: str, columns: Optional[list], async_processing: bool) -> Any:
        valid_methods = ["standard", "minmax", "robust"]
        if method not in valid_methods:
            return standardize_response(False, error=f"Invalid method. Must be one of: {valid_methods}", status_code=400)

        try:
            data = dataset_service.normalize_data(dataset_id, method, columns, async_processing)
            message = "Data normalization started" if async_processing else f"Data normalized using {method} method"
            return standardize_response(True, data, message)
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=404)
        except Exception as e:
            return standardize_response(False, error=str(e), status_code=500)

    @staticmethod
    async def encode_categorical(dataset_id: str, method: str, columns: Optional[list], async_processing: bool) -> Any:
        valid_methods = ["label", "onehot"]
        if method not in valid_methods:
            return standardize_response(False, error=f"Invalid method. Must be one of: {valid_methods}", status_code=400)

        try:
            data = dataset_service.encode_categorical(dataset_id, method, columns, async_processing)
            message = "Categorical encoding started" if async_processing else f"Categorical variables encoded using {method} encoding"
            return standardize_response(True, data, message)
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=404)
        except Exception as e:
            return standardize_response(False, error=str(e), status_code=500)

    @staticmethod
    async def remove_outliers(
        dataset_id: str,
        method: str,
        columns: Optional[list],
        threshold: float,
        async_processing: bool,
    ) -> Any:
        valid_methods = ["iqr", "zscore"]
        if method not in valid_methods:
            return standardize_response(False, error=f"Invalid method. Must be one of: {valid_methods}", status_code=400)
        if threshold <= 0:
            return standardize_response(False, error="Threshold must be positive", status_code=400)

        try:
            data = dataset_service.remove_outliers(dataset_id, method, columns, threshold, async_processing)
            message = "Outlier removal started" if async_processing else f"Outliers removed using {method} method"
            return standardize_response(True, data, message)
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=404)
        except Exception as e:
            return standardize_response(False, error=str(e), status_code=500)

    @staticmethod
    async def remove_duplicates(dataset_id: str) -> Any:
        try:
            data = dataset_service.remove_duplicates(dataset_id)
            return standardize_response(True, data, f'Removed {data["results"]["removed_count"]} duplicate rows')
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=404)
        except Exception as e:
            return standardize_response(False, error=str(e), status_code=500)

    @staticmethod
    async def get_correlation_analysis(dataset_id: str) -> Any:
        try:
            data = dataset_service.get_correlation_analysis(dataset_id)
            return standardize_response(True, data, "Correlation analysis completed successfully")
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=404)
        except Exception as e:
            return standardize_response(False, error=str(e), status_code=500)

    @staticmethod
    async def export_dataset(dataset_id: str) -> Any:
        try:
            export_data = dataset_service.export_csv(dataset_id)
            headers = {"Content-Disposition": f'attachment; filename="{export_data["filename"]}"'}
            return StreamingResponse(export_data["stream"], media_type="text/csv", headers=headers)
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=404)
        except Exception as e:
            return standardize_response(False, error=str(e), status_code=500)

    @staticmethod
    async def reset_dataset(dataset_id: str) -> Any:
        try:
            data = dataset_service.reset_dataset(dataset_id)
            return standardize_response(True, data, "Dataset reset to original state")
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=404)
        except Exception as e:
            return standardize_response(False, error=str(e), status_code=500)

    @staticmethod
    async def get_processing_history(dataset_id: str) -> Any:
        try:
            data = dataset_service.get_history(dataset_id)
            return standardize_response(True, data, "Processing history retrieved successfully")
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=404)
        except Exception as e:
            return standardize_response(False, error=str(e), status_code=500)

    @staticmethod
    async def analyze_class_imbalance(dataset_id: str, target: str):
        try:
            data = dataset_service.analyze_class_imbalance(dataset_id, target)
            return standardize_response(True, data, "Class imbalance analysis completed")
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=400)


    @staticmethod
    async def apply_class_balancing(dataset_id: str, target: str, method: str):
        valid_methods = [
            "random_over",
            "random_under",
            "smote",
            "smote_tomek",
            "class_weight"
        ]

        if method not in valid_methods:
            return standardize_response(False, error="Invalid balancing method", status_code=400)

        try:
            data = dataset_service.apply_class_balancing(dataset_id, target, method)
            return standardize_response(True, data, "Class balancing applied successfully")
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=400)
    @staticmethod
    async def validate_dataset(dataset_id: str, body: Dict[str, Any]) -> Any:
        rules = body.get("rules", [])
        try:
            data = dataset_service.validate_dataset(dataset_id, rules)
            return standardize_response(True, data, "Validation completed successfully")
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=400)
        except Exception as e:
            logger.error("Validation failed: %s", str(e))
            return standardize_response(False, error="Validation failed", status_code=500)

    @staticmethod
    async def apply_dimensionality_reduction(dataset_id: str, payload: Dict[str, Any]) -> Any:
        try:
            technique = payload.get("technique", "pca")
            n_components = payload.get("n_components")
            n_components = int(n_components) if n_components is not None else None
            scale_data = DatasetController._to_bool(payload.get("scale_data", False), default=False)
            random_state = payload.get("random_state", 42)
            random_state = int(random_state) if random_state is not None else None
            perplexity = float(payload.get("perplexity", 30.0))
            n_neighbors = int(payload.get("n_neighbors", 15))
            
            result = dataset_service.dimensionality_reduction(
                dataset_id=dataset_id,
                technique=technique,
                n_components=n_components,
                scale_data=scale_data,
                random_state=random_state,
                perplexity=perplexity,
                n_neighbors=n_neighbors,
            )
            return standardize_response(True, result, f"Dimensionality reduction with {technique.upper()} applied successfully")
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=400)
        except Exception as e:
            logger.error("Dimensionality reduction failed: %s", str(e))
            return standardize_response(False, error="Dimensionality reduction failed", status_code=500)

    @staticmethod
    async def apply_dimensionality_reduction_upload(
        file: UploadFile,
        technique: str,
        n_components: Optional[int],
        scale_data: Any,
        random_state: Optional[int],
        perplexity: float,
        n_neighbors: int,
    ) -> Any:
        if not file or not file.filename:
            return standardize_response(False, error="No file selected", status_code=400)
        if not file.filename.lower().endswith(".csv"):
            return standardize_response(False, error="Only CSV files are supported", status_code=400)

        try:
            content = await file.read()
            result = dataset_service.dimensionality_reduction_from_upload(
                filename=file.filename,
                content=content,
                technique=technique,
                n_components=n_components,
                scale_data=DatasetController._to_bool(scale_data, default=False),
                random_state=random_state,
                perplexity=perplexity,
                n_neighbors=n_neighbors,
            )
            return standardize_response(True, result, f"Dimensionality reduction with {technique.upper()} applied successfully")
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=400)
        except Exception as e:
            logger.error("Dimensionality reduction upload failed: %s", str(e))
            return standardize_response(False, error="Dimensionality reduction failed", status_code=500)

    @staticmethod
    async def apply_pca(dataset_id: str, payload: Dict[str, Any]) -> Any:
        try:
            n_components = payload.get("n_components")
            n_components = int(n_components) if n_components is not None else None
            scale_data = DatasetController._to_bool(payload.get("scale_data", False), default=False)
            random_state = payload.get("random_state", 42)
            random_state = int(random_state) if random_state is not None else None

            result = dataset_service.apply_pca(
                dataset_id=dataset_id,
                n_components=n_components,
                scale_data=scale_data,
                random_state=random_state,
            )
            return standardize_response(True, result, "PCA applied successfully")
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=400)
        except Exception as e:
            logger.error("PCA failed: %s", str(e))
            return standardize_response(False, error="PCA failed", status_code=500)

    @staticmethod
    async def apply_pca_upload(
        file: UploadFile,
        n_components: Optional[int],
        scale_data: Any,
        random_state: Optional[int],
    ) -> Any:
        if not file or not file.filename:
            return standardize_response(False, error="No file selected", status_code=400)
        if not file.filename.lower().endswith(".csv"):
            return standardize_response(False, error="Only CSV files are supported", status_code=400)

        try:
            content = await file.read()
            result = dataset_service.apply_pca_from_upload(
                filename=file.filename,
                content=content,
                n_components=n_components,
                scale_data=DatasetController._to_bool(scale_data, default=False),
                random_state=random_state,
            )
            return standardize_response(True, result, "PCA applied successfully")
        except ValueError as e:
            return standardize_response(False, error=str(e), status_code=400)
        except Exception as e:
            logger.error("PCA upload failed: %s", str(e))
            return standardize_response(False, error="PCA failed", status_code=500)

