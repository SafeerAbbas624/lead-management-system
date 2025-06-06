import re
import difflib
from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime, timezone
import logging
import numpy as np
from sentence_transformers import SentenceTransformer
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from models import DuplicateCheckRequest, AutoMappingRequest, ProcessLeadsRequest
from database import SupabaseClient
from data_processor import DataProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter()

# Initialize Supabase client
supabase_client = SupabaseClient()

class MappingRule(BaseModel):
    sourceField: str
    targetField: str
    confidence: float
    isRequired: bool

class ProcessLeadsRequest(BaseModel):
    """Request model for processing leads."""
    data: List[Dict[str, Any]]
    mappings: List[Dict[str, str]]
    cleaningSettings: Optional[Dict[str, Any]] = None
    normalizationSettings: Optional[Dict[str, Any]] = None
    filename: Optional[str] = None  # Add filename field

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
            cleaning_settings=request.cleaningSettings,
            normalization_settings=request.normalizationSettings
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
            email = lead.get('email', '').lower()
            phone = lead.get('phone', '')
            
            if email in seen_emails or phone in seen_phones:
                duplicates.append(lead)
                continue
                
            seen_emails.add(email)
            seen_phones.add(phone)
            unique_leads.append(lead)
        
        # Then check against existing leads in database
        if unique_leads:
            existing_emails = [lead.get('email', '').lower() for lead in unique_leads]
            existing_phones = [lead.get('phone', '') for lead in unique_leads]
            
            # Get existing leads by email and phone
            email_duplicates = db.get_leads_by_emails(existing_emails)
            phone_duplicates = db.get_leads_by_phones(existing_phones)
            
            # Create sets of existing emails and phones for faster lookup
            existing_email_set = {lead['email'].lower() for lead in email_duplicates}
            existing_phone_set = {lead['phone'] for lead in phone_duplicates}
            
            # Filter out duplicates
            final_leads = []
            for lead in unique_leads:
                email = lead.get('email', '').lower()
                phone = lead.get('phone', '')
                
                if email in existing_email_set or phone in existing_phone_set:
                    duplicates.append(lead)
                else:
                    # Prepare lead data according to schema
                    final_lead = {
                        'email': lead.get('email'),
                        'firstname': lead.get('firstname'),
                        'lastname': lead.get('lastname'),
                        'phone': lead.get('phone'),
                        'companyname': lead.get('companyname'),
                        'leadsource': 'file_upload',
                        'leadstatus': 'new',
                        'leadscore': 0,
                        'leadcost': 0,
                        'exclusivity': False,
                        'tags': [],
                        'createdat': datetime.now(timezone.utc).isoformat(),
                        'metadata': {
                            'revenue': lead.get('revenue', 0)
                        }
                    }
                    final_leads.append(final_lead)
        else:
            final_leads = []
        
        # Collect DNC entries
        dnc_entries = []
        for lead in final_leads:
            if lead.get('dnc', '').upper() == 'Y':
                # First ensure we have a default DNC list
                dnc_list = db.get_or_create_dnc_list("Default DNC List", "email")
                
                dnc_entry = {
                    'value': lead.get('email', ''),
                    'valuetype': 'email',
                    'source': 'upload',
                    'reason': 'User marked as DNC',
                    'dnclistid': dnc_list['id'],
                    'createdat': datetime.now(timezone.utc).isoformat()
                }
                dnc_entries.append(dnc_entry)
                
                if lead.get('phone'):
                    phone_dnc = {
                        'value': lead.get('phone', ''),
                        'valuetype': 'phone',
                        'source': 'upload',
                        'reason': 'User marked as DNC',
                        'dnclistid': dnc_list['id'],
                        'createdat': datetime.now(timezone.utc).isoformat()
                    }
                    dnc_entries.append(phone_dnc)
        
        # Insert leads
        inserted_leads = []
        if final_leads:
            try:
                result = db.insert_leads(final_leads)
                inserted_leads = result.get('data', [])
                logger.info(f"Successfully inserted {len(inserted_leads)} leads")
            except Exception as e:
                logger.error(f"Error inserting leads: {e}")
                raise
        
        # Add DNC entries
        if dnc_entries:
            try:
                db.add_dnc_entries(dnc_entries)
                logger.info(f"Added {len(dnc_entries)} DNC entries")
            except Exception as e:
                logger.error(f"Error adding DNC entries: {e}")
                # Don't raise here, as leads were already inserted
        
        # Create batch record
        batch_record = {
            'filename': request.filename or 'unknown_file.csv',  # Use provided filename or default
            'filetype': 'csv',
            'status': 'completed',
            'totalleads': len(cleaned_data),
            'cleanedleads': len(unique_leads),
            'duplicateleads': len(duplicates),
            'dncmatches': len(dnc_entries),
            'originalheaders': headers,
            'mappingrules': request.mappings,
            'createdat': datetime.now(timezone.utc).isoformat(),
            'completedat': datetime.now(timezone.utc).isoformat()
        }
        
        try:
            db.insert_batch_record(batch_record)
            logger.info("Created batch record")
        except Exception as e:
            logger.error(f"Error creating batch record: {e}")
            # Don't raise here, as leads were already inserted
        
        return {
            'success': True,
            'message': 'Leads processed successfully',
            'stats': {
                'total': len(cleaned_data),
                'cleaned': len(unique_leads),
                'duplicates': len(duplicates),
                'dnc': len(dnc_entries),
                'inserted': len(inserted_leads)
            }
        }
        
    except Exception as e:
        logger.error(f"Error processing leads: {e}")
        raise HTTPException(status_code=500, detail=str(e))
