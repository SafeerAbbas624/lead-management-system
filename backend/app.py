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

# Import hybrid system
try:
    from simple_hybrid_api import router as hybrid_router
    HYBRID_AVAILABLE = True
    logger.info("Simple hybrid upload system loaded successfully")
except ImportError as e:
    logger.warning(f"Hybrid upload system not available: {e}")
    HYBRID_AVAILABLE = False

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
    return {
        "message": "Lead Management System API",
        "version": "2.0.0",
        "status": "running",
        "hybrid_system": HYBRID_AVAILABLE,
        "endpoints": {
            "legacy_upload": "/api",
            "hybrid_upload": "/api/hybrid" if HYBRID_AVAILABLE else "Not available",
            "docs": "/docs",
            "health": "/health"
        }
    }

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

# Dashboard Endpoints
@app.get("/api/dashboard/stats")
async def get_dashboard_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: Dict = Depends(get_current_user)
):
    try:
        db_client = SupabaseClient()
        supabase = db_client.supabase

        # Get all required data (synchronous calls)
        # Total leads
        total_leads_response = supabase.table('leads').select('*', count='exact').execute()
        # Total sold leads (from clients_history)
        total_sold_response = supabase.table('clients_history').select('*', count='exact').execute()
        # Total clients
        total_clients_response = supabase.table('clients').select('*', count='exact').execute()
        # Total suppliers
        total_suppliers_response = supabase.table('suppliers').select('*', count='exact').execute()
        # Total revenue spent (sum of total_buying_price from upload_batches)
        revenue_spent_response = supabase.table('upload_batches').select('total_buying_price').execute()
        # Total revenue generated (sum of selling_price_per_sheet from lead_distributions)
        revenue_generated_response = supabase.table('lead_distributions').select('selling_price_per_sheet').execute()
        # Total uploads
        total_uploads_response = supabase.table('upload_batches').select('*', count='exact').execute()
        # Total DNC
        total_dnc_response = supabase.table('dnc_entries').select('*', count='exact').execute()
        # Total duplicate leads
        total_duplicates_response = supabase.table('duplicate_leads').select('*', count='exact').execute()
        # Lead costs for average calculation (use buying_price_per_lead from upload_batches)
        lead_costs_response = supabase.table('upload_batches').select('buying_price_per_lead, totalleads').execute()

        # Extract results
        total_leads = total_leads_response.count or 0
        total_sold_leads = total_sold_response.count or 0
        total_clients = total_clients_response.count or 0
        total_suppliers = total_suppliers_response.count or 0
        revenue_spent_data = revenue_spent_response.data or []
        revenue_generated_data = revenue_generated_response.data or []
        total_uploads = total_uploads_response.count or 0
        total_dnc = total_dnc_response.count or 0
        total_duplicates = total_duplicates_response.count or 0
        total_batches = total_uploads_response.count or 0  # Same as total_uploads
        lead_costs_data = lead_costs_response.data or []

        # Calculate financial metrics
        total_revenue_spent = sum(float(item['total_buying_price'] or 0) for item in revenue_spent_data)
        total_revenue_generated = sum(float(item['selling_price_per_sheet'] or 0) for item in revenue_generated_data)

        # Calculate average cost (weighted average based on number of leads in each batch)
        total_cost = 0
        total_leads_count = 0
        for item in lead_costs_data:
            if item.get('buying_price_per_lead') and item.get('totalleads'):
                batch_cost = float(item['buying_price_per_lead']) * int(item['totalleads'])
                total_cost += batch_cost
                total_leads_count += int(item['totalleads'])

        average_cost = total_cost / total_leads_count if total_leads_count > 0 else 0

        # Calculate actual conversion rate (sold leads / total leads)
        conversion_rate = (total_sold_leads / total_leads * 100) if total_leads > 0 else 0

        return {
            "success": True,
            "data": {
                "total_leads": total_leads,
                "total_sold_leads": total_sold_leads,
                "total_clients": total_clients,
                "total_suppliers": total_suppliers,
                "total_revenue_spent": round(total_revenue_spent, 2),
                "total_revenue_generated": round(total_revenue_generated, 2),
                "average_cost": round(average_cost, 2),
                "conversion_rate": round(conversion_rate, 2),
                "total_uploads": total_uploads,
                "total_dnc": total_dnc,
                "total_duplicates": total_duplicates,
                "total_batches": total_batches
            }
        }
    except Exception as e:
        logger.error(f"Error in /api/dashboard/stats: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/top-suppliers")
async def get_top_suppliers(current_user: Dict = Depends(get_current_user)):
    try:
        db_client = SupabaseClient()
        supabase = db_client.supabase

        # Get suppliers with lead counts
        response = supabase.table('suppliers').select(
            'id, name, leads:leads(count)'
        ).execute()

        # Sort by lead count and get top 5
        suppliers_with_counts = []
        for supplier in response.data:
            lead_count = len(supplier.get('leads', []))
            suppliers_with_counts.append({
                'name': supplier['name'],
                'count': lead_count
            })

        # Sort by count descending and take top 5
        top_suppliers = sorted(suppliers_with_counts, key=lambda x: x['count'], reverse=True)[:5]

        return {"success": True, "data": top_suppliers}
    except Exception as e:
        logger.error(f"Error in /api/dashboard/top-suppliers: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/top-clients")
