"""
Hybrid API endpoints for the upload processing system
Provides endpoints for frontend to communicate with Python backend
"""

import uuid
import json
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import logging

from hybrid_upload_processor import processor, ProcessingSession, ProcessingStep, processing_sessions

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/api/hybrid", tags=["hybrid-upload"])

class StartProcessingRequest(BaseModel):
    session_id: Optional[str] = None

class ProcessStepRequest(BaseModel):
    session_id: str
    step: ProcessingStep

class UpdateSupplierRequest(BaseModel):
    session_id: str
    supplier_id: int
    lead_cost: float

class SessionStatusResponse(BaseModel):
    session_id: str
    status: str
    current_step: int
    total_steps: int
    progress: float
    steps: List[Dict[str, Any]]
    data: Optional[Dict[str, Any]] = None

@router.post("/start-processing")
async def start_processing(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None)
):
    """
    Start a new processing session
    """
    try:
        # Generate session ID if not provided
        if not session_id:
            session_id = str(uuid.uuid4())
        
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Check file type
        allowed_extensions = ['.csv', '.xlsx', '.xls']
        if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Start processing
        session = await processor.start_processing(file, session_id)
        
        logger.info(f"Started processing session {session_id} for file {file.filename}")
        
        return {
            "success": True,
            "session_id": session_id,
            "message": f"Processing started for {file.filename}",
            "total_steps": session.total_steps,
            "file_name": session.file_name,
            "data_preview": {
                "headers": session.data.get('headers', []),
                "row_count": session.data.get('row_count', 0),
                "sample_data": session.data.get('original_data', [])[:3]  # First 3 rows
            }
        }
        
    except Exception as e:
        logger.error(f"Error starting processing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-step")
