# utils/data_validator.py
import pandas as pd
import numpy as np
from pandas.api import types as pd_types
from typing import Tuple, List, Optional


class DataValidator:
    @staticmethod
    def validate_csv_file(file) -> Tuple[List[str], List[str], Optional[pd.DataFrame]]:
        """Validate uploaded CSV file"""
        errors = []
        warnings = []

        try:
            # Try to read the file
            df = pd.read_csv(file)

            # Check if file is empty
            if df.empty:
                errors.append("File is empty")
                return errors, warnings, None

            # Check file size constraints
            if len(df) > 100000:
                warnings.append(f"Large dataset ({len(df)} rows). Processing may take longer.")

            if len(df.columns) > 1000:
                warnings.append(f"Many columns ({len(df.columns)}). Consider feature selection.")

            # Check for completely empty columns
            empty_cols = df.columns[df.isnull().all()].tolist()
            if empty_cols:
                warnings.append(f"Completely empty columns found: {empty_cols}")

            # Check for high missing value percentage
            missing_pct = (df.isnull().sum() / len(df)) * 100 if len(df) > 0 else pd.Series()
            high_missing_cols = missing_pct[missing_pct > 80].index.tolist()
            if high_missing_cols:
                warnings.append(f"Columns with >80% missing values: {high_missing_cols}")

            # Check for duplicate column names
            if df.columns.duplicated().any():
                errors.append("Duplicate column names found")

            # Check for invalid column names
            invalid_cols = [col for col in df.columns if not isinstance(col, str) or col.strip() == ""]
            if invalid_cols:
                errors.append(f"Invalid column names: {invalid_cols}")

            return errors, warnings, df

        except pd.errors.EmptyDataError:
            errors.append("File is empty or has no data")
        except pd.errors.ParserError as e:
            errors.append(f"Error parsing CSV: {str(e)}")
        except Exception as e:
            errors.append(f"Unexpected error: {str(e)}")

        return errors, warnings, None

    @staticmethod
    def validate_preprocessing_params(operation: str, params: dict, df: pd.DataFrame) -> List[str]:
        """Validate preprocessing parameters"""
        errors = []

        if operation == "missing_values":
            strategy = params.get("strategy", "mean")
            columns = params.get("columns", [])

            if strategy not in ["mean", "median", "mode", "constant", "knn", "forward_fill", "backward_fill"]:
                errors.append(f"Invalid strategy: {strategy}")

            if columns:
                invalid_cols = [col for col in columns if col not in df.columns]
                if invalid_cols:
                    errors.append(f"Invalid columns: {invalid_cols}")

        elif operation == "normalize":
            method = params.get("method", "standard")
            columns = params.get("columns", [])

            if method not in ["standard", "minmax", "robust", "zscore"]:
                errors.append(f"Invalid normalization method: {method}")

            if columns:
                non_numeric = [
                    col
                    for col in columns
                    if col in df.columns and not pd_types.is_numeric_dtype(df[col])
                ]
                if non_numeric:
                    errors.append(f"Non-numeric columns cannot be normalized: {non_numeric}")

        elif operation == "encode":
            method = params.get("method", "label")
            columns = params.get("columns", [])

            if method not in ["label", "onehot", "binary"]:
                errors.append(f"Invalid encoding method: {method}")

            if columns:
                non_categorical = [
                    col
                    for col in columns
                    if col in df.columns and not (pd_types.is_object_dtype(df[col]) or pd_types.is_categorical_dtype(df[col]))
                ]
                if non_categorical:
                    errors.append(f"Non-categorical columns cannot be encoded: {non_categorical}")

        return errors
