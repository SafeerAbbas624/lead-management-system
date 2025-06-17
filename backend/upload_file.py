import re
import difflib
from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime, timezone
import logging
import numpy as np
from sentence_transformers import SentenceTransformer
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from pydantic import BaseModel
import json
import pandas as pd

from models import DuplicateCheckRequest, AutoMappingRequest, ProcessLeadsRequest
from database import SupabaseClient
from field_mapper import FieldMapper
from duplicate_checker import DuplicateChecker
from data_processor import DataProcessor
from fastapi.responses import StreamingResponse, JSONResponse
import io
import csv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter()

# Initialize Supabase client
supabase_client = SupabaseClient()

def batch_to_dict(batch):
    # Helper to convert batch to dict with camelCase keys for frontend
    if not batch:
        return {}
    return {
        "id": batch.get("id"),
        "fileName": batch.get("filename"),
        "fileType": batch.get("filetype"),
        "status": batch.get("status"),
        "totalLeads": batch.get("totalleads"),
        "cleanedLeads": batch.get("cleanedleads"),
        "duplicateLeads": batch.get("duplicateleads"),
        "dncMatches": batch.get("dncmatches"),
        "sourceName": batch.get("sourcename"),
        "createdAt": batch.get("createdat"),
        "completedAt": batch.get("completedat"),
        "errorMessage": batch.get("errormessage"),
    }

@router.get("/batch-details/{batch_id}")
def get_batch_details(batch_id: int):
    """Get details for a single upload batch."""
    try:
        batch = supabase_client.get_upload_batch(batch_id)
        return {"success": True, "batch": batch_to_dict(batch)}
    except Exception as e:
        logger.error(f"Error in /batch-details/{batch_id}: {str(e)}")
        return {"success": False, "error": str(e)}

