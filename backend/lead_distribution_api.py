"""
Lead Distribution API
Handles lead distribution, client history checking, blending, and CSV export
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import pandas as pd
import io
import csv
from datetime import datetime, timezone
import logging
import random
from database import SupabaseClient

# Try to import email service, but don't fail if it's not available
try:
    from email_service import EmailService
    EMAIL_SERVICE_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Email service not available: {e}")
    EMAIL_SERVICE_AVAILABLE = False

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/distribution", tags=["distribution"])

# Pydantic Models
class BatchSelection(BaseModel):
    batch_id: int
    percentage: float
    source_name: Optional[str] = None

class DistributionRequest(BaseModel):
    batches: List[BatchSelection]
    client_ids: List[int]
    selling_price_per_sheet: float
    blend_enabled: bool = False
    distribution_name: Optional[str] = None

class DistributionResponse(BaseModel):
    success: bool
    distribution_id: int
    total_leads_distributed: int
    csv_filename: str
    message: str

@router.get("/batches")
async def get_available_batches():
    """Get all available upload batches for distribution"""
    try:
        db_client = SupabaseClient()
        supabase = db_client.supabase
        
        # Get batches with lead counts and supplier info
        response = supabase.table('upload_batches').select(
            'id, filename, sourcename, supplierid, cleanedleads, createdat, completedat, suppliers(name)'
        ).eq('status', 'Completed').order('createdat', desc=True).execute()
        
        batches = []
        for batch in response.data:
            # Get actual lead count from leads table
            lead_count_response = supabase.table('leads').select(
                'id', count='exact'
            ).eq('uploadbatchid', batch['id']).execute()
            
            batches.append({
                'id': batch['id'],
                'filename': batch['filename'],
                'source_name': batch['sourcename'],
                'supplier_name': batch['suppliers']['name'] if batch['suppliers'] else 'Unknown',
                'total_leads': lead_count_response.count,
                'cleaned_leads': batch['cleanedleads'],
                'created_at': batch['createdat'],
                'completed_at': batch['completedat']
            })
        
        return {
            'success': True,
            'batches': batches
        }
        
    except Exception as e:
        logger.error(f"Error fetching batches: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/clients")
async def get_available_clients():
    """Get all active clients for distribution"""
    try:
        db_client = SupabaseClient()
        supabase = db_client.supabase
        
        response = supabase.table('clients').select(
            'id, name, email, contactperson, deliveryformat'
        ).eq('isactive', True).order('name').execute()
        
        return {
            'success': True,
            'clients': response.data
        }
        
    except Exception as e:
        logger.error(f"Error fetching clients: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/check-client-history")
async def check_client_history(request: dict):
    """Check if leads have been previously distributed to specific clients"""
    try:
        db_client = SupabaseClient()
        supabase = db_client.supabase
        client_ids = request.get('client_ids', [])
        lead_ids = request.get('lead_ids', [])
        
        if not client_ids or not lead_ids:
            return {'success': True, 'conflicts': []}
        
        # Check for existing distributions
        response = supabase.table('clients_history').select(
            'lead_id, client_id, email, phone, distributed_at'
        ).in_('client_id', client_ids).in_('lead_id', lead_ids).execute()
        
        conflicts = []
        for record in response.data:
            conflicts.append({
                'lead_id': record['lead_id'],
                'client_id': record['client_id'],
                'email': record['email'],
                'phone': record['phone'],
                'previously_distributed_at': record['distributed_at']
            })
        
        return {
            'success': True,
            'conflicts': conflicts,
            'conflict_count': len(conflicts)
        }
        
    except Exception as e:
        logger.error(f"Error checking client history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def select_leads_from_batch(supabase, batch_id: int, percentage: float) -> List[Dict]:
    """Select specified percentage of leads from a batch"""
    try:
        # Get all leads from the batch
        response = supabase.table('leads').select(
            'id, firstname, lastname, email, phone, companyname, taxid, '
            'address, city, state, zipcode, country, uploadbatchid, supplierid'
        ).eq('uploadbatchid', batch_id).execute()
        
        all_leads = response.data
        if not all_leads:
            return []
        
        # Calculate number of leads to select
        total_leads = len(all_leads)
        leads_to_select = max(1, int(total_leads * (percentage / 100)))
        
        # Randomly select leads
        selected_leads = random.sample(all_leads, min(leads_to_select, total_leads))
        
        logger.info(f"Selected {len(selected_leads)} leads from batch {batch_id} ({percentage}%)")
        return selected_leads
        
    except Exception as e:
        logger.error(f"Error selecting leads from batch {batch_id}: {str(e)}")
        return []

def blend_leads(lead_lists: List[List[Dict]]) -> List[Dict]:
    """Blend multiple lists of leads together randomly"""
    try:
        all_leads = []
        for lead_list in lead_lists:
            all_leads.extend(lead_list)
        
        # Remove duplicates based on email and phone
        seen = set()
        unique_leads = []
        for lead in all_leads:
            identifier = (lead.get('email', '').lower(), lead.get('phone', ''))
            if identifier not in seen:
                seen.add(identifier)
                unique_leads.append(lead)
        
        # Shuffle for blending
        random.shuffle(unique_leads)
        
        logger.info(f"Blended {len(all_leads)} leads into {len(unique_leads)} unique leads")
        return unique_leads
        
    except Exception as e:
        logger.error(f"Error blending leads: {str(e)}")
        return []

@router.post("/distribute", response_model=DistributionResponse)
async def distribute_leads(request: DistributionRequest):
    """Main distribution endpoint - processes batches, checks history, and exports CSV"""
    try:
        logger.info(f"Distribution request received: {request}")
        db_client = SupabaseClient()
        supabase = db_client.supabase
        
        # Step 1: Select leads from batches
        selected_lead_lists = []
        batch_info = []
        
        for batch_selection in request.batches:
            leads = select_leads_from_batch(
                supabase, 
                batch_selection.batch_id, 
                batch_selection.percentage
            )
            if leads:
                selected_lead_lists.append(leads)
                batch_info.append({
                    'batch_id': batch_selection.batch_id,
                    'percentage': batch_selection.percentage,
                    'lead_count': len(leads)
                })
        
        if not selected_lead_lists:
            raise HTTPException(status_code=400, detail="No leads selected from batches")
        
        # Step 2: Blend leads if requested
        if request.blend_enabled:
            final_leads = blend_leads(selected_lead_lists)
        else:
            final_leads = []
            for lead_list in selected_lead_lists:
                final_leads.extend(lead_list)
        
        # Step 3: Check client history for conflicts
        lead_ids = [lead['id'] for lead in final_leads]
        history_check = await check_client_history({
            'client_ids': request.client_ids,
            'lead_ids': lead_ids
        })
        
        # Filter out conflicting leads
        conflicting_lead_ids = {conflict['lead_id'] for conflict in history_check['conflicts']}
        clean_leads = [lead for lead in final_leads if lead['id'] not in conflicting_lead_ids]

        logger.info(f"Lead filtering results: {len(final_leads)} total leads, {len(conflicting_lead_ids)} conflicts, {len(clean_leads)} clean leads")

        if not clean_leads:
            # Get client names for better error message
            client_names = []
            for client_id in request.client_ids:
                client_response = supabase.table('clients').select('name').eq('id', client_id).single().execute()
                if client_response.data:
                    client_names.append(client_response.data['name'])

            client_list = ', '.join(client_names) if client_names else 'selected clients'

            error_message = f"All {len(final_leads)} selected leads have been previously distributed to {client_list}. Please select different leads or clients to avoid duplicates."
            logger.error(f"Duplicate leads error: {error_message}")
            raise HTTPException(
                status_code=400,
                detail=error_message
            )
        
        # Step 4: Create distribution record
        logger.info(f"Creating distribution record for {len(clean_leads)} leads")
        # Calculate per-lead cost from sheet price
        per_lead_cost = request.selling_price_per_sheet / len(clean_leads) if len(clean_leads) > 0 else 0

        distribution_data = {
            'distribution_name': request.distribution_name or f"Distribution {datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'leadsallocated': len(clean_leads),
            'selling_price_per_sheet': request.selling_price_per_sheet,
            'selling_price_per_lead': per_lead_cost,
            'blend_enabled': request.blend_enabled,
            'batch_percentages': [
                {'batch_id': b['batch_id'], 'percentage': b['percentage'], 'lead_count': b['lead_count']}
                for b in batch_info
            ],
            'deliverystatus': 'Completed',
            'createdat': datetime.now(timezone.utc).isoformat(),
            'exported_at': datetime.now(timezone.utc).isoformat()
        }

        logger.info(f"Inserting distribution data: {distribution_data}")
        distribution_response = supabase.table('lead_distributions').insert(distribution_data).execute()
        distribution_id = distribution_response.data[0]['id']
        logger.info(f"Created distribution with ID: {distribution_id}")
        
        # Step 5: Update clients_history for each client
        logger.info(f"Updating clients_history for {len(request.client_ids)} clients")
        for client_id in request.client_ids:
            logger.info(f"Processing client_id: {client_id}")
            history_records = []
            for lead in clean_leads:
                # Get source name from the batch selection
                source_name = None
                for batch_selection in request.batches:
                    if batch_selection.batch_id == lead.get('uploadbatchid'):
                        source_name = batch_selection.source_name
                        break

                history_record = {
                    'client_id': client_id,
                    'distribution_id': distribution_id,
                    'lead_id': lead['id'],
                    'firstname': lead.get('firstname'),
                    'lastname': lead.get('lastname'),
                    'email': lead.get('email'),
                    'phone': lead.get('phone'),
                    'companyname': lead.get('companyname'),
                    'taxid': lead.get('taxid'),
                    'address': lead.get('address'),
                    'city': lead.get('city'),
                    'state': lead.get('state'),
                    'zipcode': lead.get('zipcode'),
                    'country': lead.get('country'),
                    'selling_cost': per_lead_cost,
                    'source_batch_id': lead.get('uploadbatchid'),
                    'source_supplier_id': lead.get('supplierid'),
                    'source_name': source_name,
                    'distributed_at': datetime.now(timezone.utc).isoformat()
                }
                history_records.append(history_record)
            
            # Insert in batches to avoid size limits
            logger.info(f"Inserting {len(history_records)} history records for client {client_id}")
            batch_size = 100
            for i in range(0, len(history_records), batch_size):
                batch = history_records[i:i + batch_size]
                logger.info(f"Inserting batch {i//batch_size + 1} with {len(batch)} records")
                supabase.table('clients_history').insert(batch).execute()
                logger.info(f"Successfully inserted batch {i//batch_size + 1}")
        
        # Step 6: Generate CSV filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        csv_filename = f"lead_distribution_{distribution_id}_{timestamp}.csv"
        
        # Update distribution with filename
        supabase.table('lead_distributions').update({
            'exported_filename': csv_filename
        }).eq('id', distribution_id).execute()
        
        return DistributionResponse(
            success=True,
            distribution_id=distribution_id,
            total_leads_distributed=len(clean_leads),
            csv_filename=csv_filename,
            message=f"Successfully distributed {len(clean_leads)} leads to {len(request.client_ids)} client(s). "
                   f"Filtered out {len(conflicting_lead_ids)} previously distributed leads."
        )

    except HTTPException as he:
        # Re-raise HTTPException as-is (these are intentional errors like duplicate leads)
        logger.error(f"HTTPException in lead distribution: {he.detail}")
        raise he
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"Unexpected error in lead distribution: {str(e)}")
        logger.error(f"Full traceback: {error_details}")
        raise HTTPException(status_code=500, detail=f"Distribution failed: {str(e)}")

@router.get("/export-csv/{distribution_id}")
async def export_distribution_csv(distribution_id: int):
    """Export distribution as CSV file"""
    try:
        db_client = SupabaseClient()
        supabase = db_client.supabase

        # Get distribution info
        dist_response = supabase.table('lead_distributions').select(
            'id, distribution_name, exported_filename, createdat'
        ).eq('id', distribution_id).single().execute()

        if not dist_response.data:
            raise HTTPException(status_code=404, detail="Distribution not found")

        # Get leads from clients_history
        history_response = supabase.table('clients_history').select(
            'firstname, lastname, email, phone, companyname, taxid, '
            'address, city, state, zipcode, country'
        ).eq('distribution_id', distribution_id).execute()

        if not history_response.data:
            raise HTTPException(status_code=404, detail="No leads found for this distribution")

        # Create CSV content
        output = io.StringIO()
        fieldnames = [
            's.no', 'firstname', 'lastname', 'email', 'phone', 'companyname',
            'taxid', 'address', 'city', 'state', 'zipcode', 'country'
        ]

        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()

        for idx, lead in enumerate(history_response.data, 1):
            row = {
                's.no': idx,
                'firstname': lead.get('firstname', ''),
                'lastname': lead.get('lastname', ''),
                'email': lead.get('email', ''),
                'phone': lead.get('phone', ''),
                'companyname': lead.get('companyname', ''),
                'taxid': lead.get('taxid', ''),
                'address': lead.get('address', ''),
                'city': lead.get('city', ''),
                'state': lead.get('state', ''),
                'zipcode': lead.get('zipcode', ''),
                'country': lead.get('country', '')
            }
            writer.writerow(row)

        csv_content = output.getvalue()
        output.close()

        # Return CSV as downloadable response
        from fastapi.responses import Response

        filename = dist_response.data['exported_filename'] or f"distribution_{distribution_id}.csv"

        return Response(
            content=csv_content,
            media_type='text/csv',
            headers={
                'Content-Disposition': f'attachment; filename="{filename}"'
            }
        )

    except Exception as e:
        logger.error(f"Error exporting CSV: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_distribution_history(skip: int = 0, limit: int = 50):
    """Get distribution history with pagination"""
    try:
        db_client = SupabaseClient()
        supabase = db_client.supabase

        # Get distributions with client info
        response = supabase.table('lead_distributions').select(
            'id, distribution_name, leadsallocated, selling_price_per_sheet, selling_price_per_lead, '
            'blend_enabled, batch_percentages, exported_filename, createdat, exported_at'
        ).order('createdat', desc=True).range(skip, skip + limit - 1).execute()

        distributions = []
        for dist in response.data:
            # Get client names for this distribution
            client_response = supabase.table('clients_history').select(
                'client_id, clients(name)'
            ).eq('distribution_id', dist['id']).execute()

            client_names = list(set([
                record['clients']['name'] for record in client_response.data
                if record['clients']
            ]))

            # Get batch info
            batch_info = dist.get('batch_percentages', [])
            batch_details = []
            for batch in batch_info:
                batch_response = supabase.table('upload_batches').select(
                    'filename, sourcename'
                ).eq('id', batch['batch_id']).single().execute()

                if batch_response.data:
                    batch_details.append({
                        'batch_id': batch['batch_id'],
                        'filename': batch_response.data['filename'],
                        'source_name': batch_response.data['sourcename'],
                        'percentage': batch['percentage'],
                        'lead_count': batch['lead_count']
                    })

            distributions.append({
                'id': dist['id'],
                'distribution_name': dist['distribution_name'],
                'total_leads': dist['leadsallocated'],
                'total_cost': dist['selling_price_per_sheet'],  # Keep total_cost for backward compatibility
                'selling_price_per_sheet': dist['selling_price_per_sheet'],
                'price_per_lead': dist['selling_price_per_lead'],
                'blend_enabled': dist['blend_enabled'],
                'client_names': client_names,
                'batch_details': batch_details,
                'exported_filename': dist['exported_filename'],
                'created_at': dist['createdat'],
                'exported_at': dist['exported_at']
            })

        return {
            'success': True,
            'distributions': distributions,
            'total_count': len(distributions)
        }

    except Exception as e:
        logger.error(f"Error fetching distribution history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Email sending models
class EmailDistributionRequest(BaseModel):
    distribution_id: int
    client_emails: List[str]
    distribution_name: Optional[str] = None


@router.post("/send-email")
async def send_distribution_email(request: EmailDistributionRequest):
    """Send distribution CSV file to client emails via SendGrid"""
    try:
        db_client = SupabaseClient()
        supabase = db_client.supabase

        # Get distribution info
        dist_response = supabase.table('lead_distributions').select(
            'id, distribution_name, exported_filename, createdat'
        ).eq('id', request.distribution_id).single().execute()

        if not dist_response.data:
            raise HTTPException(status_code=404, detail="Distribution not found")

        # Get leads from clients_history for CSV generation
        history_response = supabase.table('clients_history').select(
            'firstname, lastname, email, phone, companyname, taxid, '
            'address, city, state, zipcode, country'
        ).eq('distribution_id', request.distribution_id).execute()

        if not history_response.data:
            raise HTTPException(status_code=404, detail="No leads found for this distribution")

        # Generate CSV content
        output = io.StringIO()
        fieldnames = [
            's.no', 'firstname', 'lastname', 'email', 'phone', 'companyname',
            'taxid', 'address', 'city', 'state', 'zipcode', 'country'
        ]

        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()

        for idx, lead in enumerate(history_response.data, 1):
            row = {
                's.no': idx,
                'firstname': lead.get('firstname', ''),
                'lastname': lead.get('lastname', ''),
                'email': lead.get('email', ''),
                'phone': lead.get('phone', ''),
                'companyname': lead.get('companyname', ''),
                'taxid': lead.get('taxid', ''),
                'address': lead.get('address', ''),
                'city': lead.get('city', ''),
                'state': lead.get('state', ''),
                'zipcode': lead.get('zipcode', ''),
                'country': lead.get('country', '')
            }
            writer.writerow(row)

        csv_content = output.getvalue()
        output.close()

        # Prepare filename
        filename = dist_response.data['exported_filename'] or f"distribution_{request.distribution_id}.csv"
        distribution_name = request.distribution_name or dist_response.data.get('distribution_name')

        # Initialize email service and send emails
        if not EMAIL_SERVICE_AVAILABLE:
            raise HTTPException(status_code=500, detail="Email service is not available. Please check SendGrid configuration.")

        email_service = EmailService()
        result = email_service.send_distribution_email(
            client_emails=request.client_emails,
            csv_content=csv_content,
            filename=filename,
            distribution_name=distribution_name,
            distribution_id=request.distribution_id
        )

        # Log the email sending activity
        logger.info(f"Distribution {request.distribution_id} emailed to {len(request.client_emails)} clients")

        return result

    except Exception as e:
        logger.error(f"Error sending distribution email: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/test-email")
async def test_email_service():
    """Test SendGrid email service connection"""
    try:
        if not EMAIL_SERVICE_AVAILABLE:
            return {
                'success': False,
                'message': 'Email service is not available. Please check SendGrid configuration and dependencies.'
            }

        email_service = EmailService()
        result = email_service.test_connection()
        return result
    except Exception as e:
        logger.error(f"Error testing email service: {str(e)}")
        return {
            'success': False,
            'message': f'Email service test failed: {str(e)}'
        }
