import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional

import numpy as np
import pandas as pd
from sklearn.impute import KNNImputer
from sklearn.preprocessing import LabelEncoder, MinMaxScaler, StandardScaler

logger = logging.getLogger(__name__)


def safe_convert_to_json(obj: Any) -> Any:
    if isinstance(obj, (np.integer, np.floating)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, pd.Series):
        return obj.tolist()
    if isinstance(obj, dict):
        return {k: safe_convert_to_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [safe_convert_to_json(item) for item in obj]
    return obj


@dataclass
class ProcessingStatus:
    status: str = "idle"
    progress: int = 0
    message: str = ""
    result: Any = None
    error: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class EnhancedDataPreprocessor:
    def __init__(self, df: pd.DataFrame, dataset_id: str, status_callback: Optional[Callable[[str, int, str, str], None]] = None):
        self.df = df.copy()
        self.original_df = df.copy()
        self.dataset_id = dataset_id
        self.operations_log: List[Dict[str, Any]] = []
        self.processing_status = ProcessingStatus()
        self.cached_random_sample: Optional[pd.DataFrame] = None
        self.random_sample_timestamp: Optional[datetime] = None
        self._status_callback = status_callback

    def update_status(self, status: str, progress: Optional[int] = None, message: str = "") -> None:
        self.processing_status.status = status
        if progress is not None:
            self.processing_status.progress = progress
        self.processing_status.message = message

        if self._status_callback:
            self._status_callback(
                self.dataset_id,
                self.processing_status.progress,
                message,
                status,
            )

    def validate_columns(self, columns: Optional[List[str]], required_type: Optional[str] = None) -> List[str]:
        if columns is None:
            return list(self.df.columns)

        invalid_columns = [col for col in columns if col not in self.df.columns]
        if invalid_columns:
            raise ValueError(f"Invalid columns: {invalid_columns}")

        if required_type == "numeric":
            invalid_types = [col for col in columns if not pd.api.types.is_numeric_dtype(self.df[col])]
            if invalid_types:
                raise ValueError(f"Columns {invalid_types} are not numeric")

        if required_type == "categorical":
            invalid_types = [col for col in columns if pd.api.types.is_numeric_dtype(self.df[col])]
            if invalid_types:
                raise ValueError(f"Columns {invalid_types} are not categorical")

        return columns

    def get_random_sample(self, n: int = 5, force_refresh: bool = False) -> pd.DataFrame:
        current_time = datetime.now()

        refresh_required = (
            force_refresh
            or self.cached_random_sample is None
            or self.random_sample_timestamp is None
            or (current_time - self.random_sample_timestamp).seconds > 30
        )

        if refresh_required:
            sample_size = min(n, len(self.df))
            if sample_size > 0:
                random_seed = int(current_time.timestamp() * 1_000_000) % (2**32)
                self.cached_random_sample = self.df.sample(n=sample_size, random_state=random_seed)
                self.random_sample_timestamp = current_time
            else:
                self.cached_random_sample = self.df.head(0)

        return self.cached_random_sample

    def _invalidate_random_cache(self) -> None:
        self.cached_random_sample = None
        self.random_sample_timestamp = None

    def handle_missing_values(self, strategy: str = "mean", columns: Optional[List[str]] = None, fill_value: Any = None) -> Dict[str, Any]:
        self.update_status("processing", 0, "Starting missing value imputation...")
        columns = self.validate_columns(columns)
        results: Dict[str, Any] = {}

        if strategy == "remove":
            initial_rows = len(self.df)
            self.df = self.df.dropna(subset=columns)
            removed_rows = initial_rows - len(self.df)
            for col in columns:
                results[col] = {
                    "status": "rows_removed",
                    "rows_removed": int(removed_rows),
                    "strategy": strategy,
                }
            self._invalidate_random_cache()
            self.update_status("completed", 100, f"Removed {removed_rows} rows containing missing values")
            self.operations_log.append(
                {
                    "operation": "handle_missing_values",
                    "strategy": strategy,
                    "columns": columns,
                    "fill_value": safe_convert_to_json(fill_value),
                    "results": results,
                    "timestamp": datetime.now().isoformat(),
                }
            )
            return results

        total_columns = len(columns)
        for i, col in enumerate(columns):
            progress = int((i / total_columns) * 100) if total_columns else 100
            self.update_status("processing", progress, f"Processing column: {col}")

            missing_count_before = self.df[col].isnull().sum()
            if missing_count_before == 0:
                results[col] = {"status": "no_missing", "filled": 0}
                continue

            try:
                col_fill_value = fill_value

                if pd.api.types.is_numeric_dtype(self.df[col]):
                    if strategy == "mean":
                        col_fill_value = self.df[col].mean()
                    elif strategy == "median":
                        col_fill_value = self.df[col].median()
                    elif strategy == "mode":
                        mode_series = self.df[col].mode()
                        col_fill_value = mode_series.iloc[0] if not mode_series.empty else 0
                    elif strategy == "constant":
                        col_fill_value = col_fill_value if col_fill_value is not None else 0
                        col_fill_value = pd.to_numeric(pd.Series([col_fill_value]), errors="coerce").iloc[0]
                        if pd.isna(col_fill_value):
                            col_fill_value = 0
                    elif strategy == "forward_fill":
                        self.df[col] = self.df[col].ffill()
                        col_fill_value = None
                    elif strategy == "backward_fill":
                        self.df[col] = self.df[col].bfill()
                        col_fill_value = None
                    elif strategy == "knn":
                        imputer = KNNImputer(n_neighbors=min(5, max(1, len(self.df) - 1)))
                        self.df[col] = imputer.fit_transform(self.df[[col]]).flatten()
                        col_fill_value = None
                    else:
                        col_fill_value = self.df[col].mean()

                    if col_fill_value is not None:
                        self.df[col] = self.df[col].fillna(col_fill_value)
                else:
                    if strategy == "mode":
                        mode_series = self.df[col].mode()
                        col_fill_value = mode_series.iloc[0] if not mode_series.empty else "Unknown"
                    elif strategy == "constant":
                        col_fill_value = str(col_fill_value) if col_fill_value is not None else "Unknown"
                    elif strategy == "forward_fill":
                        self.df[col] = self.df[col].ffill()
                        col_fill_value = None
                    elif strategy == "backward_fill":
                        self.df[col] = self.df[col].bfill()
                        col_fill_value = None
                    else:
                        self.df[col] = self.df[col].ffill()
                        col_fill_value = None

                    if col_fill_value is not None:
                        self.df[col] = self.df[col].fillna(col_fill_value)

                missing_count_after = self.df[col].isnull().sum()
                results[col] = {
                    "status": "filled",
                    "filled": int(missing_count_before - missing_count_after),
                    "strategy": strategy,
                    "fill_value": safe_convert_to_json(col_fill_value) if col_fill_value is not None else None,
                }
            except Exception as e:
                logger.error("Error processing column %s: %s", col, str(e))
                results[col] = {"status": "error", "error": str(e)}

        self._invalidate_random_cache()
        self.update_status("completed", 100, "Missing value imputation completed")
        self.operations_log.append(
            {
                "operation": "handle_missing_values",
                "strategy": strategy,
                "columns": columns,
                "fill_value": safe_convert_to_json(fill_value),
                "results": results,
                "timestamp": datetime.now().isoformat(),
            }
        )
        return results

    def normalize_data(self, method: str = "standard", columns: Optional[List[str]] = None) -> Dict[str, Any]:
        self.update_status("processing", 0, "Starting data normalization...")
        if columns is None:
            columns = self.df.select_dtypes(include=[np.number]).columns.tolist()
        else:
            columns = self.validate_columns(columns, "numeric")

        results: Dict[str, Any] = {}
        total_columns = len(columns)

        for i, col in enumerate(columns):
            progress = int((i / total_columns) * 100) if total_columns else 100
            self.update_status("processing", progress, f"Normalizing column: {col}")

            try:
                original_stats = {
                    "mean": safe_convert_to_json(self.df[col].mean()),
                    "std": safe_convert_to_json(self.df[col].std()),
                    "min": safe_convert_to_json(self.df[col].min()),
                    "max": safe_convert_to_json(self.df[col].max()),
                }

                if method == "standard":
                    scaler = StandardScaler()
                    self.df[col] = scaler.fit_transform(self.df[[col]]).flatten()
                elif method == "minmax":
                    scaler = MinMaxScaler()
                    self.df[col] = scaler.fit_transform(self.df[[col]]).flatten()
                elif method == "robust":
                    median = self.df[col].median()
                    q75 = self.df[col].quantile(0.75)
                    q25 = self.df[col].quantile(0.25)
                    iqr = q75 - q25
                    if iqr != 0:
                        self.df[col] = (self.df[col] - median) / iqr

                new_stats = {
                    "mean": safe_convert_to_json(self.df[col].mean()),
                    "std": safe_convert_to_json(self.df[col].std()),
                    "min": safe_convert_to_json(self.df[col].min()),
                    "max": safe_convert_to_json(self.df[col].max()),
                }

                results[col] = {
                    "status": "success",
                    "method": method,
                    "original_stats": original_stats,
                    "new_stats": new_stats,
                }
            except Exception as e:
                logger.error("Error normalizing column %s: %s", col, str(e))
                results[col] = {"status": "error", "error": str(e)}

        self._invalidate_random_cache()
        self.update_status("completed", 100, "Data normalization completed")
        self.operations_log.append(
            {
                "operation": "normalize_data",
                "method": method,
                "columns": columns,
                "results": results,
                "timestamp": datetime.now().isoformat(),
            }
        )
        return results

    def encode_categorical(self, method: str = "label", columns: Optional[List[str]] = None) -> Dict[str, Any]:
        self.update_status("processing", 0, "Starting categorical encoding...")
        if columns is None:
            columns = self.df.select_dtypes(include=["object", "category"]).columns.tolist()
        else:
            columns = self.validate_columns(columns, "categorical")

        results: Dict[str, Any] = {}
        total_columns = len(columns)
        for i, col in enumerate(columns):
            progress = int((i / total_columns) * 100) if total_columns else 100
            self.update_status("processing", progress, f"Encoding column: {col}")

            try:
                unique_values = self.df[col].nunique()
                if method == "label":
                    le = LabelEncoder()
                    mask = self.df[col].notna()
                    if mask.sum() > 0:
                        self.df.loc[mask, col] = le.fit_transform(self.df.loc[mask, col])
                        results[col] = {
                            "status": "success",
                            "method": "label",
                            "unique_values": unique_values,
                            "classes": le.classes_.tolist(),
                        }
                    else:
                        results[col] = {"status": "skipped", "reason": "all_null"}
                elif method == "onehot":
                    if unique_values <= 20:
                        dummies = pd.get_dummies(self.df[col], prefix=col, dummy_na=True)
                        self.df = pd.concat([self.df.drop(col, axis=1), dummies], axis=1)
                        results[col] = {
                            "status": "success",
                            "method": "onehot",
                            "unique_values": unique_values,
                            "new_columns": dummies.columns.tolist(),
                        }
                    else:
                        results[col] = {
                            "status": "skipped",
                            "reason": "too_many_categories",
                            "unique_values": unique_values,
                            "recommendation": "Use label encoding or reduce categories",
                        }
            except Exception as e:
                logger.error("Error encoding column %s: %s", col, str(e))
                results[col] = {"status": "error", "error": str(e)}

        self._invalidate_random_cache()
        self.update_status("completed", 100, "Categorical encoding completed")
        self.operations_log.append(
            {
                "operation": "encode_categorical",
                "method": method,
                "columns": columns,
                "results": results,
                "timestamp": datetime.now().isoformat(),
            }
        )
        return results

    def remove_outliers(self, method: str = "iqr", columns: Optional[List[str]] = None, threshold: float = 1.5) -> Dict[str, Any]:
        self.update_status("processing", 0, "Starting outlier removal...")
        if columns is None:
            columns = self.df.select_dtypes(include=[np.number]).columns.tolist()
        else:
            columns = self.validate_columns(columns, "numeric")

        initial_rows = len(self.df)
        results: Dict[str, Any] = {}
        total_columns = len(columns)

        for i, col in enumerate(columns):
            progress = int((i / total_columns) * 100) if total_columns else 100
            self.update_status("processing", progress, f"Processing column: {col}")

            try:
                if method == "iqr":
                    q1 = self.df[col].quantile(0.25)
                    q3 = self.df[col].quantile(0.75)
                    iqr = q3 - q1
                    lower_bound = q1 - threshold * iqr
                    upper_bound = q3 + threshold * iqr
                    outliers_mask = (self.df[col] < lower_bound) | (self.df[col] > upper_bound)
                else:
                    z_scores = np.abs((self.df[col] - self.df[col].mean()) / self.df[col].std())
                    outliers_mask = z_scores > threshold

                outliers_count = int(outliers_mask.sum())
                self.df = self.df[~outliers_mask]
                results[col] = {
                    "status": "success",
                    "method": method,
                    "outliers_removed": outliers_count,
                    "threshold": threshold,
                }
            except Exception as e:
                logger.error("Error removing outliers from column %s: %s", col, str(e))
                results[col] = {"status": "error", "error": str(e)}

        total_removed = initial_rows - len(self.df)
        self._invalidate_random_cache()
        self.update_status("completed", 100, f"Outlier removal completed. Removed {total_removed} rows")
        self.operations_log.append(
            {
                "operation": "remove_outliers",
                "method": method,
                "columns": columns,
                "threshold": threshold,
                "total_rows_removed": total_removed,
                "results": results,
                "timestamp": datetime.now().isoformat(),
            }
        )
        return {"total_removed": total_removed, "column_results": results}

    def remove_duplicates(self) -> Dict[str, int]:
        self.update_status("processing", 50, "Removing duplicate rows...")
        initial_rows = len(self.df)
        self.df.drop_duplicates(inplace=True)
        removed_count = initial_rows - len(self.df)
        self._invalidate_random_cache()
        self.update_status("completed", 100, f"Removed {removed_count} duplicate rows")
        result = {"initial_rows": initial_rows, "final_rows": len(self.df), "removed_count": removed_count}
        self.operations_log.append(
            {"operation": "remove_duplicates", "result": result, "timestamp": datetime.now().isoformat()}
        )
        return result

    def get_comprehensive_summary(self) -> Dict[str, Any]:
        summary: Dict[str, Any] = {
            "shape": self.df.shape,
            "columns": self.df.columns.tolist(),
            "dtypes": {col: str(dtype) for col, dtype in self.df.dtypes.items()},
            "missing_values": {col: int(count) for col, count in self.df.isnull().sum().items()},
            "memory_usage": f"{self.df.memory_usage(deep=True).sum() / 1024:.2f} KB",
            "duplicate_rows": int(self.df.duplicated().sum()),
        }

        numerical_cols = self.df.select_dtypes(include=[np.number]).columns
        if len(numerical_cols) > 0:
            numerical_stats: Dict[str, Any] = {}
            for col in numerical_cols:
                if self.df[col].notna().sum() > 0:
                    numerical_stats[col] = {
                        "count": int(self.df[col].count()),
                        "mean": safe_convert_to_json(self.df[col].mean()),
                        "std": safe_convert_to_json(self.df[col].std()),
                        "min": safe_convert_to_json(self.df[col].min()),
                        "25%": safe_convert_to_json(self.df[col].quantile(0.25)),
                        "50%": safe_convert_to_json(self.df[col].quantile(0.50)),
                        "75%": safe_convert_to_json(self.df[col].quantile(0.75)),
                        "max": safe_convert_to_json(self.df[col].max()),
                    }
            summary["numerical_stats"] = numerical_stats

        categorical_cols = self.df.select_dtypes(include=["object", "category"]).columns
        if len(categorical_cols) > 0:
            categorical_stats: Dict[str, Any] = {}
            for col in categorical_cols:
                if self.df[col].notna().sum() > 0:
                    value_counts = self.df[col].value_counts().head(10)
                    categorical_stats[col] = {
                        "unique_count": int(self.df[col].nunique()),
                        "top_values": {str(k): int(v) for k, v in value_counts.items()},
                    }
            summary["categorical_stats"] = categorical_stats

        return summary

