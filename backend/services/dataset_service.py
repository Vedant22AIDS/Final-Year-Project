import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from sklearn.impute import SimpleImputer, KNNImputer
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

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

class DataService:
    @staticmethod
    def get_random_sample(df, n=5):
        """Get random sample without replacement"""
        sample_size = min(n, len(df))
        return df.sample(n=sample_size, random_state=None)  # Use None for true randomness
    
    @staticmethod
    def validate_columns(df, columns, required_type=None):
        """Validate column names and types"""
        if columns is None:
            return list(df.columns)
        
        invalid_columns = [col for col in columns if col not in df.columns]
        if invalid_columns:
            raise ValueError(f"Invalid columns: {invalid_columns}")
        
        if required_type:
            if required_type == 'numeric':
                invalid_types = [col for col in columns 
                               if not pd.api.types.is_numeric_dtype(df[col])]
            elif required_type == 'categorical':
                invalid_types = [col for col in columns 
                               if pd.api.types.is_numeric_dtype(df[col])]
            else:
                invalid_types = []
                
            if invalid_types:
                raise ValueError(f"Columns {invalid_types} are not {required_type}")
        
        return columns
    
    @staticmethod
    def get_column_analysis(df):
        """Get detailed column analysis"""
        analysis = {
            'numerical_columns': [],
            'categorical_columns': [],
            'missing_value_analysis': {},
            'data_types': {}
        }
        
        for col in df.columns:
            col_info = {
                'name': col,
                'dtype': str(df[col].dtype),
                'missing_count': int(df[col].isnull().sum()),
                'missing_percentage': float(df[col].isnull().sum() / len(df) * 100),
                'unique_count': int(df[col].nunique())
            }
            
            if pd.api.types.is_numeric_dtype(df[col]):
                col_info.update({
                    'mean': safe_convert_to_json(df[col].mean()),
                    'std': safe_convert_to_json(df[col].std()),
                    'min': safe_convert_to_json(df[col].min()),
                    'max': safe_convert_to_json(df[col].max())
                })
                analysis['numerical_columns'].append(col_info)
            else:
                top_values = df[col].value_counts().head(5)
                col_info['top_values'] = {str(k): int(v) for k, v in top_values.items()}
                analysis['categorical_columns'].append(col_info)
            
            analysis['missing_value_analysis'][col] = {
                'count': col_info['missing_count'],
                'percentage': col_info['missing_percentage']
            }
            analysis['data_types'][col] = col_info['dtype']
        
        return analysis
