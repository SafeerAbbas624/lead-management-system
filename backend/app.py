from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Form, Query, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.security import APIKeyHeader, HTTPBearer, HTTPAuthorizationCredentials
import logging
import os
from dotenv import load_dotenv
import json
import jwt
# pandas and numpy might not be directly needed here if processing is in upload_file.py
# import pandas as pd
# import numpy as np
from datetime import datetime, timedelta
import uuid
from typing import List, Optional, Dict, Any, Union
import asyncio
import random
# Removed re, difflib, sklearn imports as NLPFieldMapper moved

from models import ( # Changed from relative to absolute import
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
from data_processor import DataProcessor
from database import SupabaseClient
from utils.notification_service import NotificationService
from utils.audit_logger import AuditLogger
from utils.lead_enrichment import LeadEnrichmentService
# Import from the new upload_file module
from upload_file import NLPFieldMapper, handle_check_duplicates, handle_auto_mapping, handle_process_leads

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Lead Management API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
data_processor = DataProcessor()
db = SupabaseClient()
notification_service = NotificationService()
audit_logger = AuditLogger(db) # db instance passed here
enrichment_service = LeadEnrichmentService()
nlp_mapper = NLPFieldMapper() # Instantiate NLP mapper

# API Key security
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
security = HTTPBearer(auto_error=False)

# Get Supabase JWT secret from environment
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")
API_TOKEN = os.environ.get("API_TOKEN")

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
    # For now, accept any "test_" prefixed key for development/testing
    if api_key.startswith("test_"): 
        # In a real app, you'd look this up in a database
        # key_data = db.get_api_key_details(api_key)
        # if key_data and key_data.is_active:
        # return {"key": api_key, "permissions": key_data.permissions, "user_id": key_data.user_id}
        return {"key": api_key, "permissions": ["read", "write"]} # Simplified
    
    return None

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    api_key_data: Optional[Dict] = Depends(get_api_key) # Use the processed API key data
):
    """
    Get the current user from the JWT token or API token.
    API key takes precedence if both are provided.
    """
    if api_key_data:
        # If it's the system API token or a validated user API key
        if api_key_data.get("is_system"):
            return {"id": "system", "role": "admin"}
        # If it's a user-specific API key, you might want to fetch user role based on user_id from api_key_data
        # For now, assume API key implies admin-like access for simplicity for "test_" keys
        return {"id": api_key_data.get("user_id", "api_user"), "role": "admin"} # Adjust role as needed

    if credentials:
        token = credentials.credentials
        # For development, accept any token if JWT secret is not set (and no API key was used)
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
            role = payload.get("role", "user") # Default role to 'user' if not in token
            return {"id": user_id, "role": role}
        except jwt.ExpiredSignatureError:
            logger.warning("JWT token has expired")
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.PyJWTError as e:
            logger.error(f"JWT validation error: {str(e)}")
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
        except Exception as e: # Catch any other decoding errors
            logger.error(f"Authentication error during JWT processing: {str(e)}")
            raise HTTPException(status_code=401, detail="Could not validate credentials")

    # For development, return a default user if no auth was successful
    if os.environ.get("ENVIRONMENT", "development") == "development":
        return {"id": "dev_user_fallback", "role": "admin"}
    
    # If not in development and no auth method succeeded, raise an error
    raise HTTPException(status_code=401, detail="Not authenticated")


# This get_optional_user might be redundant if get_current_user handles optionality by not raising an error
# However, FastAPI's Depends(...) typically means the dependency must be met.
# For truly optional auth, the endpoint itself should handle cases where current_user is None,
# or get_current_user should return None instead of raising HTTPException for specific paths.
# For now, let's assume most protected routes will use `Depends(get_current_user)` and expect a user or an error.

@app.get("/")
async def root():
    return {"message": "Lead Management API is running"}

# Lead Processing Endpoints - now delegate to upload_file.py
@app.post("/check-duplicates")
async def check_duplicates_endpoint(
    request: DuplicateCheckRequest, 
    current_user: Dict = Depends(get_current_user) # Make auth mandatory for this
):
    try:
        # The 'db' instance is available globally in this module
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
        # The 'nlp_mapper' instance is available globally
        return handle_auto_mapping(request, nlp_mapper)
    except Exception as e:
        logger.error(f"Error in /auto-mapping endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-leads")
async def process_leads_endpoint(
    request: ProcessLeadsRequest, 
    current_user: Dict = Depends(get_current_user)
):
    try:
        # Pass db and data_processor instances
        # Add user info to request.taggingSettings if needed for audit or record ownership
        if "fileName" not in request.taggingSettings: # Ensure fileName is robustly handled
             request.taggingSettings["fileName"] = "UploadedFile" # Default
        if "fileType" not in request.taggingSettings:
             request.taggingSettings["fileType"] = "unknown"

        # request.taggingSettings["userId"] = current_user["id"] # Example of passing user context

        return handle_process_leads(request, db, data_processor)
    except Exception as e:
        logger.error(f"Error in /process-leads endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# Dashboard Endpoints (remain largely the same, ensure auth is applied if needed)
@app.get("/dashboard/stats")
async def get_dashboard_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: Dict = Depends(get_current_user) 
):
    try:
        logger.info(f"Getting dashboard stats for user: {current_user.get('id')}")
        stats = db.get_dashboard_stats(start_date, end_date) # Assumes this method exists and works
        return stats
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {str(e)}", exc_info=True)
        # Fallback mock data (consider removing in production or making it conditional)
        return {
            "totalLeads": 1250, "totalUploads": 45, "dncMatches": 87, "conversionRate": 12.5,
            "convertedLeads": 156, "totalCost": 5000, "totalRevenue": 15000, "netProfit": 10000,
            "roi": 200, "processingBatches": 2, "failedBatches": 1, "avgLeadCost": 4, "avgRevenue": 96.15,
        }

