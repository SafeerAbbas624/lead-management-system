from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Optional, Any
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime, timezone
from supabase import create_client, Client
import os
import json
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
        # Return the data in the expected format
        return response.data if response.data else []
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
        
        # Get current timestamp in PostgreSQL compatible format
        current_time = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S.%f+00')
        
        # Prepare data for insertion with exact database column names
        client_data = {
            'name': client.name,
            'email': client.email,
            'phone': client.phone if client.phone is not None else None,
            'contactperson': client.contact_person if client.contact_person is not None else None,
            'deliveryformat': client.delivery_format if client.delivery_format is not None else None,
            'deliveryschedule': client.delivery_schedule if client.delivery_schedule is not None else None,
            'percentallocation': int(client.percent_allocation) if client.percent_allocation is not None else None,
            'fixedallocation': int(client.fixed_allocation) if client.fixed_allocation is not None else None,
            'exclusivitysettings': client.exclusivity_settings if client.exclusivity_settings is not None else {},
            'isactive': bool(client.is_active) if client.is_active is not None else True,
            'createdat': current_time  # Explicitly set the timestamp
        }
        
        # Remove None values for nullable fields
        client_data = {k: v for k, v in client_data.items() if v is not None or k in ['phone', 'contactperson', 'deliveryformat', 'deliveryschedule', 'percentallocation', 'fixedallocation', 'exclusivitysettings']}
        
        print("Inserting client data:", client_data)  # Debug log
        
        try:
            # For debugging, print the exact data being sent
            print("Final data being inserted:", client_data)
            
            # Convert the data to a format suitable for Supabase
            insert_data = {k: v for k, v in client_data.items() if v is not None}
            
            # Add the createdat field with current timestamp
            insert_data['createdat'] = 'now()'
            
            print("Inserting data:", insert_data)
            
            # Use the Supabase client to insert the data
            response = supabase.table('clients').insert(insert_data).execute()
            
            print("Supabase response:", response)
            
            if not response.data:
                error_msg = "No data returned from Supabase"
                if hasattr(response, 'error') and response.error:
                    error_msg = str(response.error)
                print(f"Supabase error: {error_msg}")
                raise Exception(error_msg)
                
            # Return the inserted data
            return response.data[0] if isinstance(response.data, list) else response.data
            
        except Exception as e:
            print(f"Error in create_client: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            print(f"Error args: {e.args}")
            
            # Try to get more detailed error information
            import traceback
            traceback.print_exc()
            
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create client: {str(e)}"
            )
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

@router.post("/bulk", response_model=List[ClientInDB], status_code=201)
async def create_clients_bulk(clients: List[ClientCreate]):
    try:
        if not clients:
            raise HTTPException(status_code=400, detail="No clients provided")
        
        # Prepare data for insertion
        clients_data = []
        for client in clients:
            # Check if client with email already exists
            existing = supabase.table("clients").select("id").eq("email", client.email).execute()
            if existing.data:
                continue  # Skip existing emails
                
            client_data = client.dict(exclude_unset=True, by_alias=True)
            client_data["createdat"] = datetime.utcnow().isoformat()
            clients_data.append(client_data)
        
        if not clients_data:
            raise HTTPException(status_code=400, detail="All clients already exist")
        
        # Insert new clients in batches
        BATCH_SIZE = 50
        results = []
        for i in range(0, len(clients_data), BATCH_SIZE):
            batch = clients_data[i:i+BATCH_SIZE]
            response = supabase.table("clients").insert(batch).execute()
            results.extend(response.data)
        
        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create clients: {str(e)}")
