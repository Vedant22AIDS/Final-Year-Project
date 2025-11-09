# utils/data_analyzer.py
import pandas as pd
import numpy as np
from scipy import stats
from pandas.api import types as pd_types
from typing import Dict, Any, List


class DataAnalyzer:
    @staticmethod
    def analyze_data_quality(df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze overall data quality"""
        row_count, col_count = df.shape
        total_cells = row_count * col_count if row_count and col_count else 0
        missing_cells = int(df.isnull().sum().sum())

        # Avoid division by zero
        missing_pct = (missing_cells / total_cells * 100) if total_cells else 0.0
        missing_penalty = min(50, missing_pct)

        # Check for duplicates
        duplicate_rows = int(df.duplicated().sum())
        duplicate_penalty = min(20, (duplicate_rows / row_count * 100) if row_count else 0.0)

        # Check for constant columns
        constant_cols = [col for col in df.columns if df[col].nunique(dropna=True) <= 1]
        constant_penalty = min(10, (len(constant_cols) / len(df.columns) * 100) if len(df.columns) else 0.0)

        quality_score = max(0, 100 - missing_penalty - duplicate_penalty - constant_penalty)

        return {
            "score": round(quality_score),
            "total_cells": total_cells,
            "missing_cells": missing_cells,
            "missing_percentage": round(missing_pct, 2),
            "duplicate_rows": duplicate_rows,
            "constant_columns": constant_cols,
            "issues": DataAnalyzer._identify_issues(df),
        }

    @staticmethod
    def _identify_issues(df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Identify specific data quality issues"""
        issues: List[Dict[str, Any]] = []

        n = len(df)
        if n == 0:
            return issues

        # Missing values
        missing_counts = df.isnull().sum()
        high_missing = missing_counts[missing_counts > n * 0.3]
        for col, count in high_missing.items():
            pct = (count / n) * 100
            severity = "high" if pct > 70 else "medium"
            issues.append(
                {
                    "type": f"High missing values in {col}",
                    "count": int(count),
                    "severity": severity,
                    "description": f"{pct:.1f}% missing values",
                }
            )

        # Duplicate rows
        duplicates = int(df.duplicated().sum())
        if duplicates > 0:
            severity = "high" if duplicates > n * 0.1 else "medium"
            issues.append(
                {
                    "type": "Duplicate rows",
                    "count": duplicates,
                    "severity": severity,
                    "description": f"{(duplicates / n * 100):.1f}% of rows are duplicates",
                }
            )

        # Constant columns
        for col in df.columns:
            if df[col].nunique(dropna=True) <= 1:
                issues.append(
                    {
                        "type": f"Constant column: {col}",
                        "count": 1,
                        "severity": "low",
                        "description": "Column has only one unique value",
                    }
                )

        # Outliers in numerical columns
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        for col in numerical_cols:
            col_nonnull = df[col].dropna()
            if col_nonnull.size > 0:
                Q1 = col_nonnull.quantile(0.25)
                Q3 = col_nonnull.quantile(0.75)
                IQR = Q3 - Q1
                if IQR == 0:
                    outliers = 0
                else:
                    outliers = int(col_nonnull[(col_nonnull < Q1 - 1.5 * IQR) | (col_nonnull > Q3 + 1.5 * IQR)].count())

                if outliers > n * 0.05:  # More than 5% outliers
                    issues.append(
                        {
                            "type": f"Outliers in {col}",
                            "count": outliers,
                            "severity": "medium",
                            "description": f"{(outliers / n * 100):.1f}% potential outliers",
                        }
                    )

        return issues

    @staticmethod
    def generate_column_insights(df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Generate insights for each column"""
        insights: List[Dict[str, Any]] = []

        n = len(df)
        for col in df.columns:
            col_data = df[col]
            non_null_count = int(col_data.notna().sum())
            null_count = int(col_data.isnull().sum())
            null_percentage = (null_count / n * 100) if n else 0.0

            insight: Dict[str, Any] = {
                "name": col,
                "dtype": str(col_data.dtype),
                "non_null_count": non_null_count,
                "null_count": null_count,
                "null_percentage": null_percentage,
                "unique_count": int(col_data.nunique(dropna=True)),
                "memory_usage": int(col_data.memory_usage(deep=True)),
            }

            # Numerical column detection
            if pd_types.is_numeric_dtype(col_data):
                insight["type"] = "numerical"
                if non_null_count > 0:
                    series = col_data.dropna().astype(float)
                    insight["stats"] = {
                        "mean": float(series.mean()),
                        "median": float(series.median()),
                        "std": float(series.std()),
                        "min": float(series.min()),
                        "max": float(series.max()),
                        "skewness": float(stats.skew(series)),
                        "kurtosis": float(stats.kurtosis(series)),
                    }
                    # Outliers
                    Q1 = series.quantile(0.25)
                    Q3 = series.quantile(0.75)
                    IQR = Q3 - Q1
                    if IQR != 0:
                        outliers = int(series[(series < Q1 - 1.5 * IQR) | (series > Q3 + 1.5 * IQR)].count())
                    else:
                        outliers = 0
                    insight["outliers"] = outliers
            elif pd_types.is_datetime64_any_dtype(col_data):
                insight["type"] = "datetime"
            else:
                # Categorical / object
                insight["type"] = "categorical"
                if non_null_count > 0:
                    value_counts = col_data.value_counts()
                    insight["top_values"] = value_counts.head(10).to_dict()
                    insight["cardinality"] = int(len(value_counts))

                    # Check if it might be a date-like column
                    sample_values = col_data.dropna().head(100)
                    date_like = 0
                    for val in sample_values:
                        try:
                            pd.to_datetime(val)
                            date_like += 1
                        except Exception:
                            pass
                    if sample_values.size and date_like > sample_values.size * 0.8:
                        insight["potential_date"] = True

            insights.append(insight)

        return insights

    @staticmethod
    def suggest_preprocessing_steps(df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Suggest preprocessing steps based on data analysis"""
        suggestions: List[Dict[str, Any]] = []
        n = len(df)

        # Check missing values
        missing_counts = df.isnull().sum()
        total_missing = int(missing_counts.sum())
        if total_missing > 0:
            suggestions.append(
                {
                    "step": "handle_missing_values",
                    "priority": "high",
                    "description": f"Handle {total_missing} missing values across {(missing_counts > 0).sum()} columns",
                    "recommended_strategy": "mean for numerical, mode for categorical",
                }
            )

        # Check duplicates
        duplicates = int(df.duplicated().sum())
        if duplicates > 0:
            suggestions.append(
                {
                    "step": "remove_duplicates",
                    "priority": "high",
                    "description": f"Remove {duplicates} duplicate rows",
                    "recommended_strategy": "drop_duplicates",
                }
            )

        # Check for normalization needs
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        if len(numerical_cols) > 1:
            ranges = {}
            for col in numerical_cols:
                col_nonnull = df[col].dropna()
                if col_nonnull.size > 0:
                    try:
                        ranges[col] = float(col_nonnull.max() - col_nonnull.min())
                    except Exception:
                        ranges[col] = 0.0
            if ranges:
                max_range = max(ranges.values())
                min_range = min([v for v in ranges.values() if v > 0] or [1.0])
                if min_range > 0 and (max_range / min_range) > 100:
                    suggestions.append(
                        {
                            "step": "normalize_data",
                            "priority": "medium",
                            "description": "Numerical features have very different scales",
                            "recommended_strategy": "standard or minmax scaling",
                        }
                    )

        # Check for categorical encoding needs
        categorical_cols = df.select_dtypes(include=["object", "category"]).columns
        if len(categorical_cols) > 0:
            suggestions.append(
                {
                    "step": "encode_categorical",
                    "priority": "medium",
                    "description": f"Encode {len(categorical_cols)} categorical columns for ML compatibility",
                    "recommended_strategy": "label encoding for ordinal, one-hot for nominal",
                }
            )

        # Check for outliers
        for col in numerical_cols:
            col_nonnull = df[col].dropna()
            if col_nonnull.size > 0:
                Q1 = col_nonnull.quantile(0.25)
                Q3 = col_nonnull.quantile(0.75)
                IQR = Q3 - Q1
                if IQR != 0:
                    outliers = int(col_nonnull[(col_nonnull < Q1 - 1.5 * IQR) | (col_nonnull > Q3 + 1.5 * IQR)].count())
                else:
                    outliers = 0
                if outliers > n * 0.05:
                    suggestions.append(
                        {
                            "step": "remove_outliers",
                            "priority": "low",
                            "description": f"Column {col} has {outliers} potential outliers",
                            "recommended_strategy": "IQR method or Z-score",
                        }
                    )
                    break

        return suggestions
