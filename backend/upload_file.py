import re
import difflib
from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime
import logging

from models import DuplicateCheckRequest, AutoMappingRequest, ProcessLeadsRequest
from database import SupabaseClient
from data_processor import DataProcessor

logger = logging.getLogger(__name__)

class NLPFieldMapper:
    """Advanced NLP-based field mapping using multiple techniques."""
    
    def __init__(self):
        self.field_patterns = {
            "firstName": ["first", "fname", "given", "forename", "firstname", "first_name", "f_name"],
            "lastName": ["last", "lname", "surname", "family", "lastname", "last_name", "l_name"],
            "email": ["email", "mail", "e-mail", "emailaddress", "email_address", "e_mail"],
            "phone": ["phone", "phone1", "","mobile", "cell", "tel", "telephone", "phonenumbers", "phone_number", "contact"],
            "companyname": ["company", "business", "organization", "employer", "companyname", "company_name", "org", "biz"],
            "address": ["address", "street", "addr", "streetaddress", "street_address", "location", "address1", "address2", "address_line_1", "address_line_2"],
            "city": ["city", "town", "municipality", "locality"],
            "state": ["state", "province", "region", "st", "prov", "territory"],
            "zipCode": ["zip", "postal", "postcode", "zipcode", "zip_code", "postal_code", "pincode"],
            "country": ["country", "nation", "cntry", "nationality"],
            "taxId": ["tax", "ein", "ssn", "taxid", "tax_id", "tax_identification", "tin"],
            "loanAmount": ["loan", "amount", "loanamount", "loan_amount", "principal", "credit"],
            "revenue": ["revenue", "sales", "income", "annual_revenue", "turnover", "earnings"],
        }
        
        all_patterns = []
        for patterns_list in self.field_patterns.values():
            all_patterns.extend(patterns_list)
        
        self.vectorizer = TfidfVectorizer(
            analyzer='char',
            ngram_range=(2, 4),
            lowercase=True
        )
        self.vectorizer.fit(all_patterns)
    
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

    def map_fields(self, headers: List[str], sample_data: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
        mappings = []
        for header in headers:
            best_field = ""
            best_score = 0.0
            
            for field_name, patterns in self.field_patterns.items():
                similarity = self._calculate_similarity(header, patterns)
                if similarity > best_score:
                    best_score = similarity
                    best_field = field_name
            
            if sample_data and len(sample_data) > 0:
                sample_values_for_header = [row.get(header) for row in sample_data if header in row and row.get(header) is not None]
                if sample_values_for_header:
                    data_analysis = self._analyze_sample_data(header, sample_values_for_header)
                    for field, confidence in data_analysis.items():
                        # Prioritize data-driven hints if strong
                        if confidence > 0.8 and confidence > best_score : # If data strongly suggests a type
                             best_field = field
                             best_score = confidence # Use data confidence
                        elif confidence > best_score: # Slight boost if consistent
                             best_score = (best_score + confidence) / 2


            mappings.append({
                "sourceField": header,
                "targetField": best_field if best_score > 0.3 else "",
                "confidence": round(best_score, 2),
                "isRequired": best_field in ["firstName", "lastName", "email"]
            })
        return mappings

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

def handle_auto_mapping(request: AutoMappingRequest, nlp_mapper: NLPFieldMapper) -> Dict[str, Any]:
    logger.info(f"Performing auto mapping for {len(request.headers)} headers")
    mappings = nlp_mapper.map_fields(request.headers, request.sampleData)
    return {
        "mappings": mappings,
        "totalMapped": len([m for m in mappings if m["targetField"]])
    }

def handle_process_leads(request: ProcessLeadsRequest, db: SupabaseClient, data_processor: DataProcessor) -> Dict[str, Any]:
    logger.info(f"Processing {len(request.data)} leads")

    filename = request.taggingSettings.get("fileName", "uploaded_file")

    # Check if a batch with the same filename already exists and is completed
    try:
        existing_batches = db.get_upload_batches(status="Completed")
        for batch in existing_batches:
            if batch.get("filename") == filename:
                logger.warning(f"Duplicate file upload detected: {filename}")
                return {
                    "success": False,
                    "message": f"File '{filename}' has already been uploaded and processed.",
                    "totalLeads": len(request.data),
                    "validLeads": 0,
                    "importedLeads": 0,
                    "duplicateLeads": 0,
                    "dncLeads": 0,
                    "newDncEntriesAdded": 0,
                    "failedLeads": len(request.data)
                }
    except Exception as e:
        logger.error(f"Error checking for duplicate files: {e}")
        pass

    # Create a mapping from source fields to target fields
    field_mapping = {mapping["sourceField"]: mapping["targetField"] for mapping in request.mappings}
    
    # Re-implement the initial mapping loop to ensure correct data transfer based on mappings
    mapped_data = []
    for row_idx, row_data in enumerate(request.data):
        mapped_row = {"original_row_index": row_idx}
        
        # Apply all mapping rules to the current row
        for source_field, target_field in field_mapping.items():
            if source_field in row_data:
                value = row_data[source_field]
                # Skip empty values or 'N' values
                if value and value != 'N':
                    mapped_row[target_field] = value
        
        # Ensure 'dnc' field exists in mapped_row, even if no mapping or data, default to None
        if "dnc" not in mapped_row:
            mapped_row["dnc"] = None

        mapped_data.append(mapped_row)

    logger.info(f"Mapped data sample (first 5, after corrected mapping): {mapped_data[:5]}")

    # Clean and normalize data
    cleaned_data = data_processor.clean_and_normalize_leads(
        mapped_data,
        request.cleaningSettings, 
        request.normalizationSettings
    )
    
    logger.info(f"Cleaned data sample (first 5): {cleaned_data[:5]}")

    # Process DNC status
    dnc_count = 0
    dnc_entries_to_add = []
    email_field = None
    phone_field = None
    
    # Find the mapped target fields for email and phone
    for mapping_rule in request.mappings:
        if mapping_rule.get("targetField") == "email":
            email_field = mapping_rule.get("sourceField")
        elif mapping_rule.get("targetField") == "phone":
            phone_field = mapping_rule.get("sourceField")
            
    # Find or create the 'Uploaded DNC' list ID
    uploaded_dnc_list_id = db.get_or_create_dnc_list("Uploaded DNC", "manual")
    
    for row in cleaned_data:
        # Check if the row has a DNC flag and is not already marked DNC from database check
        is_dnc_flag = row.get("dnc")
        
        # Remove the original 'dnc' key if it exists to prevent DB insertion errors
        if "dnc" in row:
            del row["dnc"]
            
        if is_dnc_flag is True:
            row["leadstatus"] = "DNC"
            dnc_count += 1
            
            # Collect DNC entries for bulk insertion
            if email_field and row.get(email_field):
                dnc_entries_to_add.append({
                    "value": str(row.get(email_field)).strip(),
                    "valuetype": "email",
                    "dnclistid": uploaded_dnc_list_id,
                    "source": request.taggingSettings.get("fileName", "file_upload"),
                    "createdat": datetime.now().isoformat()
                })
            if phone_field and row.get(phone_field):
                 dnc_entries_to_add.append({
                    "value": str(row.get(phone_field)).strip(),
                    "valuetype": "phone",
                    "dnclistid": uploaded_dnc_list_id,
                    "source": request.taggingSettings.get("fileName", "file_upload"),
                    "createdat": datetime.now().isoformat()
                })
        else:
            row["leadstatus"] = "New"

    # Filter valid records (must have email or phone)
    valid_data = [row for row in cleaned_data if row.get("email") or row.get("phone")]
    
    # Remove duplicates if enabled
    if request.cleaningSettings.get("removeDuplicates", True):
        valid_data = data_processor.remove_duplicates(valid_data)
        
    # Map processed data keys to database column names
    db_ready_data = []
    # Define a mapping from our internal/NLP keys to database column names
    db_column_mapping = {
        "firstName": "firstname",
        "lastName": "lastname",
        "email": "email",
        "phone": "phone",
        "companyname": "companyname",
        "taxId": "taxid",
        "address": "address",
        "city": "city",
        "state": "state",
        "zipCode": "zipcode",
        "country": "country",
        "loanAmount": "loanamount",
        "revenue": "revenue",
        "leadstatus": "leadstatus",
        "tags": "tags"
    }

    current_time_iso = datetime.now().isoformat()

    for row in valid_data:
        db_row = {}
        # Build db_row explicitly using the mapping to ensure only valid columns are included
        for internal_key, db_column in db_column_mapping.items():
            if internal_key in row and row[internal_key] not in [None, 'N', '']:
                db_row[db_column] = row[internal_key]

        # Add required metadata fields directly
        db_row["createdat"] = current_time_iso
        db_row["updatedat"] = current_time_iso
        db_row["leadsource"] = "File Upload"

        db_ready_data.append(db_row)

    # Add DNC entries to the global list in bulk
    new_dnc_entries_added = 0
    if dnc_entries_to_add:
        try:
            new_dnc_entries_added = db.add_dnc_entries_bulk(dnc_entries_to_add)
            logger.info(f"Added {new_dnc_entries_added} new DNC entries to the global list.")
        except Exception as e:
            logger.error(f"Failed to add DNC entries in bulk: {e}")

    # Insert into database
    inserted_count = 0
    if db_ready_data:
        inserted_count = db.insert_leads_batch(db_ready_data)

    duplicates_removed_count = len(request.data) - len(valid_data)

    # Create upload batch record
    batch_record = {
        "filename": request.taggingSettings.get("fileName", "processed_leads.csv"),
        "filetype": request.taggingSettings.get("fileType", "csv"),
        "status": "Completed" if inserted_count == len(valid_data) else "Partial",
        "totalleads": len(request.data),
        "validleads": len(valid_data),
        "importedleads": inserted_count,
        "duplicateleads": duplicates_removed_count,
        "dncmatches": dnc_count,
        "processingprogress": 100,
        "createdat": current_time_iso,
        "completedat": current_time_iso
    }
    
    batch_id = db.create_upload_batch(batch_record)
    
    return {
        "success": True,
        "batchId": batch_id,
        "totalLeads": len(request.data),
        "validLeads": len(valid_data),
        "importedLeads": inserted_count,
        "duplicateLeads": duplicates_removed_count,
        "dncLeads": dnc_count,
        "newDncEntriesAdded": new_dnc_entries_added,
        "failedLeads": len(valid_data) - inserted_count
    }
