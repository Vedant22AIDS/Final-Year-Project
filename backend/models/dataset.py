import pandas as pd
import numpy as np
import uuid
import threading
from datetime import datetime
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from sklearn.impute import SimpleImputer, KNNImputer
import logging

logger = logging.getLogger(__name__)

class ProcessingStatus:
    """Processing status tracker"""
    
    def __init__(self):
        self.status = "idle"  # idle, processing, completed, error
        self.progress = 0
        self.message = ""
        self.result = None
        self.error = None
        self.start_time = None
        self.end_time = None

class DataPreprocessor:
    """Enhanced data preprocessor with caching and status tracking"""
    
    def __init__(self, df, dataset_id):
        self.df = df.copy()
        self.original_df = df.copy()
        self.dataset_id = dataset_id
        self.operations_log = []
        self.processing_status = ProcessingStatus()
        # Cache for random samples
        self.cached_random_sample = None
        self.random_sample_timestamp = None
        
    def get_random_sample(self, n=5, force_refresh=False):
        """Get cached random sample or generate new one"""
        current_time = datetime.now()
        
        # Check if we need to refresh the cache
        if (force_refresh or 
            self.cached_random_sample is None or 
            self.random_sample_timestamp is None or
            (current_time - self.random_sample_timestamp).seconds > 30):
            
            # Generate new random sample
            sample_size = min(n, len(self.df))
            if sample_size > 0:
                random_seed = int(current_time.timestamp() * 1000000) % 2**32
                self.cached_random_sample = self.df.sample(n=sample_size, random_state=random_seed)
                self.random_sample_timestamp = current_time
                logger.info(f"Generated new random sample for dataset {self.dataset_id}")
            else:
                self.cached_random_sample = self.df.head(0)
        
        return self.cached_random_sample
        
    def update_status(self, status, progress=None, message=""):
        """Update processing status"""
        self.processing_status.status = status
        if progress is not None:
            self.processing_status.progress = progress
        self.processing_status.message = message
    
    def validate_columns(self, columns, required_type=None):
        """Validate column names and types"""
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
    
    def safe_convert_to_json(self, obj):
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
    
    def handle_missing_values(self, strategy='mean', columns=None):
        """Handle missing values with progress tracking"""
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
                logger.error(f"Error processing column {col}: {str(e)}")
                results[col] = {
                    'status': 'error',
                    'error': str(e)
                }
        
        # Clear random sample cache when data changes
        self.cached_random_sample = None
        self.random_sample_timestamp = None
        
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
    
    def get_comprehensive_summary(self):
        """Get comprehensive data summary"""
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
            logger.error(f"Error generating summary: {str(e)}")
            raise

class DatasetStorage:
    """Thread-safe dataset storage"""
    
    def __init__(self):
        self.datasets = {}
        self.processing_status = {}
        self.lock = threading.Lock()
    
    def store_dataset(self, dataset_id, df):
        """Store a new dataset"""
        with self.lock:
            preprocessor = DataPreprocessor(df, dataset_id)
            self.datasets[dataset_id] = preprocessor
            self.processing_status[dataset_id] = {
                "status": "idle",
                "progress": 0,
                "message": "Dataset loaded successfully"
            }
            return preprocessor
    
    def get_dataset(self, dataset_id):
        """Get dataset by ID"""
        if dataset_id not in self.datasets:
            raise FileNotFoundError(f"Dataset {dataset_id} not found")
        return self.datasets[dataset_id]
    
    def get_processing_status(self, dataset_id):
        """Get processing status for dataset"""
        with self.lock:
            return self.processing_status.get(dataset_id, {
                "status": "not_found",
                "progress": 0,
                "message": "Dataset not found"
            })
    
    def update_processing_status(self, dataset_id, status, progress=None, message=""):
        """Update processing status"""
        with self.lock:
            if dataset_id not in self.processing_status:
                self.processing_status[dataset_id] = {}
            
            self.processing_status[dataset_id].update({
                "status": status,
                "progress": progress or self.processing_status[dataset_id].get("progress", 0),
                "message": message
            })
    
    def delete_dataset(self, dataset_id):
        """Delete dataset"""
        with self.lock:
            if dataset_id in self.datasets:
                del self.datasets[dataset_id]
            if dataset_id in self.processing_status:
                del self.processing_status[dataset_id]
                return True
            return False
    
    def get_dataset_count(self):
        """Get total number of datasets"""
        return len(self.datasets)

# Global dataset storage instance
dataset_storage = DatasetStorage()
