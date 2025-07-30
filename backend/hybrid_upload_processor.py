"""
Hybrid Upload Processor for Lead Management System
Handles the heavy processing tasks while communicating with the frontend
"""

import os
import json
import io
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone
import logging
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel
import asyncio
from enum import Enum

from database import SupabaseClient
from field_mapper import FieldMapper
from duplicate_checker import DuplicateChecker
from data_processor import DataProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter()

# Initialize components
supabase_client = SupabaseClient()
field_mapper = FieldMapper()
duplicate_checker = DuplicateChecker()
data_processor = DataProcessor()

class ProcessingStep(str, Enum):
    FIELD_MAPPING = "field-mapping"
    DATA_CLEANING = "data-cleaning"
    DATA_NORMALIZATION = "data-normalization"
    LEAD_TAGGING = "lead-tagging"
    AUTO_MAPPING = "auto-mapping"
    DUPLICATE_CHECK = "duplicate-check"
    PREVIEW = "preview"
    SUPPLIER_SELECTION = "supplier-selection"
    DNC_CHECK = "dnc-check"
    UPLOAD = "upload"

class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    ERROR = "error"

class StepResult(BaseModel):
    step: ProcessingStep
    status: ProcessingStatus
    message: str
    data: Optional[Dict[str, Any]] = None
    progress: float = 0.0
    timestamp: datetime

class ProcessingSession(BaseModel):
    session_id: str
    file_name: str
    total_steps: int
    current_step: int
    steps: List[StepResult]
    data: Optional[Dict[str, Any]] = None
    supplier_id: Optional[int] = None
    lead_cost: Optional[float] = None

# In-memory storage for processing sessions (in production, use Redis)
processing_sessions: Dict[str, ProcessingSession] = {}

