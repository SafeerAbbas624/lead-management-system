from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/clients", tags=["clients"])

# Initialize Supabase client with mock data if credentials not found
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Mock data for development
mock_clients = [
    {
        "id": 1,
        "name": "Test Client",
        "email": "test@example.com",
        "phone": "+1234567890",
        "contactperson": "John Doe",
        "deliveryformat": "CSV",
        "deliveryschedule": "Daily",
        "percentallocation": 50,
        "fixedallocation": 100,
        "exclusivitysettings": {},
        "isactive": True,
        "createdat": "2023-01-01T00:00:00"
    }
]

# Only initialize Supabase client if credentials are available
if url and key:
    supabase: Client = create_client(url, key)
    use_mock_data = False
else:
    import logging
    logging.warning("Supabase credentials not found. Using mock data.")
    use_mock_data = True

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
):
    query = supabase.table("clients").select("*")
    
    if search:
        query = query.or_(f"name.ilike.%{search}%,email.ilike.%{search}%,contactperson.ilike.%{search}%")
    
    if is_active is not None:
        query = query.eq("isactive", is_active)
    
    query = query.range(skip, skip + limit - 1)
    
    try:
        result = query.execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{client_id}", response_model=ClientInDB)
async def get_client(client_id: int):
    try:
        result = supabase.table("clients").select("*").eq("id", client_id).single().execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="Client not found")

@router.post("/", response_model=ClientInDB, status_code=201)
async def create_client(client: ClientCreate):
    try:
        client_data = client.dict(exclude_unset=True, by_alias=True)
        result = supabase.table("clients").insert(client_data).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{client_id}", response_model=ClientInDB)
async def update_client(client_id: int, client: ClientUpdate):
    try:
        update_data = client.dict(exclude_unset=True, exclude_none=True, by_alias=True)
        result = supabase.table("clients").update(update_data).eq("id", client_id).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{client_id}", status_code=204)
async def delete_client(client_id: int):
    try:
        supabase.table("clients").delete().eq("id", client_id).execute()
        return None
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