async def process_step(request: ProcessStepRequest):
    """
    Process a specific step in the workflow
    """
    try:
        # Process the step
        step_result = await processor.process_step(request.session_id, request.step)
        
        logger.info(f"Processed step {request.step} for session {request.session_id}")
        
        return {
            "success": True,
            "step": step_result.step,
            "status": step_result.status,
            "message": step_result.message,
            "data": step_result.data,
            "progress": step_result.progress,
            "timestamp": step_result.timestamp.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error processing step {request.step}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session-status/{session_id}")
async def get_session_status(session_id: str):
    """
    Get the current status of a processing session
    """
    try:
        if session_id not in processing_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = processing_sessions[session_id]
        
        # Calculate overall progress
        completed_steps = sum(1 for step in session.steps if step.status == "completed")
        progress = (completed_steps / session.total_steps) * 100 if session.total_steps > 0 else 0
        
        # Determine overall status
        if any(step.status == "error" for step in session.steps):
            status = "error"
        elif completed_steps == session.total_steps:
            status = "completed"
        elif any(step.status == "processing" for step in session.steps):
            status = "processing"
        else:
            status = "pending"
        
        return SessionStatusResponse(
            session_id=session_id,
            status=status,
            current_step=session.current_step,
            total_steps=session.total_steps,
            progress=progress,
            steps=[
                {
                    "step": step.step,
                    "status": step.status,
                    "message": step.message,
                    "progress": step.progress,
                    "timestamp": step.timestamp.isoformat(),
                    "data": step.data
                }
                for step in session.steps
            ],
            data=session.data
        )
        
    except Exception as e:
        logger.error(f"Error getting session status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update-supplier")
async def update_supplier(request: UpdateSupplierRequest):
    """
    Update supplier information for a processing session
    """
    try:
        if request.session_id not in processing_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = processing_sessions[request.session_id]
        session.supplier_id = request.supplier_id
        session.lead_cost = request.lead_cost
        
        processing_sessions[request.session_id] = session
        
        logger.info(f"Updated supplier for session {request.session_id}: supplier_id={request.supplier_id}, cost={request.lead_cost}")
        
        return {
            "success": True,
            "message": "Supplier information updated",
            "supplier_id": request.supplier_id,
            "lead_cost": request.lead_cost
        }
        
    except Exception as e:
        logger.error(f"Error updating supplier: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/suppliers")
async def get_suppliers():
    """
    Get list of available suppliers
    """
    try:
        suppliers = await processor.supabase.get_suppliers()
        
        return {
            "success": True,
            "suppliers": suppliers
        }
        
    except Exception as e:
        logger.error(f"Error getting suppliers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/preview-data/{session_id}")
async def get_preview_data(session_id: str, step: Optional[str] = None):
    """
    Get preview of processed data at any step
    """
    try:
        if session_id not in processing_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = processing_sessions[session_id]
        
        # Get data based on step
        if step == "original":
            data = session.data.get('original_data', [])
        elif step == "processed":
            data = session.data.get('processed_data', [])
        elif step == "clean":
            data = session.data.get('clean_data', [])
        elif step == "final":
            data = session.data.get('final_data', [])
        else:
            # Get the most recent processed data
            data = (session.data.get('final_data') or 
                   session.data.get('clean_data') or 
                   session.data.get('processed_data') or 
                   session.data.get('original_data', []))
        
        # Return preview (first 10 rows)
        preview = data[:10] if data else []
        
        return {
            "success": True,
            "preview": preview,
            "total_rows": len(data),
            "columns": list(data[0].keys()) if data else [],
            "step": step or "current"
        }
        
    except Exception as e:
        logger.error(f"Error getting preview data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """
    Delete a processing session and clean up resources
    """
    try:
        if session_id in processing_sessions:
            del processing_sessions[session_id]
            logger.info(f"Deleted session {session_id}")
        
        return {
            "success": True,
            "message": "Session deleted successfully"
        }
        
    except Exception as e:
        logger.error(f"Error deleting session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/active-sessions")
async def get_active_sessions():
    """
    Get list of all active processing sessions
    """
    try:
        sessions = []
        for session_id, session in processing_sessions.items():
            completed_steps = sum(1 for step in session.steps if step.status == "completed")
            progress = (completed_steps / session.total_steps) * 100 if session.total_steps > 0 else 0
            
            sessions.append({
                "session_id": session_id,
                "file_name": session.file_name,
                "current_step": session.current_step,
                "total_steps": session.total_steps,
                "progress": progress,
                "supplier_id": session.supplier_id,
                "lead_cost": session.lead_cost
            })
        
        return {
            "success": True,
            "sessions": sessions,
            "total_sessions": len(sessions)
        }
        
    except Exception as e:
        logger.error(f"Error getting active sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-all-steps/{session_id}")
async def process_all_steps(session_id: str, background_tasks: BackgroundTasks):
    """
    Process all steps automatically (except supplier selection)
    """
    try:
        if session_id not in processing_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Add background task to process all steps
        background_tasks.add_task(process_all_steps_background, session_id)
        
        return {
            "success": True,
            "message": "Processing all steps in background",
            "session_id": session_id
        }
        
    except Exception as e:
        logger.error(f"Error starting background processing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_all_steps_background(session_id: str):
    """
    Background task to process all steps automatically
    """
    try:
        steps_to_process = [
            ProcessingStep.FIELD_MAPPING,
            ProcessingStep.DATA_CLEANING,
            ProcessingStep.DATA_NORMALIZATION,
            ProcessingStep.LEAD_TAGGING,
            ProcessingStep.AUTO_MAPPING,
            ProcessingStep.DUPLICATE_CHECK,
            ProcessingStep.PREVIEW,
            # Skip SUPPLIER_SELECTION - requires user input
            ProcessingStep.DNC_CHECK,
            # Skip UPLOAD - requires supplier selection first
        ]
        
        for step in steps_to_process:
            try:
                await processor.process_step(session_id, step)
                logger.info(f"Background processing completed step {step} for session {session_id}")
            except Exception as e:
                logger.error(f"Background processing failed at step {step} for session {session_id}: {str(e)}")
                break
        
        logger.info(f"Background processing completed for session {session_id}")
        
    except Exception as e:
        logger.error(f"Error in background processing for session {session_id}: {str(e)}")

# Health check endpoint
@router.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "active_sessions": len(processing_sessions),
        "service": "hybrid-upload-processor"
    }
