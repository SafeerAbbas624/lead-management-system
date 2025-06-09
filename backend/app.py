from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Form, Query, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.security import APIKeyHeader, HTTPBearer, HTTPAuthorizationCredentials
import logging
import os
from dotenv import load_dotenv
import json
import jwt
from datetime import datetime, timedelta
import uuid
from typing import List, Optional, Dict, Any, Union
import asyncio
import random

# Import models
from models import (
    ProcessFileRequest, 
    ProcessFileResponse, 
    DNCCheckRequest, 
    DNCCheckResponse, 
    LeadDistributionRequest, 
    LeadDistributionResponse,
    DNCListCreate,
    DNCEntryCreate,
    DNCListBulkUploadRequest,
    LeadTagRequest,
    RevenueUploadRequest,
    ROIMetricsRequest,
    UserCreate,
    APIKeyCreate,
    WebhookCreate,
    SystemSettingsUpdate,
    LeadEnrichmentRequest,
    AutoMappingRequest,
    DuplicateCheckRequest,
    ProcessLeadsRequest
)

# Import other modules
from data_processor import DataProcessor
from database import SupabaseClient
from utils.notification_service import NotificationService
from utils.audit_logger import AuditLogger
from utils.lead_enrichment import LeadEnrichmentService
from upload_file import NLPFieldMapper, handle_check_duplicates, handle_auto_mapping, handle_process_leads, router as upload_router
from clients_new import router as clients_router

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Get environment variables
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")
API_TOKEN = os.environ.get("API_TOKEN")
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_JWT_SECRET:
    logger.warning("SUPABASE_JWT_SECRET not set. JWT validation will be skipped in development mode.")

if not API_TOKEN:
    logger.warning("API_TOKEN not set. API key authentication will be disabled.")

# Initialize FastAPI app
app = FastAPI(title="Lead Management System API", version="1.0.0")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
try:
    db = SupabaseClient(supabase_url=SUPABASE_URL, supabase_key=SUPABASE_KEY)
    logger.info("Successfully connected to Supabase")
except Exception as e:
    logger.error(f"Error initializing Supabase client: {str(e)}")
    raise

data_processor = DataProcessor()
notification_service = NotificationService()
audit_logger = AuditLogger(db)  # db instance passed here
lead_enrichment = LeadEnrichmentService()
nlp_mapper = NLPFieldMapper()  # Instantiate NLP mapper

# API Key security
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
security = HTTPBearer(auto_error=False)

if not SUPABASE_JWT_SECRET:
    logger.warning("SUPABASE_JWT_SECRET not set. JWT validation will be skipped in development mode.")

if not API_TOKEN:
    logger.warning("API_TOKEN not set. API key authentication will be disabled.")

async def get_api_key(api_key: Optional[str] = Depends(api_key_header)):
    """Validate API key and return permissions."""
    if not api_key:
        return None
    
    if api_key == API_TOKEN:
        return {"key": api_key, "permissions": ["read", "write"], "is_system": True}
    
    # Placeholder for more complex API key validation from DB
    if api_key.startswith("test_"): 
        return {"key": api_key, "permissions": ["read", "write"]}
    
    return None

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    api_key_data: Optional[Dict] = Depends(get_api_key)
):
    """
    Get the current user from the JWT token or API token.
    API key takes precedence if both are provided.
    """
    if api_key_data:
        if api_key_data.get("is_system"):
            return {"id": "system", "role": "admin"}
        return {"id": api_key_data.get("user_id", "api_user"), "role": "admin"}

    if credentials:
        token = credentials.credentials
        if not SUPABASE_JWT_SECRET and os.environ.get("ENVIRONMENT", "development") == "development":
            logger.warning("Running in development mode without JWT validation (JWT path)")
            return {"id": "dev_user_jwt", "role": "admin"}
        
        try:
            payload = jwt.decode(
                token, 
                SUPABASE_JWT_SECRET, 
                algorithms=["HS256"],
                options={"verify_signature": SUPABASE_JWT_SECRET is not None}
            )
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token: missing subject")
            role = payload.get("role", "user")
            return {"id": user_id, "role": role}
        except jwt.ExpiredSignatureError:
            logger.warning("JWT token has expired")
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.PyJWTError as e:
            logger.error(f"JWT validation error: {str(e)}")
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
        except Exception as e:
            logger.error(f"Authentication error during JWT processing: {str(e)}")
            raise HTTPException(status_code=401, detail="Could not validate credentials")

    # For development, return a default user if no auth was successful
    if os.environ.get("ENVIRONMENT", "development") == "development":
        return {"id": "dev_user_fallback", "role": "admin"}
    
    # If not in development and no auth method succeeded, raise an error
    raise HTTPException(status_code=401, detail="Not authenticated")

@app.get("/")
async def root():
    return {"message": "Lead Management System API"}

# Lead Processing Endpoints
@app.post("/check-duplicates")
async def check_duplicates_endpoint(
    request: DuplicateCheckRequest, 
    current_user: Dict = Depends(get_current_user)
):
    try:
        return handle_check_duplicates(request, db)
    except Exception as e:
        logger.error(f"Error in /check-duplicates endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auto-mapping")
async def auto_mapping_endpoint(
    request: AutoMappingRequest, 
    current_user: Dict = Depends(get_current_user)
):
    try:
        return handle_auto_mapping(request, nlp_mapper)
    except Exception as e:
        logger.error(f"Error in /auto-mapping endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-leads")
async def process_leads_endpoint(request: ProcessLeadsRequest):
    try:
        return handle_process_leads(request, db, data_processor)
    except Exception as e:
        logger.error(f"Error in /process-leads endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# Dashboard Endpoints
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: Dict = Depends(get_current_user)
):
    try:
        # Implementation here
        return {"status": "success", "message": "Dashboard stats endpoint"}
    except Exception as e:
        logger.error(f"Error in /api/dashboard/stats: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Include routers
app.include_router(upload_router, prefix="/api")
app.include_router(clients_router)

# Import and include leads router
from leads import router as leads_router
app.include_router(leads_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
