import pandas as pd
import numpy as np
import io
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple, Union
import threading
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder, RobustScaler, MaxAbsScaler
from sklearn.impute import SimpleImputer, KNNImputer

class ProcessingStatus:
    def __init__(self):
        self.status = "idle"  # idle, processing, completed, error
        self.progress = 0
        self.message = ""
        self.result = None
        self.error = None
        self.start_time = None
        self.end_time = None

class Dataset:
    """Dataset model with data processing functionality"""
    
    def __init__(self, dataset_id: str, df: pd.DataFrame, filename: str):
        self.dataset_id = dataset_id
        self.df = df.copy()
        self.original_df = df.copy()
        self.filename = filename
        self.operations_log = []
        self.processing_status = ProcessingStatus()
        self.lock = threading.RLock()  # Reentrant lock for thread safety
        self.last_access = datetime.now()
    
    def update_access_time(self):
        """Update the last access time"""
        self.last_access = datetime.now()
    
    def update_status(self, status: str, progress: Optional[int] = None, message: str = ""):
        """Update processing status"""
        with self.lock:
            self.processing_status.status = status
            if progress is not None:
                self.processing_status.progress = progress
            self.processing_status.message = message
    
    def validate_columns(self, columns: Optional[List[str]] = None, required_type: Optional[str] = None) -> List[str]:
        """Validate column names and types"""
        with self.lock:
            if columns is None:
                return list(self.df.columns)
            
            invalid_columns = [col for col in columns if col not in self.df.columns]
            if invalid_columns:
                raise ValueError(f"Invalid columns: {invalid_columns}")
            
            if required_type:
                if required_type == 'numeric':
                    invalid_types = [col for col in columns 
                                   if not pd.api.types.is_numeric_dtype(self.df[col])]
                elif required_type == 'categorical':
                    invalid_types = [col for col in columns 
                                   if pd.api.types.is_numeric_dtype(self.df[col])]
                else:
                    invalid_types = []
                    
                if invalid_types:
                    raise ValueError(f"Columns {invalid_types} are not {required_type}")
            
            return columns
    
    def safe_convert_to_json(self, obj: Any) -> Any:
        """Safely convert numpy/pandas objects to JSON serializable format"""
        if isinstance(obj, (np.integer, np.floating)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, pd.Series):
            return obj.tolist()
        elif isinstance(obj, dict):
            return {k: self.safe_convert_to_json(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self.safe_convert_to_json(item) for item in obj]
        else:
            return obj
    
    def get_comprehensive_summary(self) -> Dict[str, Any]:
        """Get comprehensive data summary"""
        with self.lock:
            try:
                summary = {
                    'shape': self.df.shape,
                    'columns': self.df.columns.tolist(),
                    'dtypes': {col: str(dtype) for col, dtype in self.df.dtypes.items()},
                    'missing_values': {col: int(count) for col, count in self.df.isnull().sum().items()},
                    'memory_usage': f"{self.df.memory_usage(deep=True).sum() / 1024:.2f} KB",
                    'duplicate_rows': int(self.df.duplicated().sum())
                }
                
                # Numerical columns statistics
                numerical_cols = self.df.select_dtypes(include=[np.number]).columns
                if len(numerical_cols) > 0:
                    numerical_stats = {}
                    for col in numerical_cols:
                        if self.df[col].notna().sum() > 0:
                            numerical_stats[col] = {
                                'count': int(self.df[col].count()),
                                'mean': self.safe_convert_to_json(self.df[col].mean()),
                                'std': self.safe_convert_to_json(self.df[col].std()),
                                'min': self.safe_convert_to_json(self.df[col].min()),
                                '25%': self.safe_convert_to_json(self.df[col].quantile(0.25)),
                                '50%': self.safe_convert_to_json(self.df[col].quantile(0.50)),
                                '75%': self.safe_convert_to_json(self.df[col].quantile(0.75)),
                                'max': self.safe_convert_to_json(self.df[col].max())
                            }
                    summary['numerical_stats'] = numerical_stats
                
                # Categorical columns statistics
                categorical_cols = self.df.select_dtypes(include=['object', 'category']).columns
                if len(categorical_cols) > 0:
                    categorical_stats = {}
                    for col in categorical_cols:
                        if self.df[col].notna().sum() > 0:
                            value_counts = self.df[col].value_counts().head(10)
                            categorical_stats[col] = {
                                'unique_count': int(self.df[col].nunique()),
                                'top_values': {str(k): int(v) for k, v in value_counts.items()}
                            }
                    summary['categorical_stats'] = categorical_stats
                
                return summary
                
            except Exception as e:
                raise RuntimeError(f"Error generating summary: {str(e)}")
    
    def handle_missing_values(self, strategy: str = 'mean', columns: Optional[List[str]] = None) -> Dict[str, Any]:
        """Handle missing values with progress tracking"""
        with self.lock:
            self.update_status("processing", 0, "Starting missing value imputation...")
            
            columns = self.validate_columns(columns)
            results = {}
            total_columns = len(columns)
            
            for i, col in enumerate(columns):
                progress = int((i / total_columns) * 100)
                self.update_status("processing", progress, f"Processing column: {col}")
                
                missing_count_before = self.df[col].isnull().sum()
                
                if missing_count_before == 0:
                    results[col] = {'status': 'no_missing', 'filled': 0}
                    continue
                
                try:
                    if pd.api.types.is_numeric_dtype(self.df[col]):
                        # Numerical data
                        if strategy == 'mean':
                            fill_value = self.df[col].mean()
                        elif strategy == 'median':
                            fill_value = self.df[col].median()
                        elif strategy == 'mode':
                            mode_series = self.df[col].mode()
                            fill_value = mode_series.iloc[0] if not mode_series.empty else 0
                        elif strategy == 'constant':
                            fill_value = 0
                        elif strategy == 'knn':
                            # KNN imputation
                            imputer = KNNImputer(n_neighbors=min(5, len(self.df) - 1))
                            self.df[col] = imputer.fit_transform(self.df[[col]]).flatten()
                            fill_value = None
                        else:
                            fill_value = self.df[col].mean()
                        
                        if fill_value is not None:
                            self.df[col].fillna(fill_value, inplace=True)
                    else:
                        # Categorical data
                        if strategy == 'mode':
                            mode_series = self.df[col].mode()
                            fill_value = mode_series.iloc[0] if not mode_series.empty else 'Unknown'
                        elif strategy == 'constant':
                            fill_value = 'Unknown'
                        else:
                            # Forward fill for categorical
                            self.df[col].fillna(method='ffill', inplace=True)
                            fill_value = 'Unknown'
                        
                        if fill_value is not None:
                            self.df[col].fillna(fill_value, inplace=True)
                    
                    missing_count_after = self.df[col].isnull().sum()
                    filled_count = missing_count_before - missing_count_after
                    
                    results[col] = {
                        'status': 'filled',
                        'filled': int(filled_count),
                        'strategy': strategy,
                        'fill_value': self.safe_convert_to_json(fill_value) if fill_value is not None else None
                    }
                    
                except Exception as e:
                    results[col] = {
                        'status': 'error',
                        'error': str(e)
                    }
            
            self.update_status("completed", 100, "Missing value imputation completed")
            
            # Log operation
            operation_log = {
                'operation': 'handle_missing_values',
                'strategy': strategy,
                'columns': columns,
                'results': results,
                'timestamp': datetime.now().isoformat()
            }
            self.operations_log.append(operation_log)
            
            return results
    
    def remove_nulls(self, columns: Optional[List[str]] = None) -> Dict[str, Any]:
        """Remove rows with null values in specified columns"""
        with self.lock:
            self.update_status("processing", 0, "Starting null value removal...")
            
            initial_rows = len(self.df)
            
            if columns:
                columns = self.validate_columns(columns)
                # Only remove rows where specified columns have nulls
                self.df = self.df.dropna(subset=columns)
            else:
                # Remove rows with any nulls
                self.df = self.df.dropna()
            
            final_rows = len(self.df)
            removed_count = initial_rows - final_rows
            
            self.update_status("completed", 100, f"Removed {removed_count} rows with null values")
            
            result = {
                'initial_rows': initial_rows,
                'final_rows': final_rows,
                'removed_count': removed_count
            }
            
            # Log operation
            operation_log = {
                'operation': 'remove_nulls',
                'columns': columns,
                'result': result,
                'timestamp': datetime.now().isoformat()
            }
            self.operations_log.append(operation_log)
            
            return result
    
    def normalize_data(self, method: str = 'standard', columns: Optional[List[str]] = None) -> Dict[str, Any]:
        """Normalize numerical columns with progress tracking"""
        with self.lock:
            self.update_status("processing", 0, "Starting data normalization...")
            
            if columns is None:
                columns = self.df.select_dtypes(include=[np.number]).columns.tolist()
            else:
                columns = self.validate_columns(columns, 'numeric')
            
            results = {}
            total_columns = len(columns)
            
            for i, col in enumerate(columns):
                progress = int((i / total_columns) * 100)
                self.update_status("processing", progress, f"Normalizing column: {col}")
                
                try:
                    original_stats = {
                        'mean': self.safe_convert_to_json(self.df[col].mean()),
                        'std': self.safe_convert_to_json(self.df[col].std()),
                        'min': self.safe_convert_to_json(self.df[col].min()),
                        'max': self.safe_convert_to_json(self.df[col].max())
                    }
                    
                    if method == 'standard':
                        scaler = StandardScaler()
                        self.df[col] = scaler.fit_transform(self.df[[col]]).flatten()
                    elif method == 'minmax':
                        scaler = MinMaxScaler()
                        self.df[col] = scaler.fit_transform(self.df[[col]]).flatten()
                    elif method == 'robust':
                        # Robust scaling (median and IQR)
                        median = self.df[col].median()
                        q75 = self.df[col].quantile(0.75)
                        q25 = self.df[col].quantile(0.25)
                        iqr = q75 - q25
                        if iqr != 0:
                            self.df[col] = (self.df[col] - median) / iqr
                    
                    new_stats = {
                        'mean': self.safe_convert_to_json(self.df[col].mean()),
                        'std': self.safe_convert_to_json(self.df[col].std()),
                        'min': self.safe_convert_to_json(self.df[col].min()),
                        'max': self.safe_convert_to_json(self.df[col].max())
                    }
                    
                    results[col] = {
                        'status': 'success',
                        'method': method,
                        'original_stats': original_stats,
                        'new_stats': new_stats
                    }
                    
                except Exception as e:
                    results[col] = {
                        'status': 'error',
                        'error': str(e)
                    }
            
            self.update_status("completed", 100, "Data normalization completed")
            
            # Log operation
            operation_log = {
                'operation': 'normalize_data',
                'method': method,
                'columns': columns,
                'results': results,
                'timestamp': datetime.now().isoformat()
            }
            self.operations_log.append(operation_log)
            
            return results
    
    def scale_data(self, method: str = 'standard', columns: Optional[List[str]] = None) -> Dict[str, Any]:
        """Scale numerical columns"""
        with self.lock:
            self.update_status("processing", 0, "Starting data scaling...")
            
            if columns is None:
                columns = self.df.select_dtypes(include=[np.number]).columns.tolist()
            else:
                columns = self.validate_columns(columns, 'numeric')
            
            results = {}
            total_columns = len(columns)
            
            for i, col in enumerate(columns):
                progress = int((i / total_columns) * 100)
                self.update_status("processing", progress, f"Scaling column: {col}")
                
                try:
                    original_stats = {
                        'mean': self.safe_convert_to_json(self.df[col].mean()),
                        'std': self.safe_convert_to_json(self.df[col].std()),
                        'min': self.safe_convert_to_json(self.df[col].min()),
                        'max': self.safe_convert_to_json(self.df[col].max())
                    }
                    
                    if method == 'standard':
                        scaler = StandardScaler()
                        self.df[col] = scaler.fit_transform(self.df[[col]]).flatten()
                    elif method == 'minmax':
                        scaler = MinMaxScaler()
                        self.df[col] = scaler.fit_transform(self.df[[col]]).flatten()
                    elif method == 'maxabs':
                        scaler = MaxAbsScaler()
                        self.df[col] = scaler.fit_transform(self.df[[col]]).flatten()
                    elif method == 'robust':
                        scaler = RobustScaler()
                        self.df[col] = scaler.fit_transform(self.df[[col]]).flatten()
                    
                    new_stats = {
                        'mean': self.safe_convert_to_json(self.df[col].mean()),
                        'std': self.safe_convert_to_json(self.df[col].std()),
                        'min': self.safe_convert_to_json(self.df[col].min()),
                        'max': self.safe_convert_to_json(self.df[col].max())
                    }
                    
                    results[col] = {
                        'status': 'success',
                        'method': method,
                        'original_stats': original_stats,
                        'new_stats': new_stats
                    }
                    
                except Exception as e:
                    results[col] = {
                        'status': 'error',
                        'error': str(e)
                    }
            
            self.update_status("completed", 100, "Data scaling completed")
            
            # Log operation
            operation_log = {
                'operation': 'scale_data',
                'method': method,
                'columns': columns,
                'results': results,
                'timestamp': datetime.now().isoformat()
            }
            self.operations_log.append(operation_log)
            
            return results
    
    def encode_categorical(self, method: str = 'label', columns: Optional[List[str]] = None) -> Dict[str, Any]:
        """Encode categorical variables with progress tracking"""
        with self.lock:
            self.update_status("processing", 0, "Starting categorical encoding...")
            
            if columns is None:
                columns = self.df.select_dtypes(include=['object', 'category']).columns.tolist()
            else:
                columns = self.validate_columns(columns, 'categorical')
            
            results = {}
            total_columns = len(columns)
            
            for i, col in enumerate(columns):
                progress = int((i / total_columns) * 100)
                self.update_status("processing", progress, f"Encoding column: {col}")
                
                try:
                    unique_values = self.df[col].nunique()
                    
                    if method == 'label':
                        le = LabelEncoder()
                        # Handle NaN values
                        mask = self.df[col].notna()
                        if mask.sum() > 0:
                            self.df.loc[mask, col] = le.fit_transform(self.df.loc[mask, col])
                            results[col] = {
                                'status': 'success',
                                'method': 'label',
                                'unique_values': unique_values,
                                'classes': le.classes_.tolist()
                            }
                        else:
                            results[col] = {
                                'status': 'skipped',
                                'reason': 'all_null'
                            }
                            
                    elif method == 'onehot':
                        # One-hot encoding
                        if unique_values <= 20:  # Reasonable limit for one-hot
                            dummies = pd.get_dummies(self.df[col], prefix=col, dummy_na=True)
                            self.df = pd.concat([self.df.drop(col, axis=1), dummies], axis=1)
                            results[col] = {
                                'status': 'success',
                                'method': 'onehot',
                                'unique_values': unique_values,
                                'new_columns': dummies.columns.tolist()
                            }
                        else:
                            results[col] = {
                                'status': 'skipped',
                                'reason': 'too_many_categories',
                                'unique_values': unique_values,
                                'recommendation': 'Use label encoding or reduce categories'
                            }
                            
                except Exception as e:
                    results[col] = {
                        'status': 'error',
                        'error': str(e)
                    }
            
            self.update_status("completed", 100, "Categorical encoding completed")
            
            # Log operation
            operation_log = {
                'operation': 'encode_categorical',
                'method': method,
                'columns': columns,
                'results': results,
                'timestamp': datetime.now().isoformat()
            }
            self.operations_log.append(operation_log)
            
            return results
    
    def remove_outliers(self, method: str = 'iqr', columns: Optional[List[str]] = None,
                       threshold: float = 1.5) -> Dict[str, Any]:
        """Remove outliers with progress tracking"""
        with self.lock:
            self.update_status("processing", 0, "Starting outlier removal...")
            
            if columns is None:
                columns = self.df.select_dtypes(include=[np.number]).columns.tolist()
            else:
                columns = self.validate_columns(columns, 'numeric')
            
            results = {}
            initial_rows = len(self.df)
            total_columns = len(columns)
            
            for i, col in enumerate(columns):
                progress = int((i / total_columns) * 100)
                self.update_status("processing", progress, f"Processing column: {col}")
                
                try:
                    if method == 'iqr':
                        Q1 = self.df[col].quantile(0.25)
                        Q3 = self.df[col].quantile(0.75)
                        IQR = Q3 - Q1
                        lower_bound = Q1 - threshold * IQR
                        upper_bound = Q3 + threshold * IQR
                        
                        outliers_mask = (self.df[col] < lower_bound) | (self.df[col] > upper_bound)
                        outliers_count = outliers_mask.sum()
                        
                        self.df = self.df[~outliers_mask]
                        
                    elif method == 'zscore':
                        z_scores = np.abs((self.df[col] - self.df[col].mean()) / self.df[col].std())
                        outliers_mask = z_scores > threshold
                        outliers_count = outliers_mask.sum()
                        
                        self.df = self.df[~outliers_mask]
                    
                    results[col] = {
                        'status': 'success',
                        'method': method,
                        'outliers_removed': int(outliers_count),
                        'threshold': threshold
                    }
                    
                except Exception as e:
                    results[col] = {
                        'status': 'error',
                        'error': str(e)
                    }
            
            final_rows = len(self.df)
            total_removed = initial_rows - final_rows
            
            self.update_status("completed", 100, f"Outlier removal completed. Removed {total_removed} rows")
            
            # Log operation
            operation_log = {
                'operation': 'remove_outliers',
                'method': method,
                'columns': columns,
                'threshold': threshold,
                'total_rows_removed': total_removed,
                'results': results,
                'timestamp': datetime.now().isoformat()
            }
            self.operations_log.append(operation_log)
            
            return {'total_removed': total_removed, 'column_results': results}
    
    def remove_duplicates(self) -> Dict[str, Any]:
        """Remove duplicate rows with progress tracking"""
        with self.lock:
            self.update_status("processing", 50, "Removing duplicate rows...")
            
            initial_rows = len(self.df)
            self.df.drop_duplicates(inplace=True)
            final_rows = len(self.df)
            removed_count = initial_rows - final_rows
            
            result = {
                'initial_rows': initial_rows,
                'final_rows': final_rows,
                'removed_count': removed_count
            }
            
            self.update_status("completed", 100, f"Removed {removed_count} duplicate rows")
            
            # Log operation
            operation_log = {
                'operation': 'remove_duplicates',
                'result': result,
                'timestamp': datetime.now().isoformat()
            }
            self.operations_log.append(operation_log)
            
            return result
    
    def get_correlation_analysis(self) -> Dict[str, Any]:
        """Get correlation analysis for numerical columns"""
        with self.lock:
            # Get numerical columns
            numerical_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
            
            if len(numerical_cols) < 2:
                return {
                    'numericalColumns': numerical_cols,
                    'correlationMatrix': [],
                    'strongCorrelations': [],
                    'insights': ['Not enough numerical columns for correlation analysis. Need at least 2 numerical columns.']
                }
            
            # Calculate correlation matrix
            corr_matrix = self.df[numerical_cols].corr()
            
            # Convert to the format expected by frontend
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
                    
                    row.append({
                        'value': self.safe_convert_to_json(corr_value),
                        'strength': strength,
                        'col1': col1,
                        'col2': col2
                    })
                correlation_matrix.append(row)
            
            # Find strong correlations
            strong_correlations = []
            for i in range(len(numerical_cols)):
                for j in range(i + 1, len(numerical_cols)):
                    corr_value = correlation_matrix[i][j]['value']
                    if abs(corr_value) >= 0.5:
                        strong_correlations.append({
                            'col1': numerical_cols[i],
                            'col2': numerical_cols[j],
                            'correlation': corr_value,
                            'strength': correlation_matrix[i][j]['strength'],
                            'direction': 'positive' if corr_value > 0 else 'negative'
                        })
            
            # Generate insights
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
                'numericalColumns': numerical_cols,
                'correlationMatrix': correlation_matrix,
                'strongCorrelations': strong_correlations,
                'insights': insights
            }
    
    def export_to_csv(self) -> Tuple[io.BytesIO, str]:
        """Export processed dataset as CSV"""
        with self.lock:
            # Create CSV in memory
            output = io.StringIO()
            self.df.to_csv(output, index=False)
            output.seek(0)
            
            # Convert to bytes
            csv_data = io.BytesIO()
            csv_data.write(output.getvalue().encode('utf-8'))
            csv_data.seek(0)
            
            filename = f'processed_{self.filename}' if self.filename else f'processed_data_{self.dataset_id[:8]}.csv'
            
            return csv_data, filename
    
    def reset(self) -> None:
        """Reset dataset to original state"""
        with self.lock:
            self.df = self.original_df.copy()
            self.operations_log = []
            self.update_status("idle", 0, "Dataset reset to original state")
