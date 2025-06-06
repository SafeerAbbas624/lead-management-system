import os
import pandas as pd
import numpy as np
import json
import re
import logging
import phonenumbers
import email_validator
from datetime import datetime
from supabase import create_client, Client
from typing import Dict, List, Optional, Tuple, Any
import io
import csv
import zipfile
import hashlib
import asyncio
import concurrent.futures
import requests

from database import SupabaseClient
from utils.csv_parser import (
    parse_file, detect_file_type, map_fields, compress_file, 
    auto_detect_fields, detect_delimiters
)
from utils.validators import (
    validate_and_format_email, validate_and_format_phone, 
    validate_lead_data, correct_common_typos
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

class DataProcessor:
    def __init__(self):
        """
        Initialize the DataProcessor with Supabase client.
        """
        self.db = SupabaseClient()
        
        # Common email typos for correction
        self.email_typos = {
            "gmial.com": "gmail.com",
            "gamil.com": "gmail.com",
            "gmal.com": "gmail.com",
            "gmail.co": "gmail.com",
            "yaho.com": "yahoo.com",
            "yahooo.com": "yahoo.com",
            "yahoo.co": "yahoo.com",
            "hotmial.com": "hotmail.com",
            "hotmal.com": "hotmail.com",
            "hotmail.co": "hotmail.com",
            "outlok.com": "outlook.com",
            "outlook.co": "outlook.com",
        }
        
        # Field mapping for different file formats (using lowercase for database)
        self.field_mappings = {
            "default": {
                "firstname": ["first_name", "firstname", "fname", "given_name", "forename"],
                "lastname": ["last_name", "lastname", "lname", "surname", "family_name"],
                "email": ["email", "email_address", "emailaddress", "mail", "e-mail"],
                "phone": ["phone", "phone_number", "phonenumber", "mobile", "tel", "telephone"],
                "companyname": ["company", "company_name", "companyname", "business", "biz", "organization"],
                "address": ["address", "street_address", "streetaddress", "addr", "street"],
                "city": ["city", "town", "municipality"],
                "state": ["state", "province", "region", "st", "prov"],
                "zipcode": ["zip", "zip_code", "zipcode", "postal_code", "postalcode", "postal"],
                "country": ["country", "nation", "cntry"],
                "taxid": ["tax_id", "taxid", "ein", "tax_identification_number", "ssn"],
                "loanamount": ["loan", "loan_amount", "loanamount", "amount", "loan_amt"],
                "revenue": ["revenue", "annual_revenue", "annualrevenue", "sales", "yearly_revenue"],
            }
        }
        
        # Cleaning options with defaults
        self.default_cleaning_options = {
            "trimWhitespace": True,
            "normalizeCase": True,
            "removeDuplicates": True,
            "validateEmail": True,
            "validatePhone": True,
            "correctCommonTypos": True,
            "flagMissingFields": True,
            "compressFiles": True,
            "enrichData": False,
            "emailTypoCorrections": "gmial.com=gmail.com\nyaho.com=yahoo.com\nhotmial.com=hotmail.com"
        }
        
        # Normalization options with defaults
        self.default_normalization_options = {
            "nameFormat": "proper",  # proper, upper, lower, preserve
            "phoneFormat": "standard",  # standard, dashes, dots, international, raw
            "emailFormat": "lowercase",  # lowercase, preserve
            "addressFormat": "standard",  # standard, proper, upper, lower, preserve
            "dedupeStrategy": "email_phone",  # email, phone, email_phone, email_and_phone, custom
            "customDedupeFields": "",
            "enableEnrichment": False,
            "enrichmentProvider": "",
            "enrichmentApiKey": ""
        }
        
        # Initialize email typo corrections dictionary
        self.email_typo_corrections = self._parse_email_typo_corrections(self.default_cleaning_options["emailTypoCorrections"])
    
    def _parse_email_typo_corrections(self, corrections_str: str) -> Dict[str, str]:
        """Parse email typo corrections from string format."""
        corrections = {}
        for line in corrections_str.strip().split('\n'):
            if '=' in line:
                typo, correction = line.strip().split('=')
                corrections[typo.lower()] = correction.lower()
        return corrections
    
    def _correct_email_typos(self, email: str) -> str:
        """Correct common email typos."""
        if not email or '@' not in email:
            return email
            
        local_part, domain = email.split('@')
        domain = domain.lower()
        
        # Check if domain has a typo
        if domain in self.email_typo_corrections:
            return f"{local_part}@{self.email_typo_corrections[domain]}"
        
        return email
    
    async def clean_and_normalize_leads(self, data: List[Dict], cleaning_settings: Dict, normalization_settings: Dict) -> List[Dict]:
        """
        Clean and normalize lead data based on settings.
        
        Args:
            data: List of lead dictionaries
            cleaning_settings: Dictionary of cleaning options
            normalization_settings: Dictionary of normalization options
            
        Returns:
            List of cleaned and normalized lead dictionaries
        """
        logger.info(f"Cleaning and normalizing {len(data)} leads")
        
        # Merge settings with defaults
        cleaning_opts = {**self.default_cleaning_options, **cleaning_settings}
        norm_opts = {**self.default_normalization_options, **normalization_settings}
        
        # Update email typo corrections if provided
        if "emailTypoCorrections" in cleaning_settings:
            self.email_typo_corrections = self._parse_email_typo_corrections(cleaning_settings["emailTypoCorrections"])
        
        cleaned_data = []
        for lead in data:
            cleaned_lead = lead.copy()
            
            # Apply cleaning settings
            if cleaning_opts["trimWhitespace"]:
                for key, value in cleaned_lead.items():
                    if isinstance(value, str):
                        cleaned_lead[key] = value.strip()
            
            if cleaning_opts["normalizeCase"]:
                # Normalize email to lowercase
                if "email" in cleaned_lead and cleaned_lead["email"]:
                    cleaned_lead["email"] = cleaned_lead["email"].lower()
                
                # Normalize names based on format
                if norm_opts["nameFormat"] == "proper":
                    if "firstname" in cleaned_lead and cleaned_lead["firstname"]:
                        cleaned_lead["firstname"] = cleaned_lead["firstname"].title()
                    if "lastname" in cleaned_lead and cleaned_lead["lastname"]:
                        cleaned_lead["lastname"] = cleaned_lead["lastname"].title()
                elif norm_opts["nameFormat"] == "upper":
                    if "firstname" in cleaned_lead and cleaned_lead["firstname"]:
                        cleaned_lead["firstname"] = cleaned_lead["firstname"].upper()
                    if "lastname" in cleaned_lead and cleaned_lead["lastname"]:
                        cleaned_lead["lastname"] = cleaned_lead["lastname"].upper()
                elif norm_opts["nameFormat"] == "lower":
                    if "firstname" in cleaned_lead and cleaned_lead["firstname"]:
                        cleaned_lead["firstname"] = cleaned_lead["firstname"].lower()
                    if "lastname" in cleaned_lead and cleaned_lead["lastname"]:
                        cleaned_lead["lastname"] = cleaned_lead["lastname"].lower()
            
            # Format phone number
            if "phone" in cleaned_lead and cleaned_lead["phone"]:
                phone = str(cleaned_lead["phone"]).strip()
                # Remove any non-digit characters
                phone = ''.join(filter(str.isdigit, phone))
                
                if len(phone) == 10:  # US phone number
                    if norm_opts["phoneFormat"] == "standard":
                        cleaned_lead["phone"] = f"({phone[:3]}) {phone[3:6]}-{phone[6:]}"
                    elif norm_opts["phoneFormat"] == "dashes":
                        cleaned_lead["phone"] = f"{phone[:3]}-{phone[3:6]}-{phone[6:]}"
                    elif norm_opts["phoneFormat"] == "dots":
                        cleaned_lead["phone"] = f"{phone[:3]}.{phone[3:6]}.{phone[6:]}"
                    elif norm_opts["phoneFormat"] == "international":
                        cleaned_lead["phone"] = f"+1 {phone[:3]} {phone[3:6]} {phone[6:]}"
                    # For "raw" format, keep as is
            
            # Format email and correct typos
            if "email" in cleaned_lead and cleaned_lead["email"]:
                if norm_opts["emailFormat"] == "lowercase":
                    cleaned_lead["email"] = cleaned_lead["email"].lower()
                if cleaning_opts["correctCommonTypos"]:
                    cleaned_lead["email"] = self._correct_email_typos(cleaned_lead["email"])
            
            # Format address
            if "address" in cleaned_lead and cleaned_lead["address"]:
                if norm_opts["addressFormat"] == "proper":
                    cleaned_lead["address"] = cleaned_lead["address"].title()
                elif norm_opts["addressFormat"] == "upper":
                    cleaned_lead["address"] = cleaned_lead["address"].upper()
                elif norm_opts["addressFormat"] == "lower":
                    cleaned_lead["address"] = cleaned_lead["address"].lower()
            
            # Validate email if enabled
            if cleaning_opts["validateEmail"] and "email" in cleaned_lead:
                if not self._is_valid_email(cleaned_lead["email"]):
                    cleaned_lead["missingEssentialFields"] = True
            
            # Validate phone if enabled
            if cleaning_opts["validatePhone"] and "phone" in cleaned_lead:
                if not self._is_valid_phone(cleaned_lead["phone"]):
                    cleaned_lead["missingEssentialFields"] = True
            
            cleaned_data.append(cleaned_lead)
        
        # Handle deduplication
        if cleaning_opts["removeDuplicates"]:
            cleaned_data = self._remove_duplicates(cleaned_data, norm_opts["dedupeStrategy"], norm_opts["customDedupeFields"])
        
        # Apply data enrichment if enabled
        if norm_opts["enableEnrichment"]:
            cleaned_data = await self._enrich_data(
                cleaned_data,
                norm_opts["enrichmentProvider"],
                norm_opts["enrichmentApiKey"]
            )
        
        return cleaned_data
    
    def _is_valid_email(self, email: str) -> bool:
        """Validate email format."""
        if not email:
            return False
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    def _is_valid_phone(self, phone: str) -> bool:
        """Validate phone number format."""
        if not phone:
            return False
        # Remove any non-digit characters
        digits = ''.join(filter(str.isdigit, str(phone)))
        return len(digits) >= 10
    
    def _remove_duplicates(self, data: List[Dict], strategy: str, custom_fields: str = "") -> List[Dict]:
        """Remove duplicate leads based on the specified strategy."""
        if not data:
            return data
        
        seen = set()
        unique_data = []
        
        for lead in data:
            # Create a key based on the deduplication strategy
            if strategy == "email":
                key = lead.get("email", "").lower()
            elif strategy == "phone":
                key = ''.join(filter(str.isdigit, str(lead.get("phone", ""))))
            elif strategy == "email_phone":
                email = lead.get("email", "").lower()
                phone = ''.join(filter(str.isdigit, str(lead.get("phone", ""))))
                key = f"{email}|{phone}"
            elif strategy == "email_and_phone":
                email = lead.get("email", "").lower()
                phone = ''.join(filter(str.isdigit, str(lead.get("phone", ""))))
                if email and phone:  # Only consider if both exist
                    key = f"{email}|{phone}"
                else:
                    key = None
            elif strategy == "custom" and custom_fields:
                fields = [f.strip() for f in custom_fields.split(",")]
                values = []
                for field in fields:
                    value = str(lead.get(field, "")).lower()
                    values.append(value)
                key = "|".join(values)
            else:
                continue  # Skip if no valid strategy
            
            if key and key not in seen:
                seen.add(key)
                unique_data.append(lead)
        
        return unique_data

    def _clean_email(self, email: str, cleaning_settings: Dict, normalization_settings: Dict) -> Optional[str]:
        """Clean and normalize email address."""
        if not email:
            return None
        
        # Normalize case
        if normalization_settings.get("emailFormat") == "lowercase":
            email = email.lower()
        
        # Validate email format
        if cleaning_settings.get("validateEmail", True):
            email_regex = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
            if not email_regex.match(email):
                return None
        
        # Correct common typos
        if cleaning_settings.get("correctCommonTypos", True):
            for typo, correction in self.email_typos.items():
                if email.endswith(typo):
                    email = email.replace(typo, correction)
                    break
        
        return email

    def _clean_phone(self, phone: str, cleaning_settings: Dict, normalization_settings: Dict) -> Optional[str]:
        """Clean and normalize phone number."""
        if not phone:
            return None
        
        # Extract digits only
        digits = re.sub(r'\D', '', phone)
        
        # Validate phone number
        if cleaning_settings.get("validatePhone", True):
            if len(digits) < 10:
                return None
        
        # Format phone number
        phone_format = normalization_settings.get("phoneFormat", "standard")
        
        if len(digits) >= 10:
            if phone_format == "standard":
                return f"({digits[:3]}) {digits[3:6]}-{digits[6:10]}"
            elif phone_format == "dashes":
                return f"{digits[:3]}-{digits[3:6]}-{digits[6:10]}"
            elif phone_format == "dots":
                return f"{digits[:3]}.{digits[3:6]}.{digits[6:10]}"
            elif phone_format == "international":
                return f"+1 {digits[:3]} {digits[3:6]} {digits[6:10]}"
            elif phone_format == "raw":
                return digits
        
        return phone

    def _clean_name(self, name: str, cleaning_settings: Dict, normalization_settings: Dict) -> str:
        """Clean and normalize name fields."""
        if not name:
            return ""
        
        # Normalize case
        name_format = normalization_settings.get("nameFormat", "proper")
        
        if name_format == "proper":
            # Proper case with special handling for prefixes
            name = name.title()
            # Handle special cases like McDonald, O'Connor, etc.
            name = re.sub(r"Mc([a-z])", lambda m: "Mc" + m.group(1).upper(), name)
            name = re.sub(r"O'([a-z])", lambda m: "O'" + m.group(1).upper(), name)
        elif name_format == "upper":
            name = name.upper()
        elif name_format == "lower":
            name = name.lower()
        
        return name

    def _clean_company_name(self, company: str, cleaning_settings: Dict, normalization_settings: Dict) -> str:
        """Clean and normalize company name."""
        if not company:
            return ""
        
        # Remove extra whitespace
        company = re.sub(r'\s+', ' ', company).strip()
        
        # Normalize case for company names (usually proper case)
        company = company.title()
        
        # Handle common business suffixes
        suffixes = ["Inc", "Corp", "Ltd", "Llc", "Co"]
        for suffix in suffixes:
            company = re.sub(f" {suffix}$", f" {suffix.upper()}", company, flags=re.IGNORECASE)
        
        return company

    def _clean_address_field(self, address: str, cleaning_settings: Dict, normalization_settings: Dict) -> str:
        """Clean and normalize address fields."""
        if not address:
            return ""
        
        # Remove extra whitespace
        address = re.sub(r'\s+', ' ', address).strip()
        
        # Normalize case
        address_format = normalization_settings.get("addressFormat", "proper")
        
        if address_format == "proper":
            address = address.title()
        elif address_format == "upper":
            address = address.upper()
        elif address_format == "lower":
            address = address.lower()
        
        return address

    def _clean_numeric_field(self, value: str, cleaning_settings: Dict, normalization_settings: Dict) -> Optional[float]:
        """Clean and normalize numeric fields."""
        if not value:
            return None
        
        # Remove currency symbols and commas
        clean_value = re.sub(r'[$,]', '', str(value))
        
        try:
            return float(clean_value)
        except ValueError:
            return None

    def remove_duplicates(self, data: List[Dict]) -> List[Dict]:
        """
        Remove duplicate leads based on email and phone.
        
        Args:
            data: List of lead dictionaries
            
        Returns:
            List of deduplicated leads
        """
        logger.info(f"Removing duplicates from {len(data)} leads")
        
        seen = set()
        deduplicated = []
        
        for row in data:
            # Create a unique key based on email and phone
            email = row.get("email", "").lower() if row.get("email") else ""
            phone = re.sub(r'\D', '', row.get("phone", "")) if row.get("phone") else ""
            
            # Create unique key
            key = f"{email}|{phone}"
            
            if key not in seen and (email or phone):  # Must have at least email or phone
                seen.add(key)
                deduplicated.append(row)
        
        logger.info(f"Removed {len(data) - len(deduplicated)} duplicates")
        return deduplicated
    
    def _filter_database_duplicates(self, df: pd.DataFrame, check_fields: List[str]) -> Tuple[pd.DataFrame, int]:
        """
        Filter out leads that are duplicates of existing leads in the database.
        
        Args:
            df: DataFrame with lead data
            check_fields: List of fields to check for duplicates (e.g., ['email', 'phone'])
            
        Returns:
            Tuple of (DataFrame with non-duplicate leads, number of database duplicates found)
        """
        logger.info(f"Filtering database duplicates based on fields: {check_fields}")
        if self.db.use_mock: # Skip database check in mock mode
            logger.warning("Skipping database duplicate check in mock mode.")
            return df, 0
            
        if not check_fields:
            logger.warning("No check fields specified for database duplicate filtering.")
            return df, 0
            
        # Collect all unique, non-null values from the check fields across the DataFrame
        emails_to_check = df['email'].dropna().unique().tolist() if 'email' in df.columns else []
        phones_to_check = df['phone'].dropna().unique().tolist() if 'phone' in df.columns else []

        existing_duplicate_values = set()

        # Check for existing emails in the database
        if emails_to_check:
            try:
                # Clean and format emails before checking
                cleaned_emails = [str(email).strip().lower() for email in emails_to_check if email and str(email).strip()]
                if cleaned_emails:
                    existing_email_records = self.db.check_field_duplicates('email', cleaned_emails)
                    existing_duplicate_values.update(record.get('email') for record in existing_email_records if record.get('email'))
            except Exception as e:
                logger.error(f"Error checking existing emails for duplicates: {e}")

        # Check for existing phones in the database
        if phones_to_check:
            try:
                # Clean and format phone numbers before checking
                cleaned_phones = []
                for phone in phones_to_check:
                    if phone and str(phone).strip():
                        # Remove any non-digit characters for comparison
                        cleaned_phone = re.sub(r'\D', '', str(phone))
                        if cleaned_phone:
                            cleaned_phones.append(cleaned_phone)
                
                if cleaned_phones:
                    existing_phone_records = self.db.check_field_duplicates('phone', cleaned_phones)
                    existing_duplicate_values.update(record.get('phone') for record in existing_phone_records if record.get('phone'))
            except Exception as e:
                logger.error(f"Error checking existing phones for duplicates: {e}")
                
        if not existing_duplicate_values:
            logger.info("No matching duplicate values found in the database.")
            return df, 0

        # Filter the DataFrame to keep only rows where email or phone is NOT in the existing_duplicate_values set
        initial_count = len(df)
        
        # Create a boolean mask: True for rows to keep, False for duplicates
        is_duplicate_mask = df.apply(
            lambda row: (
                (pd.notna(row.get('email')) and str(row.get('email')).strip().lower() in existing_duplicate_values) or
                (pd.notna(row.get('phone')) and re.sub(r'\D', '', str(row.get('phone'))) in existing_duplicate_values)
            ),
            axis=1
        )
        
        filtered_df = df[~is_duplicate_mask].copy()
        
        database_duplicates_count = initial_count - len(filtered_df)
        logger.info(f"Filtered out {database_duplicates_count} database duplicates.")
        
        return filtered_df, database_duplicates_count
    
    def _create_duplicate_key(self, row: pd.Series, check_fields: List[str]) -> str:
        """
        Helper to create a consistent key for duplicate checking.
        """
        key_parts = []
        for field in check_fields:
            if field in row and pd.notna(row[field]):
                key_parts.append(str(row[field]).strip().lower())
            else:
                key_parts.append("")
        return "|".join(key_parts)

    async def process_file(self, file_path: str, batch_id: int, reprocess: bool = False, 
                          cleaning_options: Optional[Dict[str, bool]] = None) -> Dict[str, Any]:
        """
        Process a lead file (CSV, XLSX, JSON).
        
        Args:
            file_path: Path to the file in Supabase storage
            batch_id: ID of the upload batch
            reprocess: Whether this is a reprocessing of an existing batch
            cleaning_options: Dictionary of cleaning options to override defaults
            
        Returns:
            Dict with processing results
        """
        try:
            logger.info(f"Starting to process file: {file_path}, batch ID: {batch_id}")
            
            # Apply cleaning options
            options = self.default_cleaning_options.copy()
            if cleaning_options:
                options.update(cleaning_options)
            
            # Update batch status to processing (using lowercase column names)
            self.db.update_batch_status(
                batch_id=batch_id, 
                status="Processing", 
                processingprogress=10
            )
            
            # Download file from Supabase storage
            file_data = self.db.get_file_from_storage(file_path)
            
            # Determine file type
            file_ext = file_path.split(".")[-1].lower()
            
            # If file type can't be determined from path, try to detect it
            if file_ext not in ["csv", "xlsx", "xls", "json"]:
                file_ext = detect_file_type(file_data)
            
            # Parse file
            df = parse_file(file_data, file_ext)
            
            # Update batch with total leads count (using lowercase column names)
            total_leads = len(df)
            self.db.update_batch_status(
                batch_id=batch_id, 
                status="Processing", 
                processingprogress=20, 
                totalleads=total_leads
            )
            
            # Auto-detect fields if possible
            detected_mappings = auto_detect_fields(df)
            
            # Map fields using both predefined and detected mappings
            for field, columns in detected_mappings.items():
                if columns and field in self.field_mappings["default"]:
                    # Add detected columns to the mapping if they're not already there
                    for col in columns:
                        if col not in self.field_mappings["default"][field]:
                            self.field_mappings["default"][field].append(col)
            
            # Map fields
            df = map_fields(df, self.field_mappings["default"])
            
            # Clean and normalize data
            df = self._clean_data(df, options)
            self.db.update_batch_status(
                batch_id=batch_id, 
                status="Processing", 
                processingprogress=40
            )
            
            # Check for duplicates (intra-file)
            df, intra_file_duplicate_count = self._remove_duplicates(df, batch_id, options["removeDuplicates"])
            self.db.update_batch_status(
                batch_id=batch_id, 
                status="Processing", 
                processingprogress=60, 
                duplicateleads=intra_file_duplicate_count # This is now only intra-file duplicates
            )
            
            # Filter out database duplicates
            df, database_duplicate_count = self._filter_database_duplicates(df, check_fields=['email', 'phone'])
            self.db.update_batch_status(
                batch_id=batch_id, 
                status="Processing", 
                processingprogress=70, # Added a new step
                # We might want to add database_duplicate_count to the batch record schema
            )
            
            # Check against DNC lists
            df, dnc_count = await self._check_dnc_lists(df)
            self.db.update_batch_status(
                batch_id=batch_id, 
                status="Processing", 
                processingprogress=80, 
                dncmatches=dnc_count
            )
            
            # Enrich data if enabled
            if options["enrichData"]:
                df = await self._enrich_data(df)
            
            # Save leads to database
            cleaned_leads = len(df)
            await self._save_leads(df, batch_id)
            
            # Compress file if enabled
            if options["compressFiles"] and not file_path.endswith(".zip"):
                compressed_data, new_ext = compress_file(file_data, file_ext)
                compressed_path = f"{file_path}.zip"
                
                # Upload compressed file
                parts = file_path.split('/')
                bucket = parts[0]
                path = '/'.join(parts[1:]) + ".zip"
                self.db.upload_file_to_storage(bucket, path, compressed_data)
            
            # Update batch as completed (using lowercase column names)
            self.db.update_batch_status(
                batch_id=batch_id, 
                status="Completed", 
                processingprogress=100, 
                cleanedleads=cleaned_leads,
                completedat=datetime.now().isoformat()
            )
            
            logger.info(f"File processing completed: {file_path}, batch ID: {batch_id}")
            
            return {
                "success": True,
                "batchId": batch_id,
                "totalLeads": total_leads,
                "cleanedLeads": len(df), # Reflects leads remaining after all filtering
                "intraFileDuplicateLeads": intra_file_duplicate_count, # Report intra-file duplicates separately
                "databaseDuplicateLeads": database_duplicate_count, # Report database duplicates
                "dncMatches": dnc_count,
                # Consider adding a field for total duplicates removed
            }
            
        except Exception as e:
            logger.error(f"Error processing file: {str(e)}")
            self.db.update_batch_status(
                batch_id=batch_id, 
                status="Failed", 
                errormessage=str(e)
            )
            raise
    
    def _clean_data(self, df: pd.DataFrame, options: Dict[str, bool]) -> pd.DataFrame:
        """
        Clean and normalize lead data.
        
        Args:
            df: DataFrame with lead data
            options: Dictionary of cleaning options
            
        Returns:
            Cleaned DataFrame
        """
        logger.info("Cleaning and normalizing data")
        
        # Make a copy to avoid modifying the original
        df = df.copy()
        
        # Trim whitespace
        if options["trimWhitespace"]:
            for col in df.columns:
                if df[col].dtype == 'object':
                    df[col] = df[col].str.strip()
        
        # Normalize case
        if options["normalizeCase"]:
            if 'email' in df.columns:
                df['email'] = df['email'].str.lower()
            
            if 'firstname' in df.columns and 'lastname' in df.columns:
                # Proper case for names
                df['firstname'] = df['firstname'].str.title()
                df['lastname'] = df['lastname'].str.title()
                
                # Handle special cases like "McDonald"
                if df['lastname'].str.contains('Mc', case=False).any():
                    df['lastname'] = df['lastname'].str.replace(r'Mc(\w)', lambda m: 'Mc' + m.group(1).upper(), regex=True)
        
        # Correct common email typos
        if options["correctCommonTypos"] and 'email' in df.columns:
            for typo, correction in self.email_typos.items():
                df['email'] = df['email'].str.replace(f"@{typo}$", f"@{correction}", regex=True)
        
        # Validate and format phone numbers
        if options["validatePhone"] and 'phone' in df.columns:
            df['phone'] = df['phone'].apply(lambda x: validate_and_format_phone(x)[1] if pd.notna(x) else None)
        
        # Validate emails
        if options["validateEmail"] and 'email' in df.columns:
            df['email'] = df['email'].apply(lambda x: validate_and_format_email(x)[1] if pd.notna(x) else None)
        
        # Flag missing essential fields
        if options["flagMissingFields"]:
            essential_fields = ["firstname", "lastname", "email", "phone"]
            df['missingfields'] = df[essential_fields].isna().sum(axis=1) > 0
        
        return df
    
    def _remove_duplicates(self, df: pd.DataFrame, batch_id: int, remove_duplicates: bool) -> Tuple[pd.DataFrame, int]:
        """
        Remove duplicate leads within the file and against existing leads.
        
        Args:
            df: DataFrame with lead data
            batch_id: ID of the upload batch
            remove_duplicates: Whether to remove duplicates
            
        Returns:
            Tuple of (deduplicated DataFrame, duplicate count)
        """
        logger.info("Checking for duplicates")
        
        if not remove_duplicates:
            return df, 0
        
        # Count before deduplication
        before_count = len(df)
        
        # First, create a hash column for deduplication
        # Combine key fields to create a unique identifier
        df['dedupehash'] = df.apply(
            lambda row: hashlib.md5(
                ''.join(str(row.get(f, '')).lower() for f in ['email', 'phone', 'firstname', 'lastname']).encode()
            ).hexdigest(), 
            axis=1
        )
        
        # Remove duplicates within the file
        df = df.drop_duplicates(subset=['dedupehash'], keep='first')
        
        # More sophisticated deduplication using email or phone
        if 'email' in df.columns:
            df = df.drop_duplicates(subset=['email'], keep='first')
        
        if 'phone' in df.columns:
            df = df.drop_duplicates(subset=['phone'], keep='first')
        
        # Check against existing leads in database
        # In a real implementation, you would query the database for existing leads
        # and remove matches from df
        
        # Count after deduplication
        after_count = len(df)
        duplicate_count = before_count - after_count
        
        # Remove the hash column
        df = df.drop(columns=['dedupehash'])
        
        return df, duplicate_count
    
    async def _check_dnc_lists(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, int]:
        """
        Check leads against DNC lists and mark matching leads.
        
        Args:
            df: DataFrame with lead data
            
        Returns:
            Tuple of (DataFrame with DNC status, DNC count)
        """
        logger.info("Checking against DNC lists")
        
        # Add columns to mark DNC matches (using lowercase column names)
        df['isdnc'] = False
        df['leadstatus'] = 'New'
        df['dnclists'] = None
        
        dnc_count = 0
        
        # Process in chunks to avoid overwhelming the database
        chunk_size = 100
        total_rows = len(df)
        
        # Use asyncio to process chunks concurrently
        async def process_chunk(chunk_df, start_idx):
            nonlocal dnc_count
            
            # Create a list to store the DNC check results
            results = []
            
            # Check each lead in the chunk
            for idx, row in chunk_df.iterrows():
                email = row.get('email')
                phone = row.get('phone')
                
                if email or phone:
                    is_dnc, dnc_lists = self.db.check_dnc(email, phone)
                    
                    if is_dnc:
                        results.append((idx, True, 'DNC', dnc_lists))
                        dnc_count += 1
                    else:
                        results.append((idx, False, 'New', None))
                else:
                    results.append((idx, False, 'New', None))
            
            return results
        
        # Process chunks concurrently
        tasks = []
        for i in range(0, total_rows, chunk_size):
            chunk_df = df.iloc[i:i+chunk_size]
            task = asyncio.create_task(process_chunk(chunk_df, i))
            tasks.append(task)
        
        # Gather results
        chunk_results = await asyncio.gather(*tasks)
        
        # Flatten results
        all_results = []
        for chunk in chunk_results:
            all_results.extend(chunk)
        
        # Update DataFrame with results
        for idx, is_dnc, status, dnc_lists in all_results:
            df.at[idx, 'isdnc'] = is_dnc
            df.at[idx, 'leadstatus'] = status
            df.at[idx, 'dnclists'] = dnc_lists
        
        return df, dnc_count
    
    async def _enrich_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Enrich lead data with additional information.
        
        Args:
            df: DataFrame with lead data
            
        Returns:
            Enriched DataFrame
        """
        logger.info("Enriching lead data")
        
        # This is a placeholder for data enrichment
        # In a real implementation, you would use a third-party API or service
        
        # Add a timestamp for the enrichment
        df['enrichedat'] = datetime.now().isoformat()
        
        return df
    
    async def _save_leads(self, df: pd.DataFrame, batch_id: int) -> None:
        """
        Save processed leads to the database.
        
        Args:
            df: DataFrame with lead data
            batch_id: ID of the upload batch
        """
        logger.info(f"Saving {len(df)} leads to database")
        
        # Convert DataFrame to list of dictionaries
        leads = df.to_dict('records')
        
        # Add metadata to each lead (using lowercase column names)
        for lead in leads:
            lead['uploadbatchid'] = batch_id
            lead['createdat'] = datetime.now().isoformat()
            
            # Check for exclusivity
            if 'email' in lead and lead['email']:
                # Check if email contains "exclusivity" for demo purposes
                lead['exclusivity'] = 'exclusivity' in lead['email'].lower()
            else:
                lead['exclusivity'] = False
            
            # Remove None values
            lead = {k: v for k, v in lead.items() if v is not None}
        
        # Save to database
        self.db.save_leads(leads)
        logger.info(f"Leads saved successfully")
    
    async def process_dnc_file(self, file_path: str, dnc_list_id: int, value_type: str) -> Dict[str, Any]:
        """
        Process a DNC file and add entries to a DNC list.
        """
        try:
            logger.info(f"Processing DNC file: {file_path} for list ID {dnc_list_id}")
            
            # Download file from Supabase storage
            file_data = self.db.get_file_from_storage(file_path)
            
            # Determine file type
            file_ext = file_path.split(".")[-1].lower()
            
            # Parse file
            df = parse_file(file_data, file_ext)
            
            # Process values based on type
            clean_values = []
            if len(df.columns) > 1:
                # Try to find the right column based on value_type
                if value_type == "email":
                    possible_cols = ["email", "mail", "e-mail", "emailaddress", "email_address"]
                    for col in possible_cols:
                        if col in df.columns:
                            values = df[col].dropna().tolist()
                            break
                    else:
                        values = df.iloc[:, 0].dropna().tolist()
                elif value_type == "phone":
                    possible_cols = ["phone", "telephone", "mobile", "cell", "phone_number", "phonenumber"]
                    for col in possible_cols:
                        if col in df.columns:
                            values = df[col].dropna().tolist()
                            break
                    else:
                        values = df.iloc[:, 0].dropna().tolist()
                else:
                    values = df.iloc[:, 0].dropna().tolist()
            else:
                values = df.iloc[:, 0].dropna().tolist()
            
            # Clean and validate values
            if value_type == "email":
                for val in values:
                    is_valid, formatted = validate_and_format_email(str(val))
                    if is_valid:
                        clean_values.append(formatted)
            elif value_type == "phone":
                for val in values:
                    is_valid, formatted = validate_and_format_phone(str(val))
                    if is_valid:
                        clean_values.append(formatted)
            else:
                clean_values = [str(val).strip() for val in values if str(val).strip()]
            
            # Remove duplicates
            clean_values = list(set(clean_values))
            
            # Prepare entries for database (using lowercase column names)
            entries = []
            for value in clean_values:
                entries.append({
                    "value": value,
                    "valuetype": value_type,
                    "source": f"File Upload: {file_path}",
                    "dnclistid": dnc_list_id,
                    "createdat": datetime.now().isoformat()
                })
            
            # Add to database in chunks
            total_added = self.db.add_dnc_entries_bulk(entries)
            
            return {
                "success": True,
                "dncListId": dnc_list_id,
                "totalEntries": len(clean_values),
                "addedEntries": total_added,
                "valueType": value_type
            }
            
        except Exception as e:
            logger.error(f"Error processing DNC file: {str(e)}")
            raise
    
    async def check_dnc(self, email: Optional[str] = None, phone: Optional[str] = None) -> Dict[str, Any]:
        """
        Check if an email or phone is in the DNC list.
        
        Args:
            email: Email to check
            phone: Phone to check
            
        Returns:
            Dict with DNC check results
        """
        logger.info(f"Checking DNC for email: {email}, phone: {phone}")
        
        is_dnc, dnc_lists = self.db.check_dnc(email, phone)
        
        return {
            "isDNC": is_dnc,
            "dncLists": dnc_lists,
            "email": email,
            "phone": phone
        }
    
    async def distribute_leads(self, batch_id: int, client_ids: List[int], 
                              schedule_delivery: bool = False,
                              delivery_time: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Distribute leads from a batch to specified clients.
        
        Args:
            batch_id: ID of the upload batch
            client_ids: List of client IDs to distribute to
            schedule_delivery: Whether to schedule delivery for later
            delivery_time: Time to deliver the leads
            
        Returns:
            Dict with distribution results
        """
        logger.info(f"Distributing leads from batch {batch_id} to clients {client_ids}")
        
        # Get batch details
        batch = self.db.get_upload_batch(batch_id)
        
        # Get clients
        clients = self.db.get_clients(client_ids)
        
        if not clients:
            raise ValueError("No active clients found with the provided IDs")
        
        # Get total leads to distribute
        total_leads = batch.get("cleanedLeads", 0)
        
        if total_leads <= 0:
            raise ValueError("No leads available for distribution")
        
        # Prepare distribution results
        results = {
            "batchId": batch_id,
            "totalLeads": total_leads,
            "distributions": []
        }
        
        # Calculate lead allocation
        remaining_leads = total_leads
        
        # First, allocate fixed numbers
        fixed_allocation_clients = [c for c in clients if c.get("fixedAllocation")]
        for client in fixed_allocation_clients:
            allocation = min(remaining_leads, client.get("fixedAllocation", 0))
            remaining_leads -= allocation
            
            if allocation > 0:
                # Create distribution record
                distribution_data = {
                    "batchId": batch_id,
                    "clientId": client["id"],
                    "leadsAllocated": allocation,
                    "deliveryStatus": "Pending" if schedule_delivery else "Delivered",
                    "deliveryDate": delivery_time.isoformat() if schedule_delivery and delivery_time else datetime.now().isoformat(),
                    "createdAt": datetime.now().isoformat()
                }
                
                distribution = self.db.create_distribution(distribution_data)
                
                results["distributions"].append({
                    "clientId": client["id"],
                    "clientName": client["name"],
                    "leadsAllocated": allocation,
                    "deliveryStatus": distribution_data["deliveryStatus"],
                    "deliveryDate": distribution_data["deliveryDate"]
                })
            
            if remaining_leads <= 0:
                break
        
        # Then, allocate by percentage if there are remaining leads
        percentage_clients = [c for c in clients if c.get("percentAllocation")]
        if remaining_leads > 0 and percentage_clients:
            total_percentage = sum(c.get("percentAllocation", 0) for c in percentage_clients)
            
            for client in percentage_clients:
                percentage = client.get("percentAllocation", 0)
                allocation = int((percentage / total_percentage) * remaining_leads)
                
                if allocation > 0:
                    # Create distribution record
                    distribution_data = {
                        "batchId": batch_id,
                        "clientId": client["id"],
                        "leadsAllocated": allocation,
                        "deliveryStatus": "Pending" if schedule_delivery else "Delivered",
                        "deliveryDate": delivery_time.isoformat() if schedule_delivery and delivery_time else datetime.now().isoformat(),
                        "createdAt": datetime.now().isoformat()
                    }
                    
                    distribution = self.db.create_distribution(distribution_data)
                    
                    results["distributions"].append({
                        "clientId": client["id"],
                        "clientName": client["name"],
                        "leadsAllocated": allocation,
                        "deliveryStatus": distribution_data["deliveryStatus"],
                        "deliveryDate": distribution_data["deliveryDate"]
                    })
        
        # If delivery is scheduled, create a background task to deliver later
        if schedule_delivery and delivery_time:
            # This would normally be handled by a scheduler like Celery
            # For demonstration, we'll just log it
            logger.info(f"Scheduled delivery for batch {batch_id} at {delivery_time.isoformat()}")
        
        return results
    
    async def tag_leads(self, lead_ids: List[int], tag: str, value: Optional[str] = None) -> Dict[str, Any]:
        """
        Tag leads with a specific tag.
        
        Args:
            lead_ids: List of lead IDs to tag
            tag: Tag to apply
            value: Optional value for custom tags
            
        Returns:
            Dict with tagging results
        """
        logger.info(f"Tagging {len(lead_ids)} leads with tag: {tag}")
        
        tag_to_apply = tag
        if tag == "custom" and value:
            tag_to_apply = value
        
        # Tag the leads
        tagged_count = self.db.tag_leads(lead_ids, tag_to_apply)
        
        return {
            "success": True,
            "taggedLeads": tagged_count,
            "tag": tag_to_apply
        }
    
    async def upload_revenue_data(self, file_path: str, file_type: str) -> Dict[str, Any]:
        """
        Upload and process revenue data for leads.
        
        Args:
            file_path: Path to the file in Supabase storage
            file_type: Type of the file (csv, xlsx, json)
            
        Returns:
            Dict with processing results
        """
        logger.info(f"Processing revenue data from file: {file_path}")
        
        try:
            # Download file from Supabase storage
            file_data = self.db.get_file_from_storage(file_path)
            
            # Parse file
            df = parse_file(file_data, file_type)
            
            # Expected columns: lead_id, revenue
            if "lead_id" not in df.columns or "revenue" not in df.columns:
                # Try to guess columns
                id_columns = [col for col in df.columns if "id" in col.lower()]
                revenue_columns = [col for col in df.columns if "revenue" in col.lower() or "amount" in col.lower()]
                
                if id_columns and revenue_columns:
                    df = df.rename(columns={id_columns[0]: "lead_id", revenue_columns[0]: "revenue"})
                else:
                    raise ValueError("Required columns 'lead_id' and 'revenue' not found in file")
            
            # Convert revenue to float
            df["revenue"] = pd.to_numeric(df["revenue"], errors="coerce")
            
            # Remove rows with invalid data
            df = df.dropna(subset=["lead_id", "revenue"])
            
            # Update revenue for each lead
            updated_count = 0
            for _, row in df.iterrows():
                try:
                    lead_id = int(row["lead_id"])
                    revenue = float(row["revenue"])
                    
                    self.db.update_lead_revenue(lead_id, revenue)
                    updated_count += 1
                except Exception as e:
                    logger.error(f"Error updating revenue for lead {row['lead_id']}: {str(e)}")
            
            return {
                "success": True,
                "totalRows": len(df),
                "updatedLeads": updated_count
            }
            
        except Exception as e:
            logger.error(f"Error processing revenue data: {str(e)}")
            raise
    
    async def get_roi_metrics(self, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None,
                             suppliers: Optional[List[int]] = None, clients: Optional[List[int]] = None,
                             sources: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Get ROI metrics with optional filters.
        
        Args:
            start_date: Start date for filtering
            end_date: End date for filtering
            suppliers: List of supplier IDs to filter by
            clients: List of client IDs to filter by
            sources: List of lead sources to filter by
            
        Returns:
            Dict with ROI metrics
        """
        logger.info("Getting ROI metrics")
        
        # Convert dates to strings if provided
        start_date_str = start_date.isoformat() if start_date else None
        end_date_str = end_date.isoformat() if end_date else None
        
        # Get metrics from database
        metrics = self.db.get_roi_metrics(
            start_date=start_date_str,
            end_date=end_date_str,
            supplier_ids=suppliers,
            client_ids=clients,
            sources=sources
        )
        
        return metrics
    
    async def get_supplier_performance(self, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Get performance metrics for suppliers.
        
        Args:
            start_date: Start date for filtering
            end_date: End date for filtering
            
        Returns:
            Dict with supplier performance metrics
        """
        logger.info("Getting supplier performance metrics")
        
        # Convert dates to strings if provided
        start_date_str = start_date.isoformat() if start_date else None
        end_date_str = end_date.isoformat() if end_date else None
        
        # Get metrics from database
        performance = self.db.get_supplier_performance(
            start_date=start_date_str,
            end_date=end_date_str
        )
        
        return performance