@router.get("/download-batch/{batch_id}")
def download_batch(batch_id: int):
    """Download leads for a batch as CSV."""
    try:
        leads = supabase_client.get_leads_by_batch(batch_id)
        if not leads:
            return JSONResponse(status_code=404, content={"success": False, "error": "No leads found for this batch."})
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=leads[0].keys())
        writer.writeheader()
        writer.writerows(leads)
        output.seek(0)
        filename = f"batch_{batch_id}_leads.csv"
        return StreamingResponse(output, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={filename}"})
    except Exception as e:
        logger.error(f"Error in /download-batch/{batch_id}: {str(e)}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

@router.post("/reprocess-batch/{batch_id}")
def reprocess_batch(batch_id: int):
    """Trigger reprocessing for an upload batch (mock implementation)."""
    try:
        # TODO: Implement real reprocessing logic
        # For now, just update status to 'processing' and return success
        supabase_client.update_batch_status(batch_id, "processing")
        return {"success": True, "message": f"Batch {batch_id} reprocessing started."}
    except Exception as e:
        logger.error(f"Error in /reprocess-batch/{batch_id}: {str(e)}")
        return {"success": False, "error": str(e)}

@router.get("/upload-history")
def get_upload_history(limit: int = 100):
    """
    Get upload batch history, most recent first.
    """
    try:
        batches = supabase_client.get_upload_batches(limit=limit)
        return {"success": True, "batches": batches}
    except Exception as e:
        logger.error(f"Error in /upload-history: {str(e)}")
        return {"success": False, "error": str(e)}

class MappingRule(BaseModel):
    sourceField: str
    targetField: str
    confidence: float
    isRequired: bool

# Map of internal fields to descriptions (for max accuracy)
FIELD_DESCRIPTIONS = {
    "email": "Email address of the lead",
    "firstname": "First name of the contact",
    "lastname": "Last name of the contact",
    "phone": "Phone number or mobile number",
    "companyname": "Company or business name",
    "address": "Address or street address",
    "city": "City",
    "state": "State or province",
    "zipcode": "Zip code or postal code",
    "country": "Country",
    "taxid": "Tax ID or EIN number",
    "loanamount": "Loan amount or requested amount",
    "revenue": "Annual revenue or sales",
    "dnc": "Do not call status or flag"
}

class NLPFieldMapper:
    """Advanced NLP-based field mapping using sentence transformers."""
    
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.direct_matches = {
            'email': ['email', 'e-mail', 'mail'],
            'phone': ['phone', 'phone1', 'phone2', 'mobile', 'cell', 'telephone'],
            'firstname': ['firstname', 'first name', 'first_name', 'fname'],
            'lastname': ['lastname', 'last name', 'last_name', 'lname'],
            'companyname': ['companyname', 'company name', 'company_name', 'company'],
            'revenue': ['revenue', 'annual revenue', 'yearly revenue'],
            'dnc': ['dnc', 'do not call', 'do_not_call']
        }
    
    def map_fields(self, headers: List[str], sample_data: List[Dict] = None) -> Dict[str, str]:
        """Map CSV headers to internal field names using NLP and direct matching."""
        mapping = {}
        header_embeddings = self.model.encode(headers)
        
        # First try direct matches
        for internal_field, possible_names in self.direct_matches.items():
            for header in headers:
                header_lower = header.lower()
                if any(name in header_lower for name in possible_names):
                    mapping[internal_field] = header
                    break
        
        # For remaining fields, use NLP similarity
        for i, header in enumerate(headers):
            if header in mapping.values():
                continue
                
            header_embedding = header_embeddings[i]
            best_match = None
            best_score = 0.45  # Lowered threshold for better matching
            
            for internal_field in ['email', 'phone', 'firstname', 'lastname', 'companyname', 'revenue', 'dnc']:
                if internal_field in mapping:
                    continue
                    
                field_embedding = self.model.encode(internal_field)[0]
                similarity = cosine_similarity([header_embedding], [field_embedding])[0][0]
                
                if similarity > best_score:
                    best_score = similarity
                    best_match = internal_field
            
            if best_match:
                mapping[best_match] = header
        
        # Special handling for phone fields - ensure we get the actual phone number
        if 'phone' not in mapping:
            for header in headers:
                if header.lower().startswith('phone'):
                    mapping['phone'] = header
                    break
        
        # If we have a phonetype field but no phone field, try to find a phone field
        if 'phonetype' in mapping and 'phone' not in mapping:
            for header in headers:
                if header.lower().startswith('phone'):
                    mapping['phone'] = header
                    break
        
        return mapping
    
    def _fallback_map_fields(self, headers: List[str], sample_data: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
        """Fallback to basic TF-IDF based mapping if NLP fails."""
        mappings = []
        for header in headers:
            best_field = ""
            best_score = 0.0
            
            # Check for DNC columns first
            if any(pattern in header.lower() for pattern in [
                "dnc", "do not call", "do_not_call", "dnc_flag", "call status"
            ]):
                mappings.append({
                    "sourceField": header,
                    "targetField": "dnc",
                    "confidence": 1.0,
                    "isRequired": False
                })
                continue
            
            # Use TF-IDF for other fields
            for field_name, patterns in self.field_patterns.items():
                similarity = self._calculate_similarity(header, patterns)
                if similarity > best_score:
                    best_score = similarity
                    best_field = field_name
            
            if sample_data and len(sample_data) > 0:
                sample_values = [row.get(header) for row in sample_data if header in row]
                if sample_values:
                    data_analysis = self._analyze_sample_data(header, sample_values)
                    for field, confidence in data_analysis.items():
                        if confidence > 0.8 and confidence > best_score:
                            best_field = field
                            best_score = confidence
                        elif confidence > best_score:
                            best_score = (best_score + confidence) / 2

            mappings.append({
                "sourceField": header,
                "targetField": best_field if best_score > 0.3 else "",
                "confidence": round(best_score, 2),
                "isRequired": best_field in ["email", "firstname", "lastname"]
            })
        
        return mappings
    
    def _calculate_similarity(self, source: str, target_patterns: List[str]) -> float:
        source_clean = re.sub(r'[^a-zA-Z0-9]', '', source.lower())
        max_similarity = 0
        
        for pattern in target_patterns:
            pattern_clean = re.sub(r'[^a-zA-Z0-9]', '', pattern.lower())
            if source_clean == pattern_clean: return 1.0
            if pattern_clean in source_clean or source_clean in pattern_clean:
                max_similarity = max(max_similarity, 0.8)
            
            seq_similarity = difflib.SequenceMatcher(None, source_clean, pattern_clean).ratio()
            max_similarity = max(max_similarity, seq_similarity)
            
            try:
                source_vec = self.vectorizer.transform([source_clean])
                pattern_vec = self.vectorizer.transform([pattern_clean])
                cosine_sim = cosine_similarity(source_vec, pattern_vec)[0][0]
                max_similarity = max(max_similarity, cosine_sim)
            except Exception: # pylint: disable=broad-except
                pass # Ignore errors if vectorization fails for some specific strings
        
        return max_similarity
    
    def _analyze_sample_data(self, field_name: str, sample_values: List[Any]) -> Dict[str, float]:
        if not sample_values: return {}
        clean_values = [str(v).strip() for v in sample_values if v is not None and str(v).strip()]
        if not clean_values: return {}
        
        analysis = {}
        email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        if sum(1 for v in clean_values if email_pattern.match(v)) > 0:
            analysis['email'] = sum(1 for v in clean_values if email_pattern.match(v)) / len(clean_values)

        phone_pattern = re.compile(r'[\d\s\-()]{7,}') # Simplified phone pattern
        if sum(1 for v in clean_values if phone_pattern.search(v)) > 0:
             analysis['phone'] = sum(1 for v in clean_values if phone_pattern.search(v)) / len(clean_values)

        numeric_values = []
        for v_str in clean_values:
            try:
                clean_num_str = re.sub(r'[$,]', '', v_str)
                float(clean_num_str)
                numeric_values.append(clean_num_str)
            except ValueError:
                pass
        
        if numeric_values and (len(numeric_values) / len(clean_values) > 0.7):
            if any(keyword in field_name.lower() for keyword in ['loan', 'amount', 'principal']):
                analysis['loanAmount'] = len(numeric_values) / len(clean_values)
            elif any(keyword in field_name.lower() for keyword in ['revenue', 'sales', 'income']):
                analysis['revenue'] = len(numeric_values) / len(clean_values)
        
        return analysis

def handle_check_duplicates(request: DuplicateCheckRequest, db: SupabaseClient) -> Dict[str, Any]:
    logger.info(f"Checking duplicates for {len(request.data)} records, fields: {request.checkFields}")
    duplicate_checks_results = []
    total_duplicates_found = 0

    for field in request.checkFields:
        field_values = [row.get(field) for row in request.data if row.get(field)]
        field_values = [str(v).strip() for v in field_values if v] # Ensure values are strings and stripped

        if not field_values:
            duplicate_checks_results.append({"field": field, "duplicateCount": 0, "totalChecked": 0})
            continue

        # Assuming db.check_field_duplicates returns a list of existing records matching the values
        existing_records = db.check_field_duplicates(field, field_values)
        
        # This logic might need adjustment based on how db.check_field_duplicates works.
        # If it returns the actual duplicate values found in the DB:
        # Count how many of the uploaded `field_values` are present in `existing_records`
        # For simplicity, let's assume existing_records is a list of dicts [{field: value}, ...]
        
        # A more robust way:
        # existing_values_in_db = {str(record[field]).strip() for record in existing_records if field in record and record[field]}
        # current_duplicates_count = sum(1 for val in field_values if val in existing_values_in_db)

        # The current db.check_field_duplicates seems to return the count directly based on its usage in app.py
        # so, if `existing_records` is already the count or list of duplicates:
        duplicate_count = len(existing_records) # Adjust if db.check_field_duplicates returns list of duplicates

        duplicate_checks_results.append({
            "field": field,
            "duplicateCount": duplicate_count,
            "totalChecked": len(field_values)
        })
        total_duplicates_found += duplicate_count
    
    return {
        "duplicateChecks": duplicate_checks_results,
        "totalDuplicates": total_duplicates_found
    }

def handle_auto_mapping(request: AutoMappingRequest, nlp_mapper: NLPFieldMapper) -> Dict:
    """Handle the auto mapping request."""
    try:
        logger.info(f"Performing auto mapping for {len(request.headers)} headers")
        
        # Get mappings using NLP
        mapping_dict = nlp_mapper.map_fields(request.headers, request.sampleData)
        
        # Convert mapping dictionary to the expected format
        mappings = []
        for source_field in request.headers:
            target_field = None
            confidence = 0.0
            
            # Find if this source field is mapped to any target
            for target, source in mapping_dict.items():
                if source == source_field:
                    target_field = target
                    confidence = 1.0  # Direct match has full confidence
                    break
            
            mappings.append({
                "sourceField": source_field,
                "targetField": target_field,
                "confidence": confidence,
                "isRequired": target_field in ["email", "firstname", "lastname"] if target_field else False
            })
        
        return {
            "success": True,
        "mappings": mappings,
            "totalFields": len(request.headers),
        "totalMapped": len([m for m in mappings if m["targetField"]])
        }

    except Exception as e:
        logger.error(f"Error in handle_auto_mapping: {e}")
        raise

@router.post("/process-leads")
async def handle_process_leads(request: ProcessLeadsRequest) -> Dict[str, Any]:
    """Process uploaded leads."""
    try:
        # Create mapping dictionary
        mapping = {m["sourceField"]: m["targetField"] for m in request.mappings}
        logger.info(f"Field mapping: {mapping}")
        
        # Get headers from first row of data
        headers = list(request.data[0].keys()) if request.data else []
        logger.info(f"Headers from data: {headers}")
        
        # Initialize data processor
        data_processor = DataProcessor()
        
        # Extract data from uploaded leads
        data = []
        for row in request.data:
            mapped_row = {}
            for source_field, target_field in mapping.items():
                if source_field in row and target_field:
                    # Special handling for revenue field
                    if target_field == 'revenue':
                        value = row[source_field]
                        if isinstance(value, (int, float)):
                            mapped_row[target_field] = value
                        elif isinstance(value, str):
                            # Try to convert string to number
                            try:
                                # Remove any currency symbols and commas
                                clean_value = value.replace('$', '').replace(',', '').strip()
                                mapped_row[target_field] = float(clean_value)
                            except (ValueError, TypeError):
                                mapped_row[target_field] = 0
                        else:
                            mapped_row[target_field] = 0
                    else:
                        mapped_row[target_field] = row[source_field]
            data.append(mapped_row)
        
        # Clean and normalize the data
        cleaned_data = await data_processor.clean_and_normalize_leads(
            data,
            cleaning_settings=request.cleaning_settings,
            normalization_settings=request.normalization_settings
        )
        # Ensure cleaned_data is a list
        if isinstance(cleaned_data, tuple):
            cleaned_data = cleaned_data[0]
        logger.info(f"Cleaned data sample: {cleaned_data[:5]}")
        
        # Initialize database client
        db = SupabaseClient()
        
        # Check for duplicates
        logger.info("Checking for duplicates")
        seen_emails = set()
        seen_phones = set()
        unique_leads = []
        duplicates = []
        
        # First check for duplicates within the current batch
        for lead in cleaned_data:
            email = lead.get('email', '').lower().strip()
            phone = lead.get('phone', '').strip()
            
            # Skip if both email and phone are empty
            if not email and not phone:
                duplicates.append(lead)
                continue
                
            # Check for duplicates using both email and phone
            is_duplicate = False
            if email and email in seen_emails:
                is_duplicate = True
            if phone and phone in seen_phones:
                is_duplicate = True
                
            if is_duplicate:
                duplicates.append(lead)
                continue
                
            if email:
                seen_emails.add(email)
            if phone:
                seen_phones.add(phone)
            unique_leads.append(lead)
        
        # Then check against existing leads in database
        if unique_leads:
            existing_emails = [lead.get('email', '').lower().strip() for lead in unique_leads if lead.get('email')]
            existing_phones = [lead.get('phone', '').strip() for lead in unique_leads if lead.get('phone')]
            
            # Get existing leads by email and phone
            email_duplicates = db.get_leads_by_emails(existing_emails) if existing_emails else []
            phone_duplicates = db.get_leads_by_phones(existing_phones) if existing_phones else []
            
            # Create sets of existing emails and phones for faster lookup
            existing_email_set = {lead['email'].lower().strip() for lead in email_duplicates if lead.get('email')}
            existing_phone_set = {lead['phone'].strip() for lead in phone_duplicates if lead.get('phone')}
            
            # Filter out duplicates
            final_leads_for_insert = []
            dnc_leads_for_processing = []
            for lead in unique_leads:
                email = lead.get('email', '').lower().strip()
                phone = lead.get('phone', '').strip()
                
                if (email and email in existing_email_set) or (phone and phone in existing_phone_set):
                    duplicates.append(lead)
                else:
                    # Separate leads marked as DNC for dnc_entries table
                    dnc_status = lead.get('dnc') or lead.get('is_dnc', '')
                    if str(dnc_status).upper() in ['Y', 'YES', 'TRUE']:
                        dnc_leads_for_processing.append(lead)
                    
                    # Prepare lead data according to leads table schema
                    # Debug: Log the raw lead data
                    logger.info(f"Processing lead with raw data: {lead}")
                    
                    # First, normalize field names to handle different cases and variations
                    field_mapping = {
                        'email': ['email', 'e-mail'],
                        'firstname': ['firstname', 'first_name', 'fname', 'first name'],
                        'lastname': ['lastname', 'last_name', 'lname', 'last name'],
                        'phone': ['phone', 'phone1', 'phone_number', 'phone number', 'tel', 'telephone','mobile', 'cell', 'cellphone', 'cell phone',],
                        'companyname': ['companyname', 'company_name', 'company', 'company name'],
                        'taxid': ['taxid', 'tax_id', 'ein', 'tax id'],
                        'address': ['address', 'address1', 'street', 'street_address', 'street address'],
                        'city': ['city', 'City', 'City Name', 'city name', 'City Name', 'city name', 'City Name', 'city name'],
                        'state': ['state', 'province', 'region'],
                        'zipcode': ['zipcode', 'zip', 'postal_code', 'postalcode', 'postal code'],
                        'country': ['country', 'nation'],
                        'revenue': ['revenue', 'annual_revenue', 'income', 'annual revenue'],
                        'phonetype': ['phonetype', 'phone_type', 'phone type'],
                    }
                    
                    # Create a case-insensitive mapping of the lead data
                    lead_lower = {str(k).lower().strip(): v for k, v in lead.items() if v is not None and str(v).strip() != ''}
                    
                    # Debug: Log the case-insensitive keys we have
                    logger.info(f"Available case-insensitive fields: {list(lead_lower.keys())}")
                    
                    # Special handling for address1 -> address mapping
                    if 'address1' in lead_lower and 'address' not in lead_lower:
                        lead_lower['address'] = lead_lower['address1']
                    
                    # Helper function to get value from lead using multiple possible field names
                    def get_lead_value(field_names):
                        if not isinstance(field_names, list):
                            field_names = [field_names]
                        for name in field_names:
                            if name in lead_lower:
                                return lead_lower[name]
                            # Also check title case and lowercase versions
                            title_name = name.title()
                            if title_name in lead:
                                return lead[title_name]
                            if name in lead:
                                return lead[name]
                        return None
                    
                    # Build the lead data with proper field mapping
                    logger.info("Field mapping results:")
                    for field, value in [
                        ('email', get_lead_value(field_mapping['email'])),
                        ('firstname', get_lead_value(field_mapping['firstname'])),
                        ('lastname', get_lead_value(field_mapping['lastname'])),
                        ('phone', get_lead_value(field_mapping['phone'])),
                        ('companyname', get_lead_value(field_mapping['companyname'])),
                        ('address', get_lead_value(field_mapping['address'])),
                        ('city', get_lead_value(field_mapping['city'])),
                        ('state', get_lead_value(field_mapping['state'])),
                        ('zipcode', get_lead_value(field_mapping['zipcode'])),
                        ('country', get_lead_value(field_mapping['country']))
                    ]:
                        logger.info(f"  {field}: {value} (type: {type(value).__name__ if value else 'None'})")
                    
                    lead_to_insert = {
                        'email': get_lead_value(field_mapping['email']),
                        'firstname': get_lead_value(field_mapping['firstname']),
                        'lastname': get_lead_value(field_mapping['lastname']),
                        'phone': get_lead_value(field_mapping['phone']),
                        'companyname': get_lead_value(field_mapping['companyname']),
                        'taxid': get_lead_value(field_mapping['taxid']),
                        'address': get_lead_value(field_mapping['address']),
                        'city': get_lead_value(field_mapping['city']),
                        'state': get_lead_value(field_mapping['state']),
                        'zipcode': get_lead_value(field_mapping['zipcode']),
                        'country': get_lead_value(field_mapping['country']),
                        'leadsource': request.source,
                        'leadstatus': 'New',
                        'leadscore': int(get_lead_value('leadscore') or 0),
                        'leadcost': float(get_lead_value('leadcost') or 0.0),
                        'exclusivity': bool(str(get_lead_value('exclusivity') or '').lower() in ('true', 'yes', '1')),
                        'exclusivitynotes': get_lead_value('exclusivitynotes'),
                        'metadata': {}
                    }
                    
                    # Define standard fields that go directly to lead columns
                    standard_fields = [
                        'email', 'firstname', 'lastname', 'phone', 'companyname',
                        'taxid', 'address', 'city', 'state', 'zipcode', 'country',
                        'leadsource', 'leadstatus', 'leadscore', 'leadcost',
                        'exclusivity', 'exclusivitynotes', 'tags', 'dnc', 'is_dnc'
                    ]
                    
                    # Debug: Log all fields that will go to metadata
                    logger.info("Fields going to metadata:")
                    for field, value in lead.items():
                        if not value or str(value).strip() == '':
                            continue
                            
                        # Check if this is a standard field we've already processed
                        is_standard = any(
                            field.lower() == std_field or 
                            any(alt.lower() == field.lower() for alt in field_mapping.get(std_field, []))
                            for std_field in standard_fields
                        )
                        
                        if not is_standard:
                            logger.info(f"  {field}: {value} (type: {type(value).__name__})")
                    
                    for field, value in lead.items():
                        if not value or str(value).strip() == '':
                            continue
                            
                        # Check if this is a standard field we've already processed
                        is_standard = any(
                            field.lower() == std_field or 
                            any(alt.lower() == field.lower() for alt in field_mapping.get(std_field, []))
                            for std_field in standard_fields
                        )
                        
                        if not is_standard:
                            lead_to_insert['metadata'][field] = str(value)
                    
                    # Handle DNC status in metadata
                    dnc_status = get_lead_value(['dnc', 'is_dnc', 'do_not_call'])
                    if dnc_status is not None:
                        lead_to_insert['metadata']['dnc_status'] = str(dnc_status).upper()
                    
                    # Add phone type and revenue to metadata if they exist
                    for field in ['phonetype', 'revenue']:
                        value = get_lead_value(field)
                        if value is not None:
                            lead_to_insert['metadata'][field] = str(value)
                    
                    # Add tags and timestamps
                    lead_to_insert['tags'] = lead.get('tags', []) or []  # Ensure tags is an array
                    lead_to_insert['createdat'] = datetime.now(timezone.utc).isoformat()
                    lead_to_insert['updatedat'] = datetime.now(timezone.utc).isoformat()
                    
                    # Clean up empty values
                    lead_to_insert = {k: v for k, v in lead_to_insert.items() if v is not None and v != ''}
                    
                    # Ensure metadata is not empty (PostgreSQL doesn't like empty JSONB)
                    if 'metadata' in lead_to_insert and not lead_to_insert['metadata']:
                        lead_to_insert['metadata'] = None
                    
                    # Debug: Log the final lead data before insertion
                    logger.info("Final lead data for insertion:")
                    for field, value in lead_to_insert.items():
                        if field == 'metadata' and value:
                            logger.info(f"  {field}: {json.dumps(value, indent=2) if value else 'None'}")
                        else:
                            logger.info(f"  {field}: {value} (type: {type(value).__name__ if value else 'None'})")
                    
                    # Handle DNC status and other special fields in metadata
                    dnc_status = lead.get('dnc') or lead.get('is_dnc')
                    if dnc_status:
                        lead_to_insert['metadata']['dnc_status'] = str(dnc_status).upper()
                    
                    # Add other specific fields to metadata if they exist
                    for field in ['phonetype', 'revenue']:
                        if field in lead and lead[field] is not None:
                            lead_to_insert['metadata'][field] = str(lead[field])
                    
                    # Ensure metadata is not empty (PostgreSQL doesn't like empty JSONB)
                    if not lead_to_insert['metadata']:
                        lead_to_insert['metadata'] = None
                    
                    # Remove None values to avoid schema violations
                    lead_to_insert = {k: v for k, v in lead_to_insert.items() if v is not None or k == 'metadata'}

                    if request.supplier_id:
                        lead_to_insert['supplierid'] = request.supplier_id
                    if request.user_id:
                        lead_to_insert['uploadedby'] = request.user_id
                    
                    final_leads_for_insert.append(lead_to_insert)
        else:
            final_leads_for_insert = []
            dnc_leads_for_processing = []
        
        # Create batch record first to get batch_id
        batch_record = {
            'filename': request.filename,
            'filetype': 'csv',
            'status': 'processing',
            'totalleads': len(cleaned_data),
            'cleanedleads': len(unique_leads),
            'duplicateleads': len(duplicates),
            'dncmatches': 0,  # We'll update this after processing DNC entries
            'originalheaders': headers,
            'mappingrules': request.mappings,
            'processingprogress': 0,
            'sourcename': request.source,
            'createdat': datetime.now(timezone.utc).isoformat()
        }
        if request.supplier_id:
            batch_record['supplierid'] = request.supplier_id
        if request.user_id:
            batch_record['uploadedby'] = request.user_id
            
        try:
            batch_result = db.create_upload_batch(batch_record)
            batch_id = batch_result['id']
            logger.info(f"Created batch record with ID: {batch_id}")
        except Exception as e:
            logger.error(f"Error creating batch record: {e}")
            raise
        
        # Insert leads into the leads table
        inserted_leads = []
        if final_leads_for_insert:
            try:
                # Add batch_id to all leads
                for lead in final_leads_for_insert:
                    lead['uploadbatchid'] = batch_id
                
                result = db.insert_leads(final_leads_for_insert)
                inserted_leads = result.get('data', [])
                logger.info(f"Successfully inserted {len(inserted_leads)} leads")
            except Exception as e:
                logger.error(f"Error inserting leads: {e}")
                # Update batch record with error
                db.update_batch_record(batch_id, {
                    'status': 'error',
                    'errormessage': str(e),
                    'completedat': datetime.now(timezone.utc).isoformat()
                })
                raise
        
        # Add DNC entries into the dnc_entries table
        if dnc_leads_for_processing:
            try:
                dnc_entries_to_insert = []
                # First ensure we have a default DNC list
                dnc_list = db.get_or_create_dnc_list("Default DNC List", "email")
                
                for lead in dnc_leads_for_processing:
                    dnc_entry = {
                        'value': lead.get('email', '') or lead.get('phone', ''), # Use email or phone for DNC value
                        'valuetype': 'email' if lead.get('email') else 'phone', # Determine type based on what's available
                        'source': request.source,
                        'reason': 'User marked as DNC' if lead.get('dnc', '').upper() == 'Y' else 'Unknown',
                        'dnclistid': dnc_list['id'],
                        'createdat': datetime.now(timezone.utc).isoformat()
                    }
                    # Only add if value is not empty
                    if dnc_entry['value']:
                        dnc_entries_to_insert.append(dnc_entry)

                if dnc_entries_to_insert:
                    db.add_dnc_entries(dnc_entries_to_insert)
                    logger.info(f"Added {len(dnc_entries_to_insert)} DNC entries")
            except Exception as e:
                logger.error(f"Error adding DNC entries: {e}")
                # Don't raise here, as leads were already inserted

        # Update batch record with completion status
        try:
            db.update_batch_record(batch_id, {
                'status': 'completed',
                'dncmatches': len(dnc_leads_for_processing), # Use the count of leads marked for DNC processing
                'completedat': datetime.now(timezone.utc).isoformat(),
                'processingprogress': 100
            })
            logger.info("Updated batch record with completion status")
        except Exception as e:
            logger.error(f"Error updating batch record: {e}")
            # Don't raise here, as leads were already inserted
        
        return {
            'success': True,
            'message': 'Leads processed successfully',
            'stats': {
                'total': len(cleaned_data),
                'cleaned': len(unique_leads),
                'duplicates': len(duplicates),
                'dnc': len(dnc_leads_for_processing), # Use the count of leads marked for DNC processing
                'inserted': len(inserted_leads)
            },
            'batch_id': batch_id
        }
        
    except Exception as e:
        logger.error(f"Error processing leads: {e}")
        raise HTTPException(status_code=500, detail=str(e))
