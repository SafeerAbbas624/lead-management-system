from fastapi import APIRouter, HTTPException, Depends, Query, Body, Response, status
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
class LeadStatusUpdate(BaseModel):
    leadstatus: str

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
            if date_field in formatted:
                if formatted[date_field] is None:
                    continue
                    
                try:
                    # If it's already a string in ISO format, ensure it's properly formatted
                    if isinstance(formatted[date_field], str):
                        # Try to parse and reformat to ensure consistency
                        dt = datetime.fromisoformat(formatted[date_field].replace('Z', '+00:00'))
                        formatted[date_field] = dt.isoformat()
                    # Handle datetime objects
                    elif hasattr(formatted[date_field], 'isoformat'):
                        formatted[date_field] = formatted[date_field].isoformat()
                except Exception as e:
                    logger.warning(f"Error formatting {date_field}: {str(e)}")
                    formatted[date_field] = None
        
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

@router.get("/", response_model=List[Dict[str, Any]])
async def get_leads(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, le=100),
    search: Optional[str] = None,
    leadstatus: Optional[str] = None,
    leadsource: Optional[str] = None,
    clientid: Optional[int] = None,
    supplierid: Optional[int] = None,
    response: Response = None
):
    # Set CORS headers
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Expose-Headers"] = "X-Total-Count, X-Page-Size, X-Current-Page, X-Total-Pages"
    
    # Initialize default values
    leads = []
    total_count = 0
    total_pages = 0
    current_page = 1
    
    try:
        # Build base query
        query = db.supabase.table('leads').select('*')
        
        # Apply filters
        if leadstatus:
            query = query.eq('leadstatus', leadstatus)
        if leadsource:
            query = query.eq('leadsource', leadsource)
        if clientid is not None:
            query = query.eq('clientid', clientid)
        if supplierid is not None:
            query = query.eq('supplierid', supplierid)
        
        # Get total count
        count_result = query.execute()
        total_count = len(count_result.data) if hasattr(count_result, 'data') else 0
        
        # Apply sorting and pagination
        query = query.order('createdat', desc=True)
        if limit > 0:
            query = query.range(skip, skip + limit - 1)
        
        # Execute query
        result = query.execute()
        leads = result.data if hasattr(result, 'data') else []
        
        # Apply search filter if search term is provided
        if search and leads:
            search_terms = search.lower().split()
            search_fields = ['firstname', 'lastname', 'email', 'phone', 'companyname', 'leadstatus', 'leadsource']
            
            def matches_search(lead):
                lead = format_lead(lead)  # Ensure consistent field access
                for term in search_terms:
                    # Phone number exact match
                    if 'phone' in lead and lead['phone'] and term in (lead['phone'] or '').replace('-', '').replace(' ', ''):
                        return True
                    # Other fields
                    for field in search_fields:
                        if field == 'phone':
                            continue
                        value = str(lead.get(field, '') or '').lower()
                        if field in ['leadstatus', 'leadsource']:
                            if term == value:
                                return True
                        elif term in value:
                            return True
                return False
            
            # Apply search filter
            leads = [lead for lead in leads if matches_search(lead)]
            total_count = len(leads)  # Update count after search
            
            # Re-apply pagination after search
            if limit > 0:
                leads = leads[skip:skip + limit]
        
        # Calculate pagination values
        total_pages = (total_count + limit - 1) // limit if limit > 0 else 1
        current_page = (skip // limit) + 1 if limit > 0 else 1
        
        # Log the results
        logger.info(f"Returning {len(leads)}/{total_count} leads (page: {current_page} of {total_pages})")
        
        # Set response headers with pagination info
        response.headers["X-Total-Count"] = str(total_count)
        response.headers["X-Page-Size"] = str(limit)
        response.headers["X-Current-Page"] = str(current_page)
        response.headers["X-Total-Pages"] = str(total_pages)
        
        # Return formatted leads
        return [format_lead(lead) for lead in leads] if leads else []
        
    except Exception as e:
        logger.error(f"Error in get_leads: {str(e)}")
        handle_supabase_error(e)
        return []  # Return empty list on error

@router.patch("/{lead_id}/status", response_model=Dict[str, Any])
async def update_lead_status(
    lead_id: int,
    status_update: LeadStatusUpdate,
    response: Response = None
):
    """
    Update a lead's status
    """
    try:
        # First check if lead exists
        existing_lead = db.supabase.table('leads').select('*').eq('id', lead_id).execute()
        if not existing_lead.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found")
        
        # Update the lead status
        updated_lead = db.supabase.table('leads')\
            .update({
                'leadstatus': status_update.leadstatus,
                'updatedat': datetime.now(timezone.utc).isoformat()
            })\
            .eq('id', lead_id)\
            .execute()
        
        if not updated_lead.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update lead status")
            
        return format_lead(updated_lead.data[0])
        
    except Exception as e:
        logger.error(f"Error updating lead status: {str(e)}")
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
        # Convert lead to dict and handle datetime serialization
        lead_data = lead.dict(exclude_unset=True)
        
        # Convert datetime to ISO format string for Supabase
        current_time = datetime.now(timezone.utc).isoformat()
        lead_data['createdat'] = current_time
        
        # Ensure metadata is properly serialized
        if 'metadata' in lead_data and lead_data['metadata'] is not None:
            if isinstance(lead_data['metadata'], dict):
                lead_data['metadata'] = json.dumps(lead_data['metadata'])
        
        logger.info(f"Inserting lead data: {lead_data}")
        
        # Insert into Supabase
        result = db.supabase.table('leads').insert(lead_data).execute()
        
        if not result.data:
            logger.error("No data returned from Supabase insert")
            raise HTTPException(status_code=400, detail="Failed to create lead")
            
        return format_lead(result.data[0])
        
    except Exception as e:
        logger.error(f"Error creating lead: {str(e)}", exc_info=True)
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
        
        # Add updated timestamp as ISO format string
        update_data['updatedat'] = datetime.now(timezone.utc).isoformat()
        
        # Ensure metadata is properly serialized if it's a dict
        if 'metadata' in update_data and isinstance(update_data['metadata'], dict):
            update_data['metadata'] = json.dumps(update_data['metadata'])
        
        # Remove fields that shouldn't be updated
        for field in ['id', 'createdat']:
            update_data.pop(field, None)
            
        logger.info(f"Update data after cleanup: {update_data}")
        
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