@app.get("/dashboard/lead-trends")
async def get_lead_trends(
    period: str = Query("daily", enum=["daily", "weekly", "monthly"]),
    days: int = Query(30, ge=1, le=365),
    current_user: Dict = Depends(get_current_user)
):
    try:
        logger.info(f"Getting lead trends for user: {current_user.get('id')}, period: {period}, days: {days}")
        trends = db.get_lead_trends(period, days) # Assumes this method exists
        return {"trends": trends, "period": period}
    except Exception as e:
        logger.error(f"Error getting lead trends: {str(e)}", exc_info=True)
        # Fallback mock data
        mock_trends = []
        for i in range(days):
            date = datetime.now() - timedelta(days=i)
            mock_trends.append({
                "date": date.strftime("%Y-%m-%d"), "totalLeads": random.randint(30, 80),
                "convertedLeads": random.randint(5, 20), "dncLeads": random.randint(1, 6),
                "totalCost": random.randint(100, 300), "totalRevenue": random.randint(300, 800),
            })
        mock_trends.sort(key=lambda x: x["date"])
        return {"trends": mock_trends, "period": period}

@app.get("/dashboard/status-distribution")
async def get_status_distribution(current_user: Dict = Depends(get_current_user)):
    try:
        logger.info(f"Getting status distribution for user: {current_user.get('id')}")
        distribution = db.get_status_distribution() # Assumes this method exists
        return {"distribution": distribution, "total": sum(d["value"] for d in distribution)}
    except Exception as e:
        logger.error(f"Error getting status distribution: {str(e)}", exc_info=True)
        # Fallback mock data
        mock_distribution = [
            {"name": "New", "value": 450, "percentage": 36.0}, {"name": "Contacted", "value": 300, "percentage": 24.0},
            {"name": "Qualified", "value": 200, "percentage": 16.0}, {"name": "Converted", "value": 156, "percentage": 12.5},
            {"name": "DNC", "value": 87, "percentage": 7.0}, {"name": "Lost", "value": 57, "percentage": 4.5},
        ]
        return {"distribution": mock_distribution, "total": 1250}

@app.get("/dashboard/source-performance")
async def get_source_performance(current_user: Dict = Depends(get_current_user)):
    try:
        logger.info(f"Getting source performance for user: {current_user.get('id')}")
        performance = db.get_source_performance() # Assumes this method exists
        return {"sourcePerformance": performance}
    except Exception as e:
        logger.error(f"Error getting source performance: {str(e)}", exc_info=True)
        # Fallback mock data
        mock_performance = [
            {"source": "Google Ads", "totalLeads": 400, "convertedLeads": 60, "totalCost": 2000, "totalRevenue": 6000, "conversionRate": 15.0, "roi": 200.0},
            {"source": "Facebook Ads", "totalLeads": 350, "convertedLeads": 42, "totalCost": 1500, "totalRevenue": 4200, "conversionRate": 12.0, "roi": 180.0},
        ]
        return {"sourcePerformance": mock_performance}

@app.get("/dashboard/recent-uploads")
async def get_recent_uploads(
    limit: int = Query(5, ge=1, le=50), 
    current_user: Dict = Depends(get_current_user)
):
    try:
        logger.info(f"Getting recent uploads for user: {current_user.get('id')}, limit: {limit}")
        uploads = db.get_recent_uploads(limit) # Assumes this method exists
        return {"batches": uploads}
    except Exception as e:
        logger.error(f"Error getting recent uploads: {str(e)}", exc_info=True)
        # Fallback mock data
        mock_uploads = [
            {"id": str(uuid.uuid4()), "filename": "leads_batch_1.csv", "status": "Completed", "totalleads": 150, "cleanedleads": 130, "duplicateleads": 15, "dncmatches": 5, "createdat": (datetime.now() - timedelta(days=1)).isoformat(), "processingprogress": 100, "errormessage": ""},
            {"id": str(uuid.uuid4()), "filename": "leads_batch_2.xlsx", "status": "Processing", "totalleads": 200, "cleanedleads": 0, "duplicateleads": 0, "dncmatches": 0, "createdat": datetime.now().isoformat(), "processingprogress": 45, "errormessage": ""},
        ]
        return {"batches": mock_uploads[:limit]}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Ensure uvicorn run is guarded for module execution
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    # Consider adding log_level for uvicorn if not set by default from basicConfig
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True, log_level="info")
