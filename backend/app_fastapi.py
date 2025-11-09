# app_fastapi.py
from fastapi import FastAPI, UploadFile, File, Request, HTTPException, BackgroundTasks, Query
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.status import HTTP_400_BAD_REQUEST, HTTP_404_NOT_FOUND, HTTP_413_REQUEST_ENTITY_TOO_LARGE, HTTP_500_INTERNAL_SERVER_ERROR
import pandas as pd
import numpy as np
import io
import json
import uuid
import os
import threading
import time
from datetime import datetime
from functools import wraps
import logging
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from sklearn.impute import KNNImputer
import warnings
warnings.filterwarnings('ignore')

from utils.response_helper import standardize_response  # FastAPI version returning JSONResponse

# Configure logging
logging.basicConfig(
    level=logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
log = logging.getLogger('uvicorn.access')
log.setLevel(logging.ERROR)

app = FastAPI(title="Data Preprocessing API")

# CORS
origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Config (same default as before)
MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max file size

# Thread-safe storage
datasets = {}
processing_status = {}
dataset_lock = threading.Lock()

# Helper functions
def safe_convert_to_json(obj):
    """Safely convert numpy/pandas objects to JSON serializable format"""
    if isinstance(obj, (np.integer, np.floating)):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, pd.Series):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {k: safe_convert_to_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [safe_convert_to_json(item) for item in obj]
    else:
        return obj

class ProcessingStatus:
    def __init__(self):
        self.status = "idle"  # idle, processing, completed, error
        self.progress = 0
        self.message = ""
        self.result = None
        self.error = None
        self.start_time = None
        self.end_time = None

class EnhancedDataPreprocessor:
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

        if (force_refresh or
            self.cached_random_sample is None or
            self.random_sample_timestamp is None or
            (current_time - self.random_sample_timestamp).seconds > 30):

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
        with dataset_lock:
            self.processing_status.status = status
            if progress is not None:
                self.processing_status.progress = progress
            self.processing_status.message = message
            processing_status[self.dataset_id] = {
                "status": status,
                "progress": progress if progress is not None else self.processing_status.progress,
                "message": message
            }

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

    def handle_missing_values(self, strategy='mean', columns=None):
        """Handle missing values with progress tracking"""
        self.update_status("processing", 0, "Starting missing value imputation...")

        columns = self.validate_columns(columns)
        results = {}
        total_columns = len(columns)

        for i, col in enumerate(columns):
            progress = int((i / total_columns) * 100) if total_columns else 100
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
                        imputer = KNNImputer(n_neighbors=min(5, max(1, len(self.df) - 1)))
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
                    'fill_value': safe_convert_to_json(fill_value) if fill_value is not None else None
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

        operation_log = {
            'operation': 'handle_missing_values',
            'strategy': strategy,
            'columns': columns,
            'results': results,
            'timestamp': datetime.now().isoformat()
        }
        self.operations_log.append(operation_log)

        return results

    def normalize_data(self, method='standard', columns=None):
        """Normalize numerical columns with progress tracking"""
        self.update_status("processing", 0, "Starting data normalization...")

        if columns is None:
            columns = self.df.select_dtypes(include=[np.number]).columns.tolist()
        else:
            columns = self.validate_columns(columns, 'numeric')

        results = {}
        total_columns = len(columns)

        for i, col in enumerate(columns):
            progress = int((i / total_columns) * 100) if total_columns else 100
            self.update_status("processing", progress, f"Normalizing column: {col}")

            try:
                original_stats = {
                    'mean': safe_convert_to_json(self.df[col].mean()),
                    'std': safe_convert_to_json(self.df[col].std()),
                    'min': safe_convert_to_json(self.df[col].min()),
                    'max': safe_convert_to_json(self.df[col].max())
                }

                if method == 'standard':
                    scaler = StandardScaler()
                    self.df[col] = scaler.fit_transform(self.df[[col]]).flatten()
                elif method == 'minmax':
                    scaler = MinMaxScaler()
                    self.df[col] = scaler.fit_transform(self.df[[col]]).flatten()
                elif method == 'robust':
                    median = self.df[col].median()
                    q75 = self.df[col].quantile(0.75)
                    q25 = self.df[col].quantile(0.25)
                    iqr = q75 - q25
                    if iqr != 0:
                        self.df[col] = (self.df[col] - median) / iqr

                new_stats = {
                    'mean': safe_convert_to_json(self.df[col].mean()),
                    'std': safe_convert_to_json(self.df[col].std()),
                    'min': safe_convert_to_json(self.df[col].min()),
                    'max': safe_convert_to_json(self.df[col].max())
                }

                results[col] = {
                    'status': 'success',
                    'method': method,
                    'original_stats': original_stats,
                    'new_stats': new_stats
                }

            except Exception as e:
                logger.error(f"Error normalizing column {col}: {str(e)}")
                results[col] = {
                    'status': 'error',
                    'error': str(e)
                }

        self.cached_random_sample = None
        self.random_sample_timestamp = None

        self.update_status("completed", 100, "Data normalization completed")

        operation_log = {
            'operation': 'normalize_data',
            'method': method,
            'columns': columns,
            'results': results,
            'timestamp': datetime.now().isoformat()
        }
        self.operations_log.append(operation_log)

        return results

    def encode_categorical(self, method='label', columns=None):
        """Encode categorical variables with progress tracking"""
        self.update_status("processing", 0, "Starting categorical encoding...")

        if columns is None:
            columns = self.df.select_dtypes(include=['object', 'category']).columns.tolist()
        else:
            columns = self.validate_columns(columns, 'categorical')

        results = {}
        total_columns = len(columns)

        for i, col in enumerate(columns):
            progress = int((i / total_columns) * 100) if total_columns else 100
            self.update_status("processing", progress, f"Encoding column: {col}")

            try:
                unique_values = self.df[col].nunique()

                if method == 'label':
                    le = LabelEncoder()
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
                    if unique_values <= 20:
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
                logger.error(f"Error encoding column {col}: {str(e)}")
                results[col] = {
                    'status': 'error',
                    'error': str(e)
                }

        self.cached_random_sample = None
        self.random_sample_timestamp = None

        self.update_status("completed", 100, "Categorical encoding completed")

        operation_log = {
            'operation': 'encode_categorical',
            'method': method,
            'columns': columns,
            'results': results,
            'timestamp': datetime.now().isoformat()
        }
        self.operations_log.append(operation_log)

        return results

    def remove_outliers(self, method='iqr', columns=None, threshold=1.5):
        """Remove outliers with progress tracking"""
        self.update_status("processing", 0, "Starting outlier removal...")

        if columns is None:
            columns = self.df.select_dtypes(include=[np.number]).columns.tolist()
        else:
            columns = self.validate_columns(columns, 'numeric')

        results = {}
        initial_rows = len(self.df)
        total_columns = len(columns)

        for i, col in enumerate(columns):
            progress = int((i / total_columns) * 100) if total_columns else 100
            self.update_status("processing", progress, f"Processing column: {col}")

            try:
                if method == 'iqr':
                    Q1 = self.df[col].quantile(0.25)
                    Q3 = self.df[col].quantile(0.75)
                    IQR = Q3 - Q1
                    lower_bound = Q1 - threshold * IQR
                    upper_bound = Q3 + threshold * IQR

                    outliers_mask = (self.df[col] < lower_bound) | (self.df[col] > upper_bound)
                    outliers_count = int(outliers_mask.sum())

                    self.df = self.df[~outliers_mask]

                elif method == 'zscore':
                    z_scores = np.abs((self.df[col] - self.df[col].mean()) / self.df[col].std())
                    outliers_mask = z_scores > threshold
                    outliers_count = int(outliers_mask.sum())

                    self.df = self.df[~outliers_mask]

                results[col] = {
                    'status': 'success',
                    'method': method,
                    'outliers_removed': int(outliers_count),
                    'threshold': threshold
                }

            except Exception as e:
                logger.error(f"Error removing outliers from column {col}: {str(e)}")
                results[col] = {
                    'status': 'error',
                    'error': str(e)
                }

        final_rows = len(self.df)
        total_removed = initial_rows - final_rows

        self.cached_random_sample = None
        self.random_sample_timestamp = None

        self.update_status("completed", 100, f"Outlier removal completed. Removed {total_removed} rows")

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

    def remove_duplicates(self):
        """Remove duplicate rows with progress tracking"""
        self.update_status("processing", 50, "Removing duplicate rows...")

        initial_rows = len(self.df)
        self.df.drop_duplicates(inplace=True)
        final_rows = len(self.df)
        removed_count = initial_rows - final_rows

        self.cached_random_sample = None
        self.random_sample_timestamp = None

        result = {
            'initial_rows': initial_rows,
            'final_rows': final_rows,
            'removed_count': removed_count
        }

        self.update_status("completed", 100, f"Removed {removed_count} duplicate rows")

        operation_log = {
            'operation': 'remove_duplicates',
            'result': result,
            'timestamp': datetime.now().isoformat()
        }
        self.operations_log.append(operation_log)

        return result

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

            numerical_cols = self.df.select_dtypes(include=[np.number]).columns
            if len(numerical_cols) > 0:
                numerical_stats = {}
                for col in numerical_cols:
                    if self.df[col].notna().sum() > 0:
                        numerical_stats[col] = {
                            'count': int(self.df[col].count()),
                            'mean': safe_convert_to_json(self.df[col].mean()),
                            'std': safe_convert_to_json(self.df[col].std()),
                            'min': safe_convert_to_json(self.df[col].min()),
                            '25%': safe_convert_to_json(self.df[col].quantile(0.25)),
                            '50%': safe_convert_to_json(self.df[col].quantile(0.50)),
                            '75%': safe_convert_to_json(self.df[col].quantile(0.75)),
                            'max': safe_convert_to_json(self.df[col].max())
                        }
                summary['numerical_stats'] = numerical_stats

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

# ----- Utility / validation -----
def validate_dataset_exists(dataset_id: str):
    if dataset_id not in datasets:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail=f"Dataset {dataset_id} not found")
    return datasets[dataset_id]

