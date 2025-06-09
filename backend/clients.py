from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/clients", tags=["clients"])

# Initialize Supabase client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

class ClientBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    contact_person: Optional[str] = Field(alias="contactperson", default=None)
    delivery_format: Optional[str] = Field(alias="deliveryformat", default=None)
    delivery_schedule: Optional[str] = Field(alias="deliveryschedule", default=None)
    percent_allocation: Optional[int] = Field(alias="percentallocation", default=None)
    fixed_allocation: Optional[int] = Field(alias="fixedallocation", default=None)
    exclusivity_settings: Optional[dict] = Field(alias="exclusivitysettings", default=None)
    is_active: bool = Field(alias="isactive", default=True)

class ClientCreate(ClientBase):
    pass

class ClientUpdate(ClientBase):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None

class ClientInDB(ClientBase):
    id: int
    created_at: datetime = Field(alias="createdat")
    
    class Config:
        from_attributes = True
        populate_by_name = True

@router.get("/", response_model=List[ClientInDB])
async def get_clients(
    skip: int = 0,
    limit: int = 10,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    sort_by: str = "createdat",
    sort_order: str = "desc"
):
    query = supabase.table("clients").select("*")
    
    # Apply filters
    if search:
        query = query.or_(f"name.ilike.%{search}%,email.ilike.%{search}%,contactperson.ilike.%{search}%")
    
    if is_active is not None:
        query = query.eq("isactive", is_active)
    
    # Apply sorting
    if sort_order.lower() == "desc":
        query = query.order(sort_by, desc=True)
    else:
        query = query.order(sort_by)
    
    # Apply pagination
    query = query.range(skip, skip + limit - 1)
    
    try:
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{client_id}", response_model=ClientInDB)
async def get_client(client_id: int):
    try:
        response = supabase.table("clients").select("*").eq("id", client_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Client not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=ClientInDB, status_code=201)
async def create_client(client: ClientCreate):
    try:
        # Check if client with email already exists
        existing = supabase.table("clients").select("id").eq("email", client.email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Client with this email already exists")
        
        # Prepare data for insertion
        client_data = client.dict(exclude_unset=True, by_alias=True)
        client_data["createdat"] = datetime.utcnow().isoformat()
        
        # Insert new client
        response = supabase.table("clients").insert(client_data).execute()
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{client_id}", response_model=ClientInDB)
async def update_client(client_id: int, client: ClientUpdate):
    try:
        # Check if client exists
        existing = supabase.table("clients").select("id").eq("id", client_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Client not found")
        
        # Update client
        client_data = client.dict(exclude_unset=True, exclude_none=True, by_alias=True)
        response = supabase.table("clients").update(client_data).eq("id", client_id).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{client_id}", status_code=204)
async def delete_client(client_id: int):
    try:
        # Check if client exists
        existing = supabase.table("clients").select("id").eq("id", client_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Client not found")
        
        # Soft delete by setting is_active to false
        supabase.table("clients").update({"isactive": False}).eq("id", client_id).execute()
        return None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
