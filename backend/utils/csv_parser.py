import pandas as pd
import numpy as np
import io
import json
import zipfile
import logging
from typing import Dict, List, Any, Optional, Tuple

logger = logging.getLogger(__name__)

def parse_csv(file_content: bytes) -> pd.DataFrame:
    """Parse CSV file content into a pandas DataFrame."""
    try:
        return pd.read_csv(io.BytesIO(file_content))
    except Exception as e:
        logger.error(f"Failed to parse CSV: {str(e)}")
        raise ValueError(f"Failed to parse CSV: {str(e)}")

def parse_excel(file_content: bytes) -> pd.DataFrame:
    """Parse Excel file content into a pandas DataFrame."""
    try:
        return pd.read_excel(io.BytesIO(file_content))
    except Exception as e:
        logger.error(f"Failed to parse Excel: {str(e)}")
        raise ValueError(f"Failed to parse Excel: {str(e)}")
        
def parse_json(file_content: bytes) -> pd.DataFrame:
    """Parse JSON file content into a pandas DataFrame."""
    try:
        return pd.read_json(io.BytesIO(file_content))
    except Exception as e:
        logger.error(f"Failed to parse JSON: {str(e)}")
        raise ValueError(f"Failed to parse JSON: {str(e)}")

def parse_file(file_content: bytes, file_type: str) -> pd.DataFrame:
    """
    Parse file content based on file type.
    
    Args:
        file_content: Raw file content in bytes
        file_type: File extension (csv, xlsx, json)
        
    Returns:
        Pandas DataFrame with parsed data
    """
    file_type = file_type.lower()
    
    if file_type == 'csv':
        return parse_csv(file_content)
    elif file_type in ['xlsx', 'xls']:
        return parse_excel(file_content)
    elif file_type == 'json':
        return parse_json(file_content)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")

def detect_file_type(file_content: bytes) -> str:
    """
    Attempt to detect file type from content.
    
    Args:
        file_content: Raw file content in bytes
        
    Returns:
        Detected file type (csv, xlsx, json)
    """
    # Check if it's a zip file
    try:
        with zipfile.ZipFile(io.BytesIO(file_content)) as zf:
            if any(name.endswith('.xlsx') for name in zf.namelist()):
                return 'xlsx'
    except:
        pass
    
    # Check if it's JSON
    try:
        json.loads(file_content.decode('utf-8'))
        return 'json'
    except:
        pass
    
    # Default to CSV
    return 'csv'

def map_fields(df: pd.DataFrame, field_mappings: Dict[str, List[str]]) -> pd.DataFrame:
    """
    Map fields from source DataFrame to standard field names.
    
    Args:
        df: Source DataFrame
        field_mappings: Dictionary mapping standard field names to possible source field names
        
    Returns:
        DataFrame with standardized column names
    """
    # Get column names in lowercase for case-insensitive matching
    columns_lower = {col.lower(): col for col in df.columns}
    
    # Create a new DataFrame with standardized columns
    new_df = pd.DataFrame()
    
    # Map each standard field
    for std_field, source_fields in field_mappings.items():
        # Try to find a matching column
        for source_field in source_fields:
            if source_field.lower() in columns_lower:
                # Found a match, copy the data
                original_col = columns_lower[source_field.lower()]
                new_df[std_field] = df[original_col]
                break
    
    # Add any missing standard fields as empty columns
    for std_field in field_mappings.keys():
        if std_field not in new_df.columns:
            new_df[std_field] = np.nan
    
    return new_df

def compress_file(file_content: bytes, file_type: str) -> Tuple[bytes, str]:
    """
    Compress file content into a zip file.
    
    Args:
        file_content: Raw file content in bytes
        file_type: Original file type
        
    Returns:
        Tuple of (compressed content, new file type)
    """
    buffer = io.BytesIO()
    
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(f"leads.{file_type}", file_content)
    
    buffer.seek(0)
    return buffer.read(), 'zip'

def detect_delimiters(file_content: bytes) -> str:
    """
    Detect CSV delimiter in file content.
    
    Args:
        file_content: Raw file content in bytes
        
    Returns:
        Detected delimiter character
    """
    sample = file_content.decode('utf-8', errors='ignore')[:1000]
    lines = sample.split('\n')
    
    if not lines:
        return ','
    
    # Count potential delimiters
    delimiters = [',', ';', '\t', '|']
    counts = {d: lines[0].count(d) for d in delimiters}
    
    # Return the delimiter with the highest count
    return max(counts.items(), key=lambda x: x[1])[0]

def auto_detect_fields(df: pd.DataFrame) -> Dict[str, List[str]]:
    """
    Automatically detect field mappings from DataFrame columns.
    
    Args:
        df: Source DataFrame
        
    Returns:
        Dictionary mapping standard field names to detected source field names
    """
    field_mappings = {
        "firstName": [],
        "lastName": [],
        "email": [],
        "phone": [],
        "companyName": [],
        "address": [],
        "city": [],
        "state": [],
        "zipCode": [],
        "country": []
    }
    
    # Common patterns for different fields
    patterns = {
        "firstName": ["first", "fname", "given", "forename"],
        "lastName": ["last", "lname", "surname", "family"],
        "email": ["email", "mail", "e-mail"],
        "phone": ["phone", "mobile", "cell", "tel"],
        "companyName": ["company", "business", "organization", "employer"],
        "address": ["address", "street", "addr"],
        "city": ["city", "town", "municipality"],
        "state": ["state", "province", "region"],
        "zipCode": ["zip", "postal", "post code", "postcode"],
        "country": ["country", "nation"]
    }
    
    # Check each column against patterns
    for col in df.columns:
        col_lower = col.lower()
        
        for field, pattern_list in patterns.items():
            if any(pattern in col_lower for pattern in pattern_list):
                field_mappings[field].append(col)
    
    return field_mappings
