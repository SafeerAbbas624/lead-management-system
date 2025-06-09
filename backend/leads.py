from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, validator, Json
from datetime import datetime, timezone
import logging
import json
from database import SupabaseClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/leads", tags=["leads"])

# Initialize database client
db = SupabaseClient()

# Pydantic models
class LeadBase(BaseModel):
    email: Optional[str] = None
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    phone: Optional[str] = None
    companyname: Optional[str] = None
    taxid: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipcode: Optional[str] = None
    country: Optional[str] = None
    leadsource: Optional[str] = None
    leadstatus: Optional[str] = "new"
    leadscore: Optional[int] = 0
    leadcost: Optional[float] = 0.0
    exclusivity: Optional[bool] = False
    exclusivitynotes: Optional[str] = None
    uploadbatchid: Optional[int] = None
    clientid: Optional[int] = None
    supplierid: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = {}
    tags: Optional[List[str]] = []

    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    email: Optional[str] = None
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    phone: Optional[str] = None
    companyname: Optional[str] = None
    taxid: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipcode: Optional[str] = None
    country: Optional[str] = None
    leadsource: Optional[str] = None
    leadstatus: Optional[str] = None
    leadscore: Optional[int] = None
    leadcost: Optional[float] = None
    exclusivity: Optional[bool] = None
    exclusivitynotes: Optional[str] = None
    uploadbatchid: Optional[int] = None
    clientid: Optional[int] = None
    supplierid: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None

class LeadInDB(LeadBase):
    id: int
    createdat: datetime
    updatedat: Optional[datetime] = None

    class Config:
        from_attributes = True
        populate_by_name = True

# Helper functions
def handle_supabase_error(e: Exception):
    logger.error(f"Supabase error: {str(e)}")
    raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def format_lead(lead_data: Dict) -> Dict:
    """Format lead data from database to API response"""
    if not lead_data:
        return None
    
    try:
        # Create a copy to avoid modifying the original
        formatted = dict(lead_data)
        
        # Handle datetime fields
        for date_field in ['createdat', 'updatedat']:
            if date_field in formatted and formatted[date_field]:
                if isinstance(formatted[date_field], str):
                    try:
                        # Try to parse the string to datetime and back to ISO format
                        dt = datetime.fromisoformat(formatted[date_field].replace('Z', '+00:00'))
                        formatted[date_field] = dt.isoformat()
                    except (ValueError, AttributeError):
                        formatted[date_field] = None
                elif hasattr(formatted[date_field], 'isoformat'):
                    # Handle datetime objects
                    formatted[date_field] = formatted[date_field].isoformat()
        
        # Ensure metadata is a dict
        if 'metadata' in formatted:
            if isinstance(formatted['metadata'], str):
                try:
                    formatted['metadata'] = json.loads(formatted['metadata'])
                except (json.JSONDecodeError, TypeError, AttributeError):
                    formatted['metadata'] = {}
            elif formatted['metadata'] is None:
                formatted['metadata'] = {}
        
        # Ensure tags is a list
        if 'tags' in formatted and not isinstance(formatted['tags'], list):
            formatted['tags'] = []
        
        # Convert numeric fields to appropriate types
        for num_field in ['leadscore', 'leadcost', 'id', 'clientid', 'supplierid', 'uploadbatchid']:
            if num_field in formatted and formatted[num_field] is not None:
                try:
                    if num_field in ['leadcost']:
                        formatted[num_field] = float(formatted[num_field])
                    else:
                        formatted[num_field] = int(formatted[num_field])
                except (ValueError, TypeError):
                    formatted[num_field] = None
        
        # Convert boolean fields
        for bool_field in ['exclusivity']:
            if bool_field in formatted:
                formatted[bool_field] = bool(formatted[bool_field]) if formatted[bool_field] is not None else False
        
        return formatted
    except Exception as e:
        logger.error(f"Error formatting lead data: {str(e)}\nOriginal data: {lead_data}", exc_info=True)
        # Return a minimal safe representation if formatting fails
        return {
            'id': lead_data.get('id'),
            'email': lead_data.get('email'),
            'firstname': lead_data.get('firstname'),
            'lastname': lead_data.get('lastname'),
            'error': f"Error formatting lead data: {str(e)}"
        }

