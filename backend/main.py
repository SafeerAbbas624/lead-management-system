import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, Header, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field, validator
from supabase import create_client, Client as SupabaseClient
from dotenv import load_dotenv
import logging

# Import routers
from hybrid_api import router as hybrid_router
from upload_file import router as upload_router

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="Lead Management System API",
    description="Hybrid API for lead processing with Python backend and Next.js frontend",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: SupabaseClient = create_client(supabase_url, supabase_key)

# Pydantic Models
class SupplierBase(BaseModel):
    name: str
    email: EmailStr
    contactperson: Optional[str] = None
    status: str = "Active"
    leadcost: Optional[float] = None

class SupplierCreate(SupplierBase):
    pass

class Supplier(SupplierBase):
    id: int
    apikey: str
    createdat: datetime

    class Config:
        from_attributes = True

class LeadData(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    # Add other lead fields as needed

class LeadResponse(BaseModel):
    status: str
    lead_id: Optional[str] = None
    message: str
    is_duplicate: bool = False
    is_dnc: bool = False

# Utility Functions
def generate_api_key() -> str:
    """Generate a new API key for suppliers."""
    return f"sup_{uuid.uuid4().hex}"

def check_dnc(phone: str, email: str) -> bool:
    """Check if lead is in Do Not Contact list."""
    # Implement DNC check logic here
    # For now, return False (not in DNC)
    return False

def check_duplicate(lead_data: dict) -> bool:
    """Check if lead is a duplicate."""
    # Implement duplicate check logic here
    # For now, return False (not a duplicate)
    return False

# API Endpoints
@app.post("/api/suppliers/", response_model=Supplier, status_code=status.HTTP_201_CREATED)
async def create_supplier(supplier: SupplierCreate):
    """Create a new supplier with an API key."""
    try:
        # Check if supplier with email already exists
        existing = supabase.table('suppliers') \
            .select('*') \
            .eq('email', supplier.email) \
            .execute()
        
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier with this email already exists"
            )
        
        # Generate API key
        api_key = generate_api_key()
        
        # Create supplier in database
        supplier_data = supplier.dict()
        supplier_data['apikey'] = api_key
        supplier_data['createdat'] = datetime.utcnow().isoformat()
        
        result = supabase.table('suppliers').insert(supplier_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create supplier"
            )
            
        return {**supplier_data, 'id': result.data[0]['id']}
        
    except Exception as e:
        logger.error(f"Error creating supplier: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.get("/api/suppliers/", response_model=List[Supplier])
async def list_suppliers():
    """List all suppliers."""
    try:
        result = supabase.table('suppliers').select('*').execute()
        return result.data
    except Exception as e:
        logger.error(f"Error listing suppliers: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch suppliers"
        )

@app.post("/api/leads/submit/{supplier_id}", response_model=LeadResponse)
async def submit_lead(
    supplier_id: int,
    lead: LeadData,
    x_api_key: str = Header(..., description="Supplier API Key")
):
    """Submit a new lead from a supplier."""
    try:
        # Verify API key
        supplier = supabase.table('suppliers') \
            .select('*') \
            .eq('id', supplier_id) \
            .eq('apikey', x_api_key) \
            .execute()
        
        if not supplier.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key or supplier ID"
            )
        
        # Check DNC
        if check_dnc(lead.phone, lead.email):
            return LeadResponse(
                status="rejected",
                message="Lead is in Do Not Contact list",
                is_dnc=True
            )
        
        # Check for duplicates
        if check_duplicate(lead.dict()):
            return LeadResponse(
                status="rejected",
                message="Duplicate lead found",
                is_duplicate=True
            )
        
        # Save lead to database
        lead_data = lead.dict()
        lead_data['supplierid'] = supplier_id
        lead_data['leadstatus'] = 'New'
        lead_data['createdat'] = datetime.utcnow().isoformat()
        
        result = supabase.table('leads').insert(lead_data).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save lead"
            )
        
        return LeadResponse(
            status="accepted",
            lead_id=str(result.data[0]['id']),
            message="Lead submitted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting lead: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process lead"
        )

# Include routers
app.include_router(hybrid_router, prefix="/api/hybrid", tags=["hybrid-upload"])
app.include_router(upload_router, prefix="/api", tags=["upload"])

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Lead Management System API",
        "version": "2.0.0",
        "status": "running",
        "endpoints": {
            "hybrid_upload": "/api/hybrid",
            "legacy_upload": "/api",
            "docs": "/docs",
            "health": "/api/hybrid/health"
        }
    }

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "lead-management-api",
        "version": "2.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
