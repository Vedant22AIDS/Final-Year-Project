import io
import logging
import threading
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

from core.preprocessor import EnhancedDataPreprocessor, safe_convert_to_json
from core.storage import dataset_storage

logger = logging.getLogger(__name__)


class DatasetService:
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB

    def __init__(self) -> None:
        self.storage = dataset_storage

    def _set_status(self, dataset_id: str, progress: int, message: str, status: str) -> None:
        with self.storage.lock:
            self.storage.processing_status[dataset_id] = {
                "status": status,
                "progress": progress,
                "message": message,
            }

    def get_dataset(self, dataset_id: str) -> Dict[str, Any]:
        with self.storage.lock:
            dataset = self.storage.datasets.get(dataset_id)
        if dataset is None:
            raise ValueError(f"Dataset {dataset_id} not found")
        return dataset

    def get_preprocessor(self, dataset_id: str) -> EnhancedDataPreprocessor:
        return self.get_dataset(dataset_id)["preprocessor"]

    def create_dataset_from_upload(self, filename: str, content: bytes) -> Dict[str, Any]:
        if len(content) > self.MAX_CONTENT_LENGTH:
            raise ValueError("File too large. Maximum size is 50MB.")

        if filename.lower().endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.lower().endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise ValueError("Invalid file format. Please upload CSV, XLSX, or XLS files.")

        if df.empty:
            raise ValueError("File is empty")
        if len(df) > 100000:
            raise ValueError("File too large. Maximum 100,000 rows allowed.")

        dataset_id = str(uuid.uuid4())
        preprocessor = EnhancedDataPreprocessor(df, dataset_id, status_callback=self._set_status)

        with self.storage.lock:
            self.storage.datasets[dataset_id] = {
                "filename": filename,
                "preprocessor": preprocessor,
                "created_at": datetime.now().isoformat(),
            }
            self.storage.processing_status[dataset_id] = {
                "status": "idle",
                "progress": 0,
                "message": "Dataset loaded successfully",
            }

        return {
            "dataset_id": dataset_id,
            "filename": filename,
            "summary": preprocessor.get_comprehensive_summary(),
            "sample_data": df.head(10).fillna("null").to_dict("records"),
        }

    def get_status(self, dataset_id: str) -> Dict[str, Any]:
        with self.storage.lock:
            return self.storage.processing_status.get(
                dataset_id,
                {"status": "not_found", "progress": 0, "message": "Dataset not found"},
            )

    def get_preview(self, dataset_id: str, page: int = 1, per_page: int = 10, view_type: str = "head", refresh: bool = False) -> Dict[str, Any]:
        preprocessor = self.get_preprocessor(dataset_id)
        df = preprocessor.df
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page

        vt = view_type.lower()
        if vt == "tail":
            sample_df = df.tail(per_page)
        elif vt in ["random", "randomsample"]:
            sample_df = preprocessor.get_random_sample(n=per_page, force_refresh=refresh)
        else:
            sample_df = df.iloc[start_idx:end_idx]

        data = sample_df.fillna("null").to_dict("records")
        return {
            "data": data,
            "total_rows": len(df),
            "page": page,
            "per_page": per_page,
            "total_pages": (len(df) + per_page - 1) // per_page,
            "view_type": vt,
            "sample_size": len(data),
        }

    def refresh_random_sample(self, dataset_id: str, n: int = 5) -> Dict[str, Any]:
        preprocessor = self.get_preprocessor(dataset_id)
        sample_df = preprocessor.get_random_sample(n=n, force_refresh=True)
        data = sample_df.fillna("null").to_dict("records")
        return {"data": data, "sample_size": len(data), "refreshed": True}

    def _run_async(self, dataset_id: str, runner) -> None:
        def worker() -> None:
            try:
                runner()
            except Exception as e:
                logger.error("Async operation error for dataset %s: %s", dataset_id, str(e))
                self._set_status(dataset_id, 0, str(e), "error")

        thread = threading.Thread(target=worker, daemon=True)
        thread.start()

    def handle_missing_values(
        self,
        dataset_id: str,
        strategy: str,
        columns: Optional[List[str]],
        fill_value: Any,
        async_processing: bool = False,
    ) -> Dict[str, Any]:
        preprocessor = self.get_preprocessor(dataset_id)
        if async_processing:
            self._run_async(dataset_id, lambda: preprocessor.handle_missing_values(strategy, columns, fill_value))
            return {"processing": True, "message": "Processing started. Check status endpoint for progress."}

        results = preprocessor.handle_missing_values(strategy, columns, fill_value)
        return {"results": results, "summary": preprocessor.get_comprehensive_summary()}

    def normalize_data(
        self,
        dataset_id: str,
        method: str,
        columns: Optional[List[str]],
        async_processing: bool = False,
    ) -> Dict[str, Any]:
        preprocessor = self.get_preprocessor(dataset_id)
        if async_processing:
            self._run_async(dataset_id, lambda: preprocessor.normalize_data(method, columns))
            return {"processing": True, "message": "Processing started. Check status endpoint for progress."}

        results = preprocessor.normalize_data(method, columns)
        return {"results": results, "summary": preprocessor.get_comprehensive_summary()}

    def encode_categorical(
        self,
        dataset_id: str,
        method: str,
        columns: Optional[List[str]],
        async_processing: bool = False,
    ) -> Dict[str, Any]:
        preprocessor = self.get_preprocessor(dataset_id)
        if async_processing:
            self._run_async(dataset_id, lambda: preprocessor.encode_categorical(method, columns))
            return {"processing": True, "message": "Processing started. Check status endpoint for progress."}

        results = preprocessor.encode_categorical(method, columns)
        return {"results": results, "summary": preprocessor.get_comprehensive_summary()}

    def remove_outliers(
        self,
        dataset_id: str,
        method: str,
        columns: Optional[List[str]],
        threshold: float,
        async_processing: bool = False,
    ) -> Dict[str, Any]:
        preprocessor = self.get_preprocessor(dataset_id)
        if async_processing:
            self._run_async(dataset_id, lambda: preprocessor.remove_outliers(method, columns, threshold))
            return {"processing": True, "message": "Processing started. Check status endpoint for progress."}

        results = preprocessor.remove_outliers(method, columns, threshold)
        return {"results": results, "summary": preprocessor.get_comprehensive_summary()}

    def remove_duplicates(self, dataset_id: str) -> Dict[str, Any]:
        preprocessor = self.get_preprocessor(dataset_id)
        results = preprocessor.remove_duplicates()
        return {"results": results, "summary": preprocessor.get_comprehensive_summary()}

    def get_correlation_analysis(self, dataset_id: str) -> Dict[str, Any]:
        df = self.get_preprocessor(dataset_id).df
        numerical_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        if len(numerical_cols) < 2:
            return {
                "numericalColumns": numerical_cols,
                "correlationMatrix": [],
                "strongCorrelations": [],
                "insights": ["Not enough numerical columns for correlation analysis. Need at least 2 numerical columns."],
            }

        corr_matrix = df[numerical_cols].corr()
        correlation_matrix = []
        for i, col1 in enumerate(numerical_cols):
            row = []
            for j, col2 in enumerate(numerical_cols):
                corr_value = corr_matrix.iloc[i, j]
                if pd.isna(corr_value):
                    corr_value = 0
                abs_corr = abs(corr_value)
                if abs_corr >= 0.7:
                    strength = "strong"
                elif abs_corr >= 0.5:
                    strength = "moderate"
                else:
                    strength = "weak"
                row.append(
                    {
                        "value": safe_convert_to_json(corr_value),
                        "strength": strength,
                        "col1": col1,
                        "col2": col2,
                    }
                )
            correlation_matrix.append(row)

        strong_correlations = []
        for i in range(len(numerical_cols)):
            for j in range(i + 1, len(numerical_cols)):
                corr_value = correlation_matrix[i][j]["value"]
                if abs(corr_value) >= 0.5:
                    strong_correlations.append(
                        {
                            "col1": numerical_cols[i],
                            "col2": numerical_cols[j],
                            "correlation": corr_value,
                            "strength": correlation_matrix[i][j]["strength"],
                            "direction": "positive" if corr_value > 0 else "negative",
                        }
                    )

        insights = []
        if len(strong_correlations) == 0:
            insights.append("No strong correlations found between variables.")
        else:
            insights.append(f"Found {len(strong_correlations)} strong correlation(s).")
            for corr in strong_correlations[:3]:
                insights.append(
                    f"{corr['col1']} and {corr['col2']} have a {corr['strength']} {corr['direction']} correlation ({corr['correlation']:.3f})."
                )

        return {
            "numericalColumns": numerical_cols,
            "correlationMatrix": correlation_matrix,
            "strongCorrelations": strong_correlations,
            "insights": insights,
        }

    def export_csv(self, dataset_id: str) -> Dict[str, Any]:
        dataset = self.get_dataset(dataset_id)
        df = dataset["preprocessor"].df
        output = io.StringIO()
        df.to_csv(output, index=False)
        csv_bytes = io.BytesIO(output.getvalue().encode("utf-8"))
        csv_bytes.seek(0)
        filename = f"processed_{dataset['filename']}"
        return {"stream": csv_bytes, "filename": filename}

    def reset_dataset(self, dataset_id: str) -> Dict[str, Any]:
        preprocessor = self.get_preprocessor(dataset_id)
        preprocessor.df = preprocessor.original_df.copy()
        preprocessor.operations_log = []
        preprocessor.cached_random_sample = None
        preprocessor.random_sample_timestamp = None
        preprocessor.update_status("idle", 0, "Dataset reset to original state")
        return {"summary": preprocessor.get_comprehensive_summary()}

    def get_history(self, dataset_id: str) -> Dict[str, Any]:
        preprocessor = self.get_preprocessor(dataset_id)
        return {"operations": preprocessor.operations_log, "total_operations": len(preprocessor.operations_log)}

    def get_dataframe(self, dataset_id: str) -> pd.DataFrame:
        return self.get_preprocessor(dataset_id).df


dataset_service = DatasetService()