# API Endpoints
@router.get("/", response_model=List[Dict[str, Any]])
async def get_leads(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, le=100),
    search: Optional[str] = None,
    leadstatus: Optional[str] = None,
    leadsource: Optional[str] = None,
    clientid: Optional[int] = None,
    supplierid: Optional[int] = None
):
    """
    Get a list of leads with optional filtering and pagination
    """
    try:
        query = db.supabase.table('leads').select('*')
        
        # Apply filters
        if search:
            search_terms = search.split()
            for term in search_terms:
                query = query.or_(f"email.ilike.%{term}%,firstname.ilike.%{term}%,lastname.ilike.%{term}%,companyname.ilike.%{term}%")
        
        if leadstatus:
            query = query.eq('leadstatus', leadstatus)
        if leadsource:
            query = query.eq('leadsource', leadsource)
        if clientid:
            query = query.eq('clientid', clientid)
        if supplierid:
            query = query.eq('supplierid', supplierid)
        
        # Apply pagination
        query = query.range(skip, skip + limit - 1)
        
        # Order by most recent first
        query = query.order('createdat', desc=True)
        
        result = query.execute()
        return [format_lead(lead) for lead in result.data if lead]
        
    except Exception as e:
        handle_supabase_error(e)

@router.get("/{lead_id}", response_model=Dict[str, Any])
async def get_lead(lead_id: int):
    """
    Get a single lead by ID
    """
    try:
        result = db.supabase.table('leads').select('*').eq('id', lead_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        return format_lead(result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        handle_supabase_error(e)

@router.post("/", response_model=Dict[str, Any], status_code=201)
async def create_lead(lead: LeadCreate):
    """
    Create a new lead
    """
    try:
        lead_data = lead.dict(exclude_unset=True)
        lead_data['createdat'] = datetime.now(timezone.utc)
        
        result = db.supabase.table('leads').insert(lead_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to create lead")
            
        return format_lead(result.data[0])
        
    except Exception as e:
        handle_supabase_error(e)

@router.put("/{lead_id}", response_model=Dict[str, Any])
async def update_lead(lead_id: int, lead_update: Union[Dict[str, Any], LeadUpdate]):
    """
    Update an existing lead
    
    Accepts either a LeadUpdate model or a raw dictionary
    """
    try:
        logger.info(f"\n{'='*50}")
        logger.info(f"=== Starting update for lead {lead_id} ===")
        logger.info(f"Request data type: {type(lead_update)}")
        logger.info(f"Request data: {lead_update}")
        
        # Handle both Pydantic model and raw dict
        if isinstance(lead_update, dict):
            update_data = lead_update.copy()
            logger.warning(f"Received raw dict input: {update_data}")
        else:
            update_data = lead_update.dict(exclude_unset=True)
        
        logger.info(f"Initial update data: {update_data}")
        
        # First check if lead exists
        logger.info("Checking if lead exists...")
        existing = db.supabase.table('leads').select('*').eq('id', lead_id).execute()
        if not existing.data:
            error_msg = f"Lead {lead_id} not found in database"
            logger.error(error_msg)
            raise HTTPException(status_code=404, detail=error_msg)
        
        logger.info(f"Found existing lead: {existing.data[0]}")
        
        # Clean up the update data - remove None values but keep empty strings and False
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        logger.info(f"After removing None values: {update_data}")
        
        # Special handling for metadata - ensure it's JSON serializable
        if 'metadata' in update_data and update_data['metadata'] is not None:
            logger.info(f"Processing metadata: {update_data['metadata']}")
            if isinstance(update_data['metadata'], str):
                try:
                    # If it's a string, try to parse it as JSON
                    update_data['metadata'] = json.loads(update_data['metadata'])
                    logger.info(f"Parsed metadata JSON: {update_data['metadata']}")
                except json.JSONDecodeError as je:
                    logger.warning(f"Could not parse metadata as JSON, keeping as string. Error: {str(je)}")
                    # If it's not valid JSON, keep it as is
                    pass
        
        # Convert boolean strings to actual booleans
        for field in ['exclusivity']:
            if field in update_data and isinstance(update_data[field], str):
                if update_data[field].lower() in ('true', '1', 'yes'):
                    update_data[field] = True
                elif update_data[field].lower() in ('false', '0', 'no', ''):
                    update_data[field] = False
        
        # Convert numeric strings to numbers
        for field in ['leadscore', 'leadcost', 'clientid', 'supplierid', 'uploadbatchid']:
            if field in update_data and isinstance(update_data[field], str):
                try:
                    if '.' in update_data[field]:
                        update_data[field] = float(update_data[field])
                    else:
                        update_data[field] = int(update_data[field])
                except (ValueError, TypeError):
                    pass  # Keep as string if conversion fails
        
        # Add updated timestamp
        update_data['updatedat'] = datetime.now(timezone.utc).isoformat()
        
        # Remove fields that shouldn't be updated
        for field in ['id', 'createdat']:
            update_data.pop(field, None)
        
        logger.info(f"Final update data after processing: {update_data}")
        
        # Perform the update
        logger.info("\n=== Executing database update ===")
        logger.info(f"Table: leads")
        logger.info(f"Update data: {json.dumps(update_data, default=str, indent=2)}")
        logger.info(f"Where: id = {lead_id}")
        
        try:
            # Get the Supabase client
            if not db.supabase:
                error_msg = "Database connection not available"
                logger.error(error_msg)
                raise HTTPException(status_code=500, detail=error_msg)
            
            # Build the query
            table = db.supabase.table('leads')
            
            # Log the operation
            logger.info(f"Executing update: leads.id = {lead_id}")
            
            # Execute the update using safe_execute
            result = db.safe_execute(
                table.update(update_data).eq('id', lead_id).execute
            )
            
            logger.info(f"Update executed. Checking result...")
            
            # Check if the update was successful
            if result is None:
                error_msg = "Failed to execute update query"
                logger.error(error_msg)
                raise HTTPException(status_code=500, detail=error_msg)
                
            # Log the raw result for debugging
            logger.info(f"Raw update result: {result}")
            
            # Check if we have data in the result
            if not hasattr(result, 'data') or not result.data:
                # In Supabase, an update might return an empty list if successful but no rows were actually changed
                logger.warning("No data in update result. This might be expected if no rows were changed.")
                
                # Let's fetch the current state to verify
                logger.info("Fetching current lead state to verify update...")
                current = db.safe_execute(
                    table.select('*').eq('id', lead_id).execute
                )
                
                if current and hasattr(current, 'data') and current.data:
                    logger.info("Successfully verified lead exists after update")
                    return format_lead(current.data[0])
                else:
                    error_msg = "Update appeared to succeed but could not verify changes"
                    logger.error(error_msg)
                    raise HTTPException(status_code=500, detail=error_msg)
            
            logger.info(f"Successfully updated lead {lead_id}.")
            logger.info(f"Update result data: {json.dumps(result.data, default=str, indent=2)}")
            
        except HTTPException:
            raise  # Re-raise HTTP exceptions
            
        except Exception as db_error:
            error_msg = f"Database error during update: {str(db_error)}"
            logger.error(error_msg, exc_info=True)
            
            # Try to get more details about the error
            error_details = str(db_error)
            if hasattr(db_error, 'details'):
                error_details = db_error.details
            elif hasattr(db_error, 'message'):
                error_details = db_error.message
                
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Failed to update lead",
                    "details": error_details,
                    "lead_id": lead_id,
                    "operation": "update"
                }
            ) from db_error
        
        # Fetch the updated lead to ensure we return complete data
        updated_lead = db.supabase.table('leads').select('*').eq('id', lead_id).execute()
        if not updated_lead.data:
            logger.warning(f"Could not fetch updated lead {lead_id} after update")
            return format_lead(result.data[0] if result.data else {})
            
        return format_lead(updated_lead.data[0])
        
    except HTTPException as he:
        logger.error(f"HTTP error updating lead {lead_id}: {str(he)}")
        raise
    except json.JSONDecodeError as je:
        error_msg = f"Invalid JSON in metadata: {str(je)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        error_msg = f"Unexpected error updating lead {lead_id}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail={
                "error": "Failed to update lead",
                "details": str(e),
                "lead_id": lead_id,
                "received_data": str(lead_update)[:500]  # Include first 500 chars of input
            }
        )

@router.delete("/{lead_id}", status_code=204)
async def delete_lead(lead_id: int):
    """
    Delete a lead
    """
    try:
        # First check if lead exists
        existing = db.supabase.table('leads').select('*').eq('id', lead_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        db.supabase.table('leads').delete().eq('id', lead_id).execute()
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        handle_supabase_error(e)