class HybridUploadProcessor:
    """Main processor that orchestrates the upload workflow"""
    
    def __init__(self):
        self.supabase = supabase_client
        self.field_mapper = field_mapper
        self.duplicate_checker = duplicate_checker
        self.data_processor = data_processor
    
    async def start_processing(self, file: UploadFile, session_id: str) -> ProcessingSession:
        """Initialize processing session and start the workflow"""
        
        # Create processing session
        session = ProcessingSession(
            session_id=session_id,
            file_name=file.filename,
            total_steps=10,
            current_step=0,
            steps=[]
        )
        
        # Initialize all steps
        steps = [
            ProcessingStep.FIELD_MAPPING,
            ProcessingStep.DATA_CLEANING,
            ProcessingStep.DATA_NORMALIZATION,
            ProcessingStep.LEAD_TAGGING,
            ProcessingStep.AUTO_MAPPING,
            ProcessingStep.DUPLICATE_CHECK,
            ProcessingStep.PREVIEW,
            ProcessingStep.SUPPLIER_SELECTION,
            ProcessingStep.DNC_CHECK,
            ProcessingStep.UPLOAD
        ]
        
        for step in steps:
            session.steps.append(StepResult(
                step=step,
                status=ProcessingStatus.PENDING,
                message="Waiting to start",
                timestamp=datetime.now(timezone.utc)
            ))
        
        processing_sessions[session_id] = session
        
        # Parse file content first
        try:
            file_content = await file.read()
            await file.seek(0)  # Reset file pointer
            
            # Parse based on file type
            if file.filename.endswith('.csv'):
                df = pd.read_csv(io.StringIO(file_content.decode('utf-8')))
            elif file.filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(io.BytesIO(file_content))
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format")
            
            # Store parsed data
            session.data = {
                'original_data': df.to_dict('records'),
                'headers': df.columns.tolist(),
                'row_count': len(df)
            }
            
            processing_sessions[session_id] = session
            
        except Exception as e:
            logger.error(f"Error parsing file: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")
        
        return session
    
    async def process_step(self, session_id: str, step: ProcessingStep) -> StepResult:
        """Process a specific step in the workflow"""
        
        if session_id not in processing_sessions:
            raise HTTPException(status_code=404, detail="Processing session not found")
        
        session = processing_sessions[session_id]
        
        # Find the step in the session
        step_index = None
        for i, s in enumerate(session.steps):
            if s.step == step:
                step_index = i
                break
        
        if step_index is None:
            raise HTTPException(status_code=400, detail="Step not found")
        
        # Update step status to processing
        session.steps[step_index].status = ProcessingStatus.PROCESSING
        session.steps[step_index].message = "Processing..."
        session.steps[step_index].timestamp = datetime.now(timezone.utc)
        session.current_step = step_index
        
        try:
            # Process the step
            result = await self._execute_step(session, step)
            
            # Update step with result
            session.steps[step_index].status = ProcessingStatus.COMPLETED
            session.steps[step_index].message = result.get('message', 'Completed successfully')
            session.steps[step_index].data = result.get('data')
            session.steps[step_index].progress = 100.0
            session.steps[step_index].timestamp = datetime.now(timezone.utc)
            
            # Update session data if needed
            if 'updated_data' in result:
                session.data.update(result['updated_data'])
            
            processing_sessions[session_id] = session
            
            return session.steps[step_index]
            
        except Exception as e:
            logger.error(f"Error processing step {step}: {str(e)}")
            
            # Update step with error
            session.steps[step_index].status = ProcessingStatus.ERROR
            session.steps[step_index].message = f"Error: {str(e)}"
            session.steps[step_index].timestamp = datetime.now(timezone.utc)
            
            processing_sessions[session_id] = session
            
            raise HTTPException(status_code=500, detail=f"Error processing step: {str(e)}")
    
    async def _execute_step(self, session: ProcessingSession, step: ProcessingStep) -> Dict[str, Any]:
        """Execute a specific processing step"""
        
        data = session.data['original_data'] if 'processed_data' not in session.data else session.data['processed_data']
        
        if step == ProcessingStep.FIELD_MAPPING:
            return await self._process_field_mapping(data, session.data['headers'])
        
        elif step == ProcessingStep.DATA_CLEANING:
            return await self._process_data_cleaning(data)
        
        elif step == ProcessingStep.DATA_NORMALIZATION:
            return await self._process_data_normalization(data)
        
        elif step == ProcessingStep.LEAD_TAGGING:
            return await self._process_lead_tagging(data)
        
        elif step == ProcessingStep.AUTO_MAPPING:
            return await self._process_auto_mapping(data, session.data['headers'])
        
        elif step == ProcessingStep.DUPLICATE_CHECK:
            return await self._process_duplicate_check(data)
        
        elif step == ProcessingStep.PREVIEW:
            return await self._process_preview(data)
        
        elif step == ProcessingStep.SUPPLIER_SELECTION:
            return await self._process_supplier_selection(session)
        
        elif step == ProcessingStep.DNC_CHECK:
            return await self._process_dnc_check(data)
        
        elif step == ProcessingStep.UPLOAD:
            return await self._process_upload(session)
        
        else:
            raise ValueError(f"Unknown processing step: {step}")
    
    async def _process_field_mapping(self, data: List[Dict], headers: List[str]) -> Dict[str, Any]:
        """Process manual field mapping rules"""
        
        # Get field mapping rules from database or configuration
        mapping_rules = await self.field_mapper.get_mapping_rules()
        
        # Apply manual mappings if they exist
        mapped_fields = {}
        for header in headers:
            mapped_field = await self.field_mapper.get_manual_mapping(header)
            if mapped_field:
                mapped_fields[header] = mapped_field
        
        return {
            'message': f'Field mapping checked. {len(mapped_fields)} fields manually mapped.',
            'data': {
                'mapping_rules': mapping_rules,
                'mapped_fields': mapped_fields,
                'unmapped_headers': [h for h in headers if h not in mapped_fields]
            }
        }
    
    async def _process_data_cleaning(self, data: List[Dict]) -> Dict[str, Any]:
        """Apply data cleaning rules"""
        
        cleaned_data = await self.data_processor.clean_data(data)
        
        return {
            'message': f'Data cleaning completed. {len(cleaned_data)} rows processed.',
            'data': {
                'cleaning_stats': {
                    'original_rows': len(data),
                    'cleaned_rows': len(cleaned_data),
                    'null_values_removed': 0,  # Calculate actual stats
                }
            },
            'updated_data': {'processed_data': cleaned_data}
        }
    
    async def _process_data_normalization(self, data: List[Dict]) -> Dict[str, Any]:
        """Apply data normalization"""
        
        normalized_data = await self.data_processor.normalize_data(data)
        
        return {
            'message': f'Data normalization completed. {len(normalized_data)} rows processed.',
            'data': {
                'normalization_stats': {
                    'phone_numbers_normalized': 0,  # Calculate actual stats
                    'emails_normalized': 0,
                    'addresses_normalized': 0,
                }
            },
            'updated_data': {'processed_data': normalized_data}
        }
    
    async def _process_lead_tagging(self, data: List[Dict]) -> Dict[str, Any]:
        """Apply automatic lead tagging"""
        
        tagged_data = await self.data_processor.apply_lead_tags(data)
        
        return {
            'message': f'Lead tagging completed. Tags applied to {len(tagged_data)} leads.',
            'data': {
                'tagging_stats': {
                    'leads_tagged': len([d for d in tagged_data if d.get('tags')]),
                    'unique_tags': len(set([tag for d in tagged_data for tag in d.get('tags', [])]))
                }
            },
            'updated_data': {'processed_data': tagged_data}
        }
    
    async def _process_auto_mapping(self, data: List[Dict], headers: List[str]) -> Dict[str, Any]:
        """Perform automatic field mapping"""
        
        mapping_result = await self.field_mapper.auto_map_fields(headers)
        
        # Apply the mapping to data
        mapped_data = []
        for row in data:
            mapped_row = {}
            for original_field, value in row.items():
                mapped_field = mapping_result['mapped_fields'].get(original_field, original_field)
                mapped_row[mapped_field] = value
            mapped_data.append(mapped_row)
        
        return {
            'message': f'Auto-mapping completed. {len(mapping_result["mapped_fields"])} fields mapped.',
            'data': {
                'mapping_result': mapping_result,
                'confidence': mapping_result.get('confidence', 0)
            },
            'updated_data': {'processed_data': mapped_data}
        }
    
    async def _process_duplicate_check(self, data: List[Dict]) -> Dict[str, Any]:
        """Check for duplicates"""
        
        duplicate_result = await self.duplicate_checker.check_duplicates(data)
        
        return {
            'message': f'Duplicate check completed. {duplicate_result["duplicate_count"]} duplicates found.',
            'data': {
                'duplicate_stats': duplicate_result['stats'],
                'duplicates': duplicate_result['duplicates']
            },
            'updated_data': {'clean_data': duplicate_result['clean_data']}
        }
    
    async def _process_preview(self, data: List[Dict]) -> Dict[str, Any]:
        """Generate data preview"""
        
        preview_data = data[:10]  # First 10 rows
        
        return {
            'message': f'Preview generated. Showing first 10 of {len(data)} rows.',
            'data': {
                'preview': preview_data,
                'total_rows': len(data),
                'columns': list(data[0].keys()) if data else []
            }
        }
    
    async def _process_supplier_selection(self, session: ProcessingSession) -> Dict[str, Any]:
        """Handle supplier selection (requires frontend input)"""
        
        # Get available suppliers
        suppliers = await self.supabase.get_suppliers()
        
        return {
            'message': 'Supplier selection required. Please select supplier and cost.',
            'data': {
                'suppliers': suppliers,
                'requires_input': True
            }
        }
    
    async def _process_dnc_check(self, data: List[Dict]) -> Dict[str, Any]:
        """Check against DNC lists"""
        
        # Get DNC lists and check data
        dnc_result = await self.supabase.check_dnc_lists(data)
        
        return {
            'message': f'DNC check completed. {dnc_result["dnc_matches"]} matches found.',
            'data': {
                'dnc_stats': dnc_result['stats'],
                'dnc_matches': dnc_result['matches']
            },
            'updated_data': {'final_data': dnc_result['clean_data']}
        }
    
    async def _process_upload(self, session: ProcessingSession) -> Dict[str, Any]:
        """Final upload to database"""
        
        if not session.supplier_id or not session.lead_cost:
            raise ValueError("Supplier ID and lead cost are required for upload")
        
        final_data = session.data.get('final_data', session.data.get('clean_data', session.data['processed_data']))
        
        # Upload to database
        upload_result = await self.supabase.upload_leads(
            leads_data=final_data,
            supplier_id=session.supplier_id,
            lead_cost=session.lead_cost,
            file_name=session.file_name
        )
        
        return {
            'message': f'Upload completed. {upload_result["inserted_count"]} leads uploaded.',
            'data': {
                'upload_stats': upload_result,
                'batch_id': upload_result.get('batch_id')
            }
        }

# Initialize processor
processor = HybridUploadProcessor()
