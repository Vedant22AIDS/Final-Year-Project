import io
import logging
import threading
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA, TruncatedSVD
from sklearn.manifold import TSNE
from sklearn.preprocessing import StandardScaler

from core.preprocessor import EnhancedDataPreprocessor, safe_convert_to_json
from core.storage import dataset_storage
from services.agent_service import agent_service

try:
    import umap
    UMAP_AVAILABLE = True
except ImportError:
    UMAP_AVAILABLE = False

logger = logging.getLogger(__name__)


class DatasetService:
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50 MB

    def validate_dataset(self, dataset_id: str, rules: list) -> dict:
        """
        Validate dataset against a list of rules.
        Each rule: {"column": str, "rule": str, "severity": str}
        Supported rules: "Not Null", "Unique", "Min", "Max", "In List", "Regex"
        """
        import re
        df = self.get_preprocessor(dataset_id).df
        results = []
        for rule in rules:
            column = rule.get("column")
            rule_type = rule.get("rule")
            severity = rule.get("severity", "Medium")
            params = rule.get("params", {})
            if column not in df.columns:
                results.append({"column": column, "rule": rule_type, "severity": severity, "error": "Column not found", "passed": False, "failed_rows": []})
                continue
            failed_rows = []
            if rule_type == "Not Null":
                failed_rows = df[df[column].isnull()].index.tolist()
            elif rule_type == "Unique":
                duplicated = df[df.duplicated([column], keep=False)]
                failed_rows = duplicated.index.tolist()
            elif rule_type == "Min":
                min_val = params.get("min")
                if min_val is not None:
                    failed_rows = df[df[column] < min_val].index.tolist()
            elif rule_type == "Max":
                max_val = params.get("max")
                if max_val is not None:
                    failed_rows = df[df[column] > max_val].index.tolist()
            elif rule_type == "In List":
                allowed = params.get("allowed", [])
                failed_rows = df[~df[column].isin(allowed)].index.tolist()
            elif rule_type == "Regex":
                pattern = params.get("pattern")
                if pattern:
                    failed_rows = df[~df[column].astype(str).str.match(pattern)].index.tolist()
            else:
                results.append({"column": column, "rule": rule_type, "severity": severity, "error": f"Unsupported rule: {rule_type}", "passed": False, "failed_rows": []})
                continue
            passed = len(failed_rows) == 0
            results.append({"column": column, "rule": rule_type, "severity": severity, "passed": passed, "failed_rows": failed_rows})
        summary = {
            "total_rules": len(rules),
            "passed_rules": sum(1 for r in results if r.get("passed")),
            "failed_rules": sum(1 for r in results if not r.get("passed")),
        }
        return {"results": results, "summary": summary}

    def __init__(self) -> None:
        self.storage = dataset_storage

    def _detect_outliers_iqr(self, df: pd.DataFrame, threshold: float = 1.5) -> Dict[str, int]:
        outliers: Dict[str, int] = {}
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        for col in numeric_cols:
            series = df[col].dropna()
            if series.empty:
                continue
            q1 = series.quantile(0.25)
            q3 = series.quantile(0.75)
            iqr = q3 - q1
            if iqr == 0:
                continue
            lower_bound = q1 - threshold * iqr
            upper_bound = q3 + threshold * iqr
            count = int(((df[col] < lower_bound) | (df[col] > upper_bound)).sum())
            if count > 0:
                outliers[col] = count
        return outliers

    def _quality_metrics(self, df: pd.DataFrame) -> Dict[str, Any]:
        rows = int(len(df))
        cols = int(len(df.columns))
        missing_total = int(df.isna().sum().sum())
        duplicates = int(df.duplicated().sum())
        outliers = self._detect_outliers_iqr(df)
        outlier_total = int(sum(outliers.values()))

        total_cells = max(rows * max(cols, 1), 1)
        missing_ratio = missing_total / total_cells
        duplicate_ratio = duplicates / max(rows, 1)
        outlier_ratio = outlier_total / max(rows, 1)
        score = int(
            max(
                0,
                min(
                    100,
                    100
                    - (missing_ratio * 100 * 0.7)
                    - (duplicate_ratio * 100 * 1.2)
                    - (outlier_ratio * 10),
                ),
            )
        )

        return {
            "rows": rows,
            "columns": cols,
            "missing_total": missing_total,
            "duplicates": duplicates,
            "outliers": outliers,
            "outlier_total": outlier_total,
            "quality_score": score,
        }

    async def run_auto_cleaning(self, dataset_id: str) -> Dict[str, Any]:
        preprocessor = self.get_preprocessor(dataset_id)
        before_df = preprocessor.df.copy()
        cleaned_df = preprocessor.df.copy()
        transformations: List[Dict[str, Any]] = []

        before_metrics = self._quality_metrics(before_df)

        initial_rows = int(len(cleaned_df))
        cleaned_df = cleaned_df.drop_duplicates().reset_index(drop=True)
        duplicates_removed = initial_rows - int(len(cleaned_df))
        transformations.append(
            {
                "operation": "remove_duplicates",
                "rows_before": initial_rows,
                "rows_after": int(len(cleaned_df)),
                "duplicates_removed": duplicates_removed,
            }
        )

        dtype_fixes: Dict[str, str] = {}
        object_cols = cleaned_df.select_dtypes(include=["object"]).columns.tolist()
        for col in object_cols:
            non_null = cleaned_df[col].dropna()
            if non_null.empty:
                continue

            numeric_candidate = pd.to_numeric(non_null, errors="coerce")
            numeric_ratio = float(numeric_candidate.notna().mean())
            if numeric_ratio >= 0.8:
                cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors="coerce")
                dtype_fixes[col] = "numeric"
                continue

            datetime_candidate = pd.to_datetime(non_null, errors="coerce")
            datetime_ratio = float(datetime_candidate.notna().mean())
            if datetime_ratio >= 0.8:
                cleaned_df[col] = pd.to_datetime(cleaned_df[col], errors="coerce")
                dtype_fixes[col] = "datetime"

        if dtype_fixes:
            transformations.append(
                {
                    "operation": "fix_data_types",
                    "converted_columns": dtype_fixes,
                }
            )

        missing_before = int(cleaned_df.isna().sum().sum())
        missing_filled_by_column: Dict[str, int] = {}
        for col in cleaned_df.columns:
            before_col_missing = int(cleaned_df[col].isna().sum())
            if before_col_missing == 0:
                continue

            if pd.api.types.is_numeric_dtype(cleaned_df[col]):
                fill_value = cleaned_df[col].median()
                if pd.isna(fill_value):
                    fill_value = 0
                cleaned_df[col] = cleaned_df[col].fillna(fill_value)
            else:
                mode_series = cleaned_df[col].mode(dropna=True)
                fill_value = mode_series.iloc[0] if not mode_series.empty else "Unknown"
                cleaned_df[col] = cleaned_df[col].fillna(fill_value)

            after_col_missing = int(cleaned_df[col].isna().sum())
            missing_filled_by_column[col] = before_col_missing - after_col_missing

        missing_after = int(cleaned_df.isna().sum().sum())
        transformations.append(
            {
                "operation": "handle_missing_values",
                "missing_before": missing_before,
                "missing_after": missing_after,
                "filled_by_column": missing_filled_by_column,
                "strategy": "median_or_mode",
            }
        )

        outliers_detected = self._detect_outliers_iqr(cleaned_df)
        outlier_rows_mask = pd.Series(False, index=cleaned_df.index)
        numeric_cols = cleaned_df.select_dtypes(include=[np.number]).columns.tolist()
        for col in numeric_cols:
            series = cleaned_df[col]
            q1 = series.quantile(0.25)
            q3 = series.quantile(0.75)
            iqr = q3 - q1
            if pd.isna(iqr) or iqr == 0:
                continue
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            outlier_rows_mask = outlier_rows_mask | ((series < lower_bound) | (series > upper_bound))

        outlier_rows_removed = int(outlier_rows_mask.sum())
        if outlier_rows_removed > 0:
            cleaned_df = cleaned_df.loc[~outlier_rows_mask].reset_index(drop=True)

        transformations.append(
            {
                "operation": "remove_outliers",
                "method": "iqr",
                "threshold": 1.5,
                "outliers_detected": outliers_detected,
                "rows_removed": outlier_rows_removed,
            }
        )

        preprocessor.df = cleaned_df
        preprocessor._invalidate_random_cache()
        preprocessor.update_status("completed", 100, "Automated data cleaning completed")

        after_metrics = self._quality_metrics(cleaned_df)
        report = {
            "quality_score": after_metrics["quality_score"],
            "rows_before": before_metrics["rows"],
            "rows_after": after_metrics["rows"],
            "missing_before": before_metrics["missing_total"],
            "missing_after": after_metrics["missing_total"],
            "duplicates_removed": duplicates_removed,
            "outliers_before": before_metrics["outliers"],
            "outliers_after": after_metrics["outliers"],
            "issues_detected": {
                "missing_values": before_metrics["missing_total"],
                "duplicate_rows": before_metrics["duplicates"],
                "outlier_points": before_metrics["outlier_total"],
                "incorrect_dtypes": len(dtype_fixes),
            },
            "operations_performed": [
                "remove_duplicates",
                "fix_data_types",
                "handle_missing_values",
                "remove_outliers",
            ],
        }

        pipeline_output = {
            "duplicates_removed": duplicates_removed,
            "missing_before": before_metrics["missing_total"],
            "missing_after": after_metrics["missing_total"],
            "outliers_detected": before_metrics["outliers"],
            "outlier_rows_removed": outlier_rows_removed,
            "data_types_fixed": dtype_fixes,
        }

        explanation_prompt = (
            "Explain the preprocessing steps that were applied to improve the dataset quality. "
            "Use concise bullet points and include why each step matters. "
            f"Cleaning output: {pipeline_output}. Quality report: {report}."
        )
        try:
            explanation = await agent_service.answer_question(
                dataset_type="structured",
                summary=report,
                question=explanation_prompt,
            )
        except Exception as exc:
            logger.warning("Auto-clean explanation failed for dataset %s: %s", dataset_id, str(exc))
            explanation = (
                "- Duplicate rows were removed to reduce repeated records.\n"
                "- Missing values were imputed using median/mode defaults.\n"
                "- Numeric outliers were detected with IQR thresholds and removed.\n"
                "- Data types were auto-corrected where strong numeric/date patterns were found."
            )

        operation_log = {
            "operation": "run_auto_cleaning",
            "pipeline_output": safe_convert_to_json(pipeline_output),
            "report": safe_convert_to_json(report),
            "transformations": safe_convert_to_json(transformations),
            "timestamp": datetime.now().isoformat(),
        }
        preprocessor.operations_log.append(operation_log)

        return {
            "pipeline_output": safe_convert_to_json(pipeline_output),
            "report": safe_convert_to_json(report),
            "transformations": safe_convert_to_json(transformations),
            "ai_explanation": explanation,
            "cleaned_summary": preprocessor.get_comprehensive_summary(),
            "cleaned_sample": cleaned_df.head(10).fillna("null").to_dict("records"),
        }

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

        return self.create_dataset_from_dataframe(filename, df)

    def create_dataset_from_dataframe(self, filename: str, df: pd.DataFrame) -> Dict[str, Any]:
        if df.empty:
            raise ValueError("Query returned no data")
        if len(df) > 100000:
            raise ValueError("Dataset too large. Maximum 100,000 rows allowed.")

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
        import os
        dataset = self.get_dataset(dataset_id)
        # Check if PCA or other dimensionality reduction output exists
        pca_dir = os.path.join("backend", "generated_outputs", "dimensionality_reduction")
        base_name = self._safe_base_name(dataset["filename"])
        pca_file = os.path.join(pca_dir, f"{base_name}_pca.csv")
        if os.path.exists(pca_file):
            with open(pca_file, "rb") as f:
                csv_bytes = io.BytesIO(f.read())
            csv_bytes.seek(0)
            filename = f"{base_name}_pca.csv"
            return {"stream": csv_bytes, "filename": filename}
        # Fallback to original dataset
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
    #Himanshi's contribution for class imbalance analysis and balancing
    def analyze_class_imbalance(self, dataset_id: str, target: str):
        preprocessor = self.get_preprocessor(dataset_id)
        result = preprocessor.analyze_class_imbalance(target)
        return {"results": result, "summary": preprocessor.get_comprehensive_summary()}

    def apply_class_balancing(self, dataset_id: str, target: str, method: str):
        preprocessor = self.get_preprocessor(dataset_id)
        result = preprocessor.apply_class_balancing(target, method)
        return {"results": result, "summary": preprocessor.get_comprehensive_summary()}
    #ends
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
    def _safe_base_name(filename: str) -> str:
        import os
        base = os.path.splitext(os.path.basename(filename))[0]
        safe = "".join(ch if ch.isalnum() or ch in {"-", "_"} else "_" for ch in base)
        return safe or "dataset"

    def dimensionality_reduction_from_upload(
        self,
        filename: str,
        content: bytes,
        technique: str,
        n_components: Optional[int] = None,
        scale_data: Any = False,
        random_state: Optional[int] = 42,
        perplexity: float = 30.0,
        n_neighbors: int = 15,
    ) -> Dict[str, Any]:
        if not filename or not filename.lower().endswith(".csv"):
            raise ValueError("Only CSV files are supported")
        if len(content) > self.MAX_CONTENT_LENGTH:
            raise ValueError("File too large. Maximum size is 50MB.")

        try:
            df = pd.read_csv(io.BytesIO(content))
        except Exception as exc:
            raise ValueError(f"Invalid CSV file: {str(exc)}") from exc

        return self._run_dimensionality_reduction(
            df=df,
            source_filename=filename,
            technique=technique,
            n_components=n_components,
            scale_data=scale_data,
            random_state=random_state,
            perplexity=perplexity,
            n_neighbors=n_neighbors,
        )

    def dimensionality_reduction(
        self,
        dataset_id: str,
        technique: str,
        n_components: Optional[int] = None,
        scale_data: Any = False,
        random_state: Optional[int] = 42,
        perplexity: float = 30.0,
        n_neighbors: int = 15,
    ) -> Dict[str, Any]:
        dataset = self.get_dataset(dataset_id)
        df = dataset["preprocessor"].df
        source_filename = dataset.get("filename", f"{dataset_id}.csv")
        return self._run_dimensionality_reduction(
            df=df,
            source_filename=source_filename,
            technique=technique,
            n_components=n_components,
            scale_data=scale_data,
            random_state=random_state,
            perplexity=perplexity,
            n_neighbors=n_neighbors,
        )

    def apply_pca(
        self,
        dataset_id: str,
        n_components: Optional[int] = None,
        scale_data: Any = False,
        random_state: Optional[int] = 42,
    ) -> Dict[str, Any]:
        return self.dimensionality_reduction(
            dataset_id=dataset_id,
            technique="pca",
            n_components=n_components,
            scale_data=scale_data,
            random_state=random_state,
        )

    def apply_pca_from_upload(
        self,
        filename: str,
        content: bytes,
        n_components: Optional[int] = None,
        scale_data: Any = False,
        random_state: Optional[int] = 42,
    ) -> Dict[str, Any]:
        return self.dimensionality_reduction_from_upload(
            filename=filename,
            content=content,
            technique="pca",
            n_components=n_components,
            scale_data=scale_data,
            random_state=random_state,
        )

    def _run_dimensionality_reduction(
        self,
        df: pd.DataFrame,
        source_filename: str,
        technique: str,
        n_components: Optional[int],
        scale_data: Any,
        random_state: Optional[int],
        perplexity: float,
        n_neighbors: int,
    ) -> Dict[str, Any]:
        import os

        if df.empty:
            raise ValueError("Dataset is empty")

        technique_lower = (technique or "").strip().lower()
        if technique_lower not in {"pca", "svd", "tsne", "umap"}:
            raise ValueError('Invalid technique. Must be one of: "pca", "svd", "tsne", "umap"')

        numeric_df = df.select_dtypes(include=[np.number]).copy()
        numeric_cols = numeric_df.columns.tolist()
        if not numeric_cols:
            raise ValueError("No numeric columns detected in the dataset")

        x = numeric_df.fillna(0.0).values
        n_samples, n_features = x.shape

        should_scale = self._to_bool(scale_data, default=False)
        if should_scale:
            x = StandardScaler().fit_transform(x)

        if technique_lower in {"tsne", "umap"}:
            if n_components is None:
                n_components = 2
            n_components = int(n_components)
            if n_components != 2:
                raise ValueError(f"{technique_lower.upper()} supports only n_components=2 for visualization")
        else:
            if n_components is None:
                n_components = min(2, n_features)
            n_components = int(n_components)
            if n_components < 1:
                raise ValueError("n_components must be >= 1")
            max_components = min(n_samples, n_features)
            if n_components > max_components:
                raise ValueError(f"n_components must be <= {max_components} for {technique_lower.upper()}")

        explained_variance_ratio = None
        cumulative_variance = None

        if technique_lower == "pca":
            model = PCA(n_components=n_components, random_state=random_state)
            transformed = model.fit_transform(x)
            explained_variance_ratio = model.explained_variance_ratio_.tolist()
            cumulative_variance = np.cumsum(model.explained_variance_ratio_).tolist()
            columns = [f"PC{i + 1}" for i in range(n_components)]
        elif technique_lower == "svd":
            model = TruncatedSVD(n_components=n_components, random_state=random_state)
            transformed = model.fit_transform(x)
            explained_variance_ratio = model.explained_variance_ratio_.tolist()
            cumulative_variance = np.cumsum(model.explained_variance_ratio_).tolist()
            columns = [f"PC{i + 1}" for i in range(n_components)]
        elif technique_lower == "tsne":
            if perplexity <= 0:
                raise ValueError("perplexity must be > 0 for t-SNE")
            if perplexity >= n_samples:
                raise ValueError(f"perplexity must be < number of samples ({n_samples}) for t-SNE")
            model = TSNE(
                n_components=2,
                perplexity=float(perplexity),
                random_state=random_state,
                init="pca",
                learning_rate="auto",
            )
            transformed = model.fit_transform(x)
            columns = ["Dim1", "Dim2"]
        else:
            if not UMAP_AVAILABLE:
                raise ValueError("UMAP library not available. Install with: pip install umap-learn")
            if n_neighbors < 2:
                raise ValueError("n_neighbors must be >= 2 for UMAP")
            model = umap.UMAP(
                n_components=2,
                n_neighbors=int(n_neighbors),
                random_state=random_state,
            )
            transformed = model.fit_transform(x)
            columns = ["Dim1", "Dim2"]

        transformed_df = pd.DataFrame(transformed, columns=columns)
        # Try to include label/target column if present in original df
        label_col = None
        for possible_label in ["species", "target", "label", "class"]:
            if possible_label in df.columns:
                label_col = possible_label
                break
        if label_col:
            transformed_df[label_col] = df[label_col].values
        out_dir = os.path.join("backend", "generated_outputs", "dimensionality_reduction")
        os.makedirs(out_dir, exist_ok=True)
        output_filename = f"{self._safe_base_name(source_filename)}_{technique_lower}.csv"
        output_path = os.path.join(out_dir, output_filename)
        # Only export PC columns and label (if present)
        export_cols = columns + ([label_col] if label_col else [])
        transformed_df.to_csv(output_path, index=False, columns=export_cols)

        result: Dict[str, Any] = {
            "technique": technique_lower,
            "input_shape": {"rows": int(df.shape[0]), "columns": int(df.shape[1])},
            "numeric_columns": numeric_cols,
            "n_components": int(n_components),
            "scale_data": bool(should_scale),
            "column_names": columns,
            "transformed_data": transformed_df.to_dict(orient="records"),
            "output_file": output_filename,
            "output_path": output_path,
        }

        if technique_lower in {"pca", "svd"}:
            result["explained_variance_ratio"] = explained_variance_ratio
            result["cumulative_variance"] = cumulative_variance
        else:
            result["plot_data"] = transformed_df.rename(columns={columns[0]: "x", columns[1]: "y"}).to_dict(orient="records")

        return result


dataset_service = DatasetService()

