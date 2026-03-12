import logging
import asyncio
from datetime import datetime
from typing import Any, Dict, List

import numpy as np
import pandas as pd

from core.preprocessor import safe_convert_to_json
from core.storage import dataset_storage
from services.agent_service import agent_service

logger = logging.getLogger(__name__)


class AutoCleaningService:
    def _get_preprocessor(self, dataset_id: str):
        with dataset_storage.lock:
            dataset = dataset_storage.datasets.get(dataset_id)
        if dataset is None:
            raise ValueError(f"Dataset {dataset_id} not found")
        return dataset["preprocessor"]

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
            lower = q1 - threshold * iqr
            upper = q3 + threshold * iqr
            count = int(((df[col] < lower) | (df[col] > upper)).sum())
            if count > 0:
                outliers[col] = count
        return outliers

    def _quality_snapshot(self, df: pd.DataFrame) -> Dict[str, Any]:
        rows = int(len(df))
        cols = int(len(df.columns))
        missing_total = int(df.isna().sum().sum())
        duplicate_rows = int(df.duplicated().sum())
        outliers = self._detect_outliers_iqr(df)
        outlier_points = int(sum(outliers.values()))

        total_cells = max(rows * max(cols, 1), 1)
        missing_ratio = missing_total / total_cells
        duplicate_ratio = duplicate_rows / max(rows, 1)
        outlier_ratio = outlier_points / max(rows, 1)

        quality_score = int(
            max(
                0,
                min(
                    100,
                    100
                    - (missing_ratio * 100 * 0.8)
                    - (duplicate_ratio * 100 * 1.2)
                    - (outlier_ratio * 10),
                ),
            )
        )

        return {
            "rows": rows,
            "columns": cols,
            "missing_total": missing_total,
            "duplicate_rows": duplicate_rows,
            "outliers": outliers,
            "outlier_points": outlier_points,
            "quality_score": quality_score,
        }

    def _fix_dtypes(self, df: pd.DataFrame) -> Dict[str, str]:
        converted: Dict[str, str] = {}
        object_cols = df.select_dtypes(include=["object"]).columns.tolist()

        for col in object_cols:
            non_null = df[col].dropna()
            if non_null.empty:
                continue

            sample = non_null
            if len(non_null) > 2000:
                sample = non_null.sample(n=2000, random_state=42)

            numeric_candidate = pd.to_numeric(sample, errors="coerce")
            if float(numeric_candidate.notna().mean()) >= 0.85:
                df[col] = pd.to_numeric(df[col], errors="coerce")
                converted[col] = "numeric"
                continue

            datetime_candidate = pd.to_datetime(sample, errors="coerce")
            if float(datetime_candidate.notna().mean()) >= 0.85:
                df[col] = pd.to_datetime(df[col], errors="coerce")
                converted[col] = "datetime"

        return converted

    def _impute_missing(self, df: pd.DataFrame) -> Dict[str, int]:
        filled_by_column: Dict[str, int] = {}

        for col in df.columns:
            missing_before = int(df[col].isna().sum())
            if missing_before == 0:
                continue

            if pd.api.types.is_numeric_dtype(df[col]):
                fill_val = df[col].median()
                if pd.isna(fill_val):
                    fill_val = 0
                df[col] = df[col].fillna(fill_val)
            else:
                mode_series = df[col].mode(dropna=True)
                fill_val = mode_series.iloc[0] if not mode_series.empty else "Unknown"
                df[col] = df[col].fillna(fill_val)

            missing_after = int(df[col].isna().sum())
            filled_by_column[col] = missing_before - missing_after

        return filled_by_column

    def _remove_outliers(self, df: pd.DataFrame, threshold: float = 1.5) -> int:
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        if not numeric_cols:
            return 0

        mask = pd.Series(False, index=df.index)
        for col in numeric_cols:
            series = df[col]
            q1 = series.quantile(0.25)
            q3 = series.quantile(0.75)
            iqr = q3 - q1
            if pd.isna(iqr) or iqr == 0:
                continue
            lower = q1 - threshold * iqr
            upper = q3 + threshold * iqr
            mask = mask | ((series < lower) | (series > upper))

        removed = int(mask.sum())
        if removed > 0:
            df.drop(index=df.index[mask], inplace=True)
            df.reset_index(drop=True, inplace=True)
        return removed

    async def run(self, dataset_id: str) -> Dict[str, Any]:
        preprocessor = self._get_preprocessor(dataset_id)
        before_df = preprocessor.df.copy()
        working_df = preprocessor.df.copy()

        before_summary = preprocessor.get_comprehensive_summary()
        before_metrics = self._quality_snapshot(before_df)

        transformations: List[Dict[str, Any]] = []

        rows_before = int(len(working_df))
        working_df = working_df.drop_duplicates().reset_index(drop=True)
        duplicates_removed = rows_before - int(len(working_df))
        transformations.append(
            {
                "operation": "remove_duplicates",
                "rows_before": rows_before,
                "rows_after": int(len(working_df)),
                "duplicates_removed": duplicates_removed,
            }
        )

        converted_dtypes = self._fix_dtypes(working_df)
        transformations.append(
            {
                "operation": "fix_data_types",
                "converted_columns": converted_dtypes,
                "converted_count": len(converted_dtypes),
            }
        )

        missing_before = int(working_df.isna().sum().sum())
        filled_by_column = self._impute_missing(working_df)
        missing_after = int(working_df.isna().sum().sum())
        transformations.append(
            {
                "operation": "impute_missing_values",
                "strategy": "median_or_mode",
                "missing_before": missing_before,
                "missing_after": missing_after,
                "filled_by_column": filled_by_column,
            }
        )

        outliers_detected = self._detect_outliers_iqr(working_df)
        outlier_rows_removed = self._remove_outliers(working_df, threshold=1.5)
        transformations.append(
            {
                "operation": "remove_outliers",
                "method": "iqr",
                "threshold": 1.5,
                "outliers_detected": outliers_detected,
                "rows_removed": outlier_rows_removed,
            }
        )

        preprocessor.df = working_df
        preprocessor._invalidate_random_cache()
        preprocessor.update_status("completed", 100, "Auto cleaning completed")

        after_metrics = self._quality_snapshot(working_df)
        after_summary = preprocessor.get_comprehensive_summary()

        report = {
            "report_type": "dataset_quality_turnitin_style",
            "generated_at": datetime.now().isoformat(),
            "quality_score": after_metrics["quality_score"],
            "rows_before": before_metrics["rows"],
            "rows_after": after_metrics["rows"],
            "missing_before": before_metrics["missing_total"],
            "missing_after": after_metrics["missing_total"],
            "duplicates_removed": duplicates_removed,
            "issues_detected": {
                "missing_values": before_metrics["missing_total"],
                "duplicate_rows": before_metrics["duplicate_rows"],
                "outlier_points": before_metrics["outlier_points"],
                "incorrect_dtypes": len(converted_dtypes),
            },
            "operations_performed": [step["operation"] for step in transformations],
            "before_snapshot": before_metrics,
            "after_snapshot": after_metrics,
        }

        pipeline_output = {
            "duplicates_removed": duplicates_removed,
            "missing_before": before_metrics["missing_total"],
            "missing_after": after_metrics["missing_total"],
            "outliers_detected": outliers_detected,
            "outlier_rows_removed": outlier_rows_removed,
            "data_types_fixed": converted_dtypes,
        }

        explanation_prompt = (
            "Explain the preprocessing steps that were applied to improve dataset quality. "
            "Use concise bullet points and mention why each operation matters. "
            f"Dataset summary before: {before_summary}. Dataset summary after: {after_summary}. "
            f"Pipeline output: {pipeline_output}. Report: {report}."
        )

        try:
            ai_explanation = await asyncio.wait_for(
                agent_service.answer_question(
                    dataset_type="structured",
                    summary=report,
                    question=explanation_prompt,
                ),
                timeout=20,
            )
        except asyncio.TimeoutError:
            logger.warning("AI explanation timed out for dataset %s", dataset_id)
            ai_explanation = (
                "- Duplicate rows were removed to reduce repeated signals.\n"
                "- Missing values were imputed using median/mode to retain row coverage.\n"
                "- Data types were normalized when values strongly indicated numeric/datetime data.\n"
                "- Outlier rows were filtered with IQR thresholds to improve robustness."
            )
        except Exception as exc:
            logger.warning("Failed to generate AI explanation for %s: %s", dataset_id, str(exc))
            ai_explanation = (
                "- Duplicate rows were removed to reduce repeated signals.\n"
                "- Missing values were imputed using median/mode to retain row coverage.\n"
                "- Data types were normalized when values strongly indicated numeric/datetime data.\n"
                "- Outlier rows were filtered with IQR thresholds to improve robustness."
            )

        report_text = (
            "DATASET QUALITY REPORT\n"
            f"Quality Score: {report['quality_score']}\n"
            f"Rows: {report['rows_before']} -> {report['rows_after']}\n"
            f"Missing Values: {report['missing_before']} -> {report['missing_after']}\n"
            f"Duplicates Removed: {report['duplicates_removed']}\n"
            f"Operations: {', '.join(report['operations_performed'])}\n"
        )

        preprocessor.operations_log.append(
            {
                "operation": "auto_cleaning_pipeline_v2",
                "pipeline_output": safe_convert_to_json(pipeline_output),
                "report": safe_convert_to_json(report),
                "transformations": safe_convert_to_json(transformations),
                "timestamp": datetime.now().isoformat(),
            }
        )

        return {
            "pipeline_output": safe_convert_to_json(pipeline_output),
            "turnitin_style_report": safe_convert_to_json(report),
            "report_text": report_text,
            "transformations": safe_convert_to_json(transformations),
            "ai_explanation": ai_explanation,
            "before_summary": safe_convert_to_json(before_summary),
            "after_summary": safe_convert_to_json(after_summary),
            "cleaned_sample": working_df.head(10).fillna("null").to_dict("records"),
        }


auto_cleaning_service = AutoCleaningService()