async def get_top_clients(current_user: Dict = Depends(get_current_user)):
    try:
        db_client = SupabaseClient()
        supabase = db_client.supabase

        # Get clients with distribution counts
        response = supabase.table('clients').select(
            'id, name, clients_history:clients_history(count)'
        ).execute()

        # Sort by distribution count and get top 5
        clients_with_counts = []
        for client in response.data:
            distribution_count = len(client.get('clients_history', []))
            clients_with_counts.append({
                'name': client['name'],
                'count': distribution_count
            })

        # Sort by count descending and take top 5
        top_clients = sorted(clients_with_counts, key=lambda x: x['count'], reverse=True)[:5]

        return {"success": True, "data": top_clients}
    except Exception as e:
        logger.error(f"Error in /api/dashboard/top-clients: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/top-duplicates-by-suppliers")
async def get_top_duplicates_by_suppliers(current_user: Dict = Depends(get_current_user)):
    try:
        db_client = SupabaseClient()
        supabase = db_client.supabase

        # Get duplicate leads grouped by supplier
        response = supabase.table('duplicate_leads').select(
            'supplier_name, supplier_id'
        ).execute()

        # Count duplicates by supplier
        supplier_duplicates = {}
        for duplicate in response.data:
            supplier_name = duplicate.get('supplier_name', 'Unknown')
            if supplier_name in supplier_duplicates:
                supplier_duplicates[supplier_name] += 1
            else:
                supplier_duplicates[supplier_name] = 1

        # Convert to list and sort
        top_duplicates = [
            {'name': name, 'count': count}
            for name, count in supplier_duplicates.items()
        ]
        top_duplicates = sorted(top_duplicates, key=lambda x: x['count'], reverse=True)[:5]

        return {"success": True, "data": top_duplicates}
    except Exception as e:
        logger.error(f"Error in /api/dashboard/top-duplicates-by-suppliers: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/top-dnc-by-suppliers")
async def get_top_dnc_by_suppliers(current_user: Dict = Depends(get_current_user)):
    try:
        db_client = SupabaseClient()
        supabase = db_client.supabase

        # Get DNC entries with source information
        response = supabase.table('dnc_entries').select('source').execute()

        # Count DNC by source (supplier)
        supplier_dnc = {}
        for dnc in response.data:
            source = dnc.get('source', 'Unknown')
            if source in supplier_dnc:
                supplier_dnc[source] += 1
            else:
                supplier_dnc[source] = 1

        # Convert to list and sort
        top_dnc = [
            {'name': name, 'count': count}
            for name, count in supplier_dnc.items()
        ]
        top_dnc = sorted(top_dnc, key=lambda x: x['count'], reverse=True)[:5]

        return {"success": True, "data": top_dnc}
    except Exception as e:
        logger.error(f"Error in /api/dashboard/top-dnc-by-suppliers: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/leads-by-clients")
async def get_leads_by_clients(current_user: Dict = Depends(get_current_user)):
    try:
        db_client = SupabaseClient()
        supabase = db_client.supabase

        # Get clients with their distributed leads count
        response = supabase.table('clients_history').select(
            'client_id, clients:client_id(name)'
        ).execute()

        # Count leads by client
        client_leads = {}
        for record in response.data:
            client_name = record.get('clients', {}).get('name', 'Unknown') if record.get('clients') else 'Unknown'
            if client_name in client_leads:
                client_leads[client_name] += 1
            else:
                client_leads[client_name] = 1

        # Convert to chart format
        chart_data = [
            {'name': name, 'value': count}
            for name, count in client_leads.items()
        ]

        return {"success": True, "data": chart_data}
    except Exception as e:
        logger.error(f"Error in /api/dashboard/leads-by-clients: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard/leads-by-tags")
async def get_leads_by_tags(current_user: Dict = Depends(get_current_user)):
    try:
        db_client = SupabaseClient()
        supabase = db_client.supabase

        # Get all leads with tags
        response = supabase.table('leads').select('tags').execute()

        # Count leads by tags
        tag_counts = {}
        for lead in response.data:
            tags = lead.get('tags', [])
            if not tags:
                # Count leads without tags
                if 'No Tags' in tag_counts:
                    tag_counts['No Tags'] += 1
                else:
                    tag_counts['No Tags'] = 1
            else:
                # Count each tag
                for tag in tags:
                    if tag in tag_counts:
                        tag_counts[tag] += 1
                    else:
                        tag_counts[tag] = 1

        # Convert to chart format
        chart_data = [
            {'name': tag, 'value': count}
            for tag, count in tag_counts.items()
        ]

        return {"success": True, "data": chart_data}
    except Exception as e:
        logger.error(f"Error in /api/dashboard/leads-by-tags: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Include routers
app.include_router(upload_router, prefix="/api")
app.include_router(clients_router)

# Include hybrid router if available
if HYBRID_AVAILABLE:
    app.include_router(hybrid_router, prefix="/api/hybrid", tags=["hybrid-upload"])
    logger.info("Hybrid upload routes registered at /api/hybrid")

# Import and include leads router
from leads import router as leads_router
app.include_router(leads_router)

# Import and include distribution router
from lead_distribution_api import router as distribution_router
app.include_router(distribution_router)
logger.info("Distribution routes registered at /api/distribution")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