# ----- Background runner helper (thread-based) -----
def run_async_operation(func, dataset_id, *args, **kwargs):
    def worker():
        try:
            preprocessor = datasets[dataset_id]
            result = func(preprocessor, *args, **kwargs)
            preprocessor.processing_status.result = result
            preprocessor.processing_status.end_time = datetime.now()
        except Exception as e:
            logger.error(f"Async operation error: {str(e)}")
            preprocessor = datasets.get(dataset_id)
            if preprocessor:
                preprocessor.update_status("error", message=str(e))
                preprocessor.processing_status.error = str(e)

    thread = threading.Thread(target=worker)
    thread.daemon = True
    thread.start()

# -------------------------
# Routes (FastAPI endpoints)
# -------------------------

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return standardize_response(True, {
        'status': 'healthy',
        'active_datasets': len(datasets),
        'timestamp': datetime.now().isoformat()
    }, "Service is healthy")

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload and parse CSV/Excel file"""
    if not file.filename:
        return standardize_response(False, error='No file selected', status_code=HTTP_400_BAD_REQUEST)

    if not file.filename.lower().endswith(('.csv', '.xlsx', '.xls')):
        return standardize_response(False, error='Invalid file format. Please upload CSV, XLSX, or XLS files.', status_code=HTTP_400_BAD_REQUEST)

    dataset_id = str(uuid.uuid4())

    try:
        content = await file.read()
        if len(content) > MAX_CONTENT_LENGTH:
            raise HTTPException(status_code=HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large")

        if file.filename.lower().endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))

        if df.empty:
            return standardize_response(False, error='File is empty', status_code=HTTP_400_BAD_REQUEST)

        if len(df) > 100000:
            return standardize_response(False, error='File too large. Maximum 100,000 rows allowed.', status_code=HTTP_400_BAD_REQUEST)

        with dataset_lock:
            preprocessor = EnhancedDataPreprocessor(df, dataset_id)
            datasets[dataset_id] = preprocessor
            processing_status[dataset_id] = {
                "status": "idle",
                "progress": 0,
                "message": "Dataset loaded successfully"
            }

        summary = preprocessor.get_comprehensive_summary()
        sample_data = df.head(10).fillna('null').to_dict('records')

        logger.info(f"Dataset {dataset_id} uploaded successfully: {file.filename}")

        return standardize_response(True, {
            'dataset_id': dataset_id,
            'filename': file.filename,
            'summary': summary,
            'sample_data': sample_data
        }, f'File "{file.filename}" uploaded successfully')

    except HTTPException as he:
        if he.status_code == HTTP_413_REQUEST_ENTITY_TOO_LARGE:
            return standardize_response(False, error='File too large. Maximum size is 50MB.', status_code=413)
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        return standardize_response(False, error=f'Error reading file: {str(e)}', status_code=HTTP_400_BAD_REQUEST)

@app.get("/api/dataset/{dataset_id}/status")
async def get_processing_status(dataset_id: str):
    """Get current processing status"""
    with dataset_lock:
        status = processing_status.get(dataset_id, {
            "status": "not_found",
            "progress": 0,
            "message": "Dataset not found"
        })

    return standardize_response(True, status, "Status retrieved successfully")

@app.get("/api/dataset/{dataset_id}/summary")
async def get_dataset_summary(dataset_id: str):
    preprocessor = validate_dataset_exists(dataset_id)
    summary = preprocessor.get_comprehensive_summary()
    return standardize_response(True, summary, "Summary retrieved successfully")

@app.get("/api/dataset/{dataset_id}/preview")
async def get_dataset_preview(dataset_id: str,
                             page: int = Query(1, ge=1),
                             per_page: int = Query(10, ge=1, le=50),
                             type: str = Query("head"),
                             refresh: bool = Query(False)):
    """Get dataset preview with pagination"""
    preprocessor = validate_dataset_exists(dataset_id)
    df = preprocessor.df

    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page

    view_type = type.lower()
    if view_type == 'tail':
        sample_df = df.tail(per_page)
    elif view_type in ['random', 'randomsample']:
        sample_df = preprocessor.get_random_sample(n=per_page, force_refresh=refresh)
        logger.info(f"Returning cached random sample for dataset {dataset_id}")
    else:
        sample_df = df.iloc[start_idx:end_idx]

    data = sample_df.fillna('null').to_dict('records')

    return standardize_response(True, {
        'data': data,
        'total_rows': len(df),
        'page': page,
        'per_page': per_page,
        'total_pages': (len(df) + per_page - 1) // per_page,
        'view_type': view_type,
        'sample_size': len(data)
    }, "Preview data retrieved successfully")

@app.post("/api/dataset/{dataset_id}/refresh-random")
async def refresh_random_sample(dataset_id: str):
    preprocessor = validate_dataset_exists(dataset_id)
    sample_df = preprocessor.get_random_sample(n=5, force_refresh=True)
    data = sample_df.fillna('null').to_dict('records')
    return standardize_response(True, {
        'data': data,
        'sample_size': len(data),
        'refreshed': True
    }, "Random sample refreshed successfully")

@app.post("/api/dataset/{dataset_id}/missing-values")
async def handle_missing_values(dataset_id: str, request: Request, background_tasks: BackgroundTasks):
    preprocessor = validate_dataset_exists(dataset_id)
    body = await request.json()
    strategy = body.get('strategy', 'mean')
    columns = body.get('columns', None)
    async_processing = bool(body.get('async', False))

    valid_strategies = ['mean', 'median', 'mode', 'constant', 'knn']
    if strategy not in valid_strategies:
        return standardize_response(False, error=f'Invalid strategy. Must be one of: {valid_strategies}', status_code=HTTP_400_BAD_REQUEST)

    if async_processing:
        # spawn background thread
        run_async_operation(lambda p: p.handle_missing_values(strategy, columns), dataset_id)
        return standardize_response(True, {
            'processing': True,
            'message': 'Processing started. Check status endpoint for progress.'
        }, 'Missing value handling started')
    else:
        results = preprocessor.handle_missing_values(strategy, columns)
        summary = preprocessor.get_comprehensive_summary()
        return standardize_response(True, {
            'results': results,
            'summary': summary
        }, f'Missing values handled using {strategy} strategy')

@app.post("/api/dataset/{dataset_id}/normalize")
async def normalize_data(dataset_id: str, request: Request):
    preprocessor = validate_dataset_exists(dataset_id)
    body = await request.json()
    method = body.get('method', 'standard')
    columns = body.get('columns', None)
    async_processing = bool(body.get('async', False))

    valid_methods = ['standard', 'minmax', 'robust']
    if method not in valid_methods:
        return standardize_response(False, error=f'Invalid method. Must be one of: {valid_methods}', status_code=HTTP_400_BAD_REQUEST)

    if async_processing:
        run_async_operation(lambda p: p.normalize_data(method, columns), dataset_id)
        return standardize_response(True, {
            'processing': True,
            'message': 'Processing started. Check status endpoint for progress.'
        }, 'Data normalization started')
    else:
        results = preprocessor.normalize_data(method, columns)
        summary = preprocessor.get_comprehensive_summary()
        return standardize_response(True, {
            'results': results,
            'summary': summary
        }, f'Data normalized using {method} method')

@app.post("/api/dataset/{dataset_id}/encode")
async def encode_categorical(dataset_id: str, request: Request):
    preprocessor = validate_dataset_exists(dataset_id)
    body = await request.json()
    method = body.get('method', 'label')
    columns = body.get('columns', None)
    async_processing = bool(body.get('async', False))

    valid_methods = ['label', 'onehot']
    if method not in valid_methods:
        return standardize_response(False, error=f'Invalid method. Must be one of: {valid_methods}', status_code=HTTP_400_BAD_REQUEST)

    if async_processing:
        run_async_operation(lambda p: p.encode_categorical(method, columns), dataset_id)
        return standardize_response(True, {
            'processing': True,
            'message': 'Processing started. Check status endpoint for progress.'
        }, 'Categorical encoding started')
    else:
        results = preprocessor.encode_categorical(method, columns)
        summary = preprocessor.get_comprehensive_summary()
        return standardize_response(True, {
            'results': results,
            'summary': summary
        }, f'Categorical variables encoded using {method} encoding')

@app.post("/api/dataset/{dataset_id}/outliers")
async def remove_outliers(dataset_id: str, request: Request):
    preprocessor = validate_dataset_exists(dataset_id)
    body = await request.json()
    method = body.get('method', 'iqr')
    columns = body.get('columns', None)
    threshold = float(body.get('threshold', 1.5))
    async_processing = bool(body.get('async', False))

    valid_methods = ['iqr', 'zscore']
    if method not in valid_methods:
        return standardize_response(False, error=f'Invalid method. Must be one of: {valid_methods}', status_code=HTTP_400_BAD_REQUEST)
    if threshold <= 0:
        return standardize_response(False, error='Threshold must be positive', status_code=HTTP_400_BAD_REQUEST)

    if async_processing:
        run_async_operation(lambda p: p.remove_outliers(method, columns, threshold), dataset_id)
        return standardize_response(True, {
            'processing': True,
            'message': 'Processing started. Check status endpoint for progress.'
        }, 'Outlier removal started')
    else:
        results = preprocessor.remove_outliers(method, columns, threshold)
        summary = preprocessor.get_comprehensive_summary()
        return standardize_response(True, {
            'results': results,
            'summary': summary
        }, f'Outliers removed using {method} method')

@app.delete("/api/dataset/{dataset_id}/duplicates")
async def remove_duplicates(dataset_id: str):
    preprocessor = validate_dataset_exists(dataset_id)
    results = preprocessor.remove_duplicates()
    summary = preprocessor.get_comprehensive_summary()
    return standardize_response(True, {
        'results': results,
        'summary': summary
    }, f'Removed {results["removed_count"]} duplicate rows')

@app.get("/api/dataset/{dataset_id}/correlation")
async def get_correlation_analysis(dataset_id: str):
    preprocessor = validate_dataset_exists(dataset_id)
    df = preprocessor.df
    numerical_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    if len(numerical_cols) < 2:
        return standardize_response(True, {
            'numericalColumns': numerical_cols,
            'correlationMatrix': [],
            'strongCorrelations': [],
            'insights': ['Not enough numerical columns for correlation analysis. Need at least 2 numerical columns.']
        }, 'Insufficient numerical columns for correlation analysis')

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

            row.append({
                'value': safe_convert_to_json(corr_value),
                'strength': strength,
                'col1': col1,
                'col2': col2
            })
        correlation_matrix.append(row)

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

    insights = []
    if len(strong_correlations) == 0:
        insights.append("No strong correlations found between variables.")
    else:
        insights.append(f"Found {len(strong_correlations)} strong correlation(s).")
        for corr in strong_correlations[:3]:
            insights.append(
                f"{corr['col1']} and {corr['col2']} have a {corr['strength']} {corr['direction']} correlation ({corr['correlation']:.3f})."
            )

    return standardize_response(True, {
        'numericalColumns': numerical_cols,
        'correlationMatrix': correlation_matrix,
        'strongCorrelations': strong_correlations,
        'insights': insights
    }, 'Correlation analysis completed successfully')

@app.get("/api/dataset/{dataset_id}/export")
async def export_dataset(dataset_id: str):
    preprocessor = validate_dataset_exists(dataset_id)
    df = preprocessor.df

    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)

    csv_bytes = io.BytesIO()
    csv_bytes.write(output.getvalue().encode('utf-8'))
    csv_bytes.seek(0)

    headers = {"Content-Disposition": f'attachment; filename="processed_data_{dataset_id[:8]}.csv"'}
    return StreamingResponse(csv_bytes, media_type="text/csv", headers=headers)

@app.post("/api/dataset/{dataset_id}/reset")
async def reset_dataset(dataset_id: str):
    preprocessor = validate_dataset_exists(dataset_id)
    with dataset_lock:
        preprocessor.df = preprocessor.original_df.copy()
        preprocessor.operations_log = []
        preprocessor.cached_random_sample = None
        preprocessor.random_sample_timestamp = None
        preprocessor.update_status("idle", 0, "Dataset reset to original state")

    summary = preprocessor.get_comprehensive_summary()
    return standardize_response(True, {'summary': summary}, 'Dataset reset to original state')

@app.get("/api/dataset/{dataset_id}/history")
async def get_processing_history(dataset_id: str):
    preprocessor = validate_dataset_exists(dataset_id)
    return standardize_response(True, {
        'operations': preprocessor.operations_log,
        'total_operations': len(preprocessor.operations_log)
    }, 'Processing history retrieved successfully')

# ----- Exception handlers -----
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # Map 413 to friendly message
    if exc.status_code == HTTP_413_REQUEST_ENTITY_TOO_LARGE:
        return standardize_response(False, error='File too large. Maximum size is 50MB.', status_code=413)
    return standardize_response(False, error=exc.detail if exc.detail else 'HTTP Error', status_code=exc.status_code)

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Internal server error: {str(exc)}")
    return standardize_response(False, error='Internal server error', status_code=HTTP_500_INTERNAL_SERVER_ERROR)

# Run with: uvicorn app_fastapi:app --host 0.0.0.0 --port 5000
if __name__ == "__main__":
    import uvicorn
    print("Starting Data Preprocessing API Server...")
    print("Server running on http://localhost:5000")
    print("Health check: http://localhost:5000/api/health")
    print("Random sample caching enabled - samples refresh every 30 seconds")
    uvicorn.run("app_fastapi:app", host="0.0.0.0", port=5000, log_level="warning")
