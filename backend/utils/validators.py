import re
import phonenumbers
from email_validator import validate_email, EmailNotValidError
from typing import Optional, Tuple, Dict, Any, List
import logging

logger = logging.getLogger(__name__)

def validate_and_format_email(email: str) -> Tuple[bool, Optional[str]]:
    """
    Validate email format and return formatted email if valid.
    
    Args:
        email: Email address to validate
        
    Returns:
        Tuple of (is_valid, formatted_email)
    """
    if not email or not isinstance(email, str):
        return False, None
        
    try:
        valid = validate_email(email)
        return True, valid.email
    except EmailNotValidError:
        return False, None

def validate_and_format_phone(phone: str, country_code: str = "US") -> Tuple[bool, Optional[str]]:
    """
    Validate phone number format and return formatted phone if valid.
    
    Args:
        phone: Phone number to validate
        country_code: ISO country code for phone number format
        
    Returns:
        Tuple of (is_valid, formatted_phone)
    """
    if not phone or not isinstance(phone, str):
        return False, None
        
    # Remove non-numeric characters
    digits_only = re.sub(r'\D', '', phone)
    
    if not digits_only:
        return False, None
        
    try:
        # Add country code if missing and needed
        if not digits_only.startswith('1') and country_code == 'US':
            digits_only = '1' + digits_only
            
        # Parse phone number
        parsed = phonenumbers.parse(digits_only, country_code)
        
        # Check if valid
        if not phonenumbers.is_valid_number(parsed):
            return False, None
            
        # Format to standard format
        formatted = phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.NATIONAL)
        return True, formatted
    except Exception as e:
        logger.debug(f"Phone validation error: {str(e)}")
        return False, None

def validate_zip_code(zip_code: str, country: str = "US") -> Tuple[bool, Optional[str]]:
    """
    Validate zip/postal code format.
    
    Args:
        zip_code: Zip or postal code to validate
        country: Country code for validation rules
        
    Returns:
        Tuple of (is_valid, formatted_zip_code)
    """
    if not zip_code or not isinstance(zip_code, str):
        return False, None
        
    zip_code = zip_code.strip()
    
    if country == "US":
        # US ZIP code: 5 digits or 5+4
        if re.match(r'^\d{5}(?:-\d{4})?$', zip_code):
            return True, zip_code
    elif country == "CA":
        # Canadian postal code: A1A 1A1
        if re.match(r'^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$', zip_code):
            return True, zip_code.upper()
    elif country == "UK":
        # UK postcode
        if re.match(r'^[A-Za-z]{1,2}\d[A-Za-z\d]? \d[A-Za-z]{2}$', zip_code):
            return True, zip_code.upper()
    else:
        # Generic validation - just check if it's not empty
        return True, zip_code
        
    return False, None

def validate_name(name: str) -> Tuple[bool, Optional[str]]:
    """
    Validate and format a name.
    
    Args:
        name: Name to validate
        
    Returns:
        Tuple of (is_valid, formatted_name)
    """
    if not name or not isinstance(name, str):
        return False, None
        
    name = name.strip()
    
    if not name:
        return False, None
        
    # Basic validation - just check for minimum length
    if len(name) < 2:
        return False, None
        
    # Format to proper case
    formatted = name.title()
    
    # Handle special cases like "McDonald"
    if "mc" in name.lower():
        formatted = re.sub(r'Mc(\w)', lambda m: 'Mc' + m.group(1).upper(), formatted)
        
    # Handle hyphenated names
    if "-" in formatted:
        parts = formatted.split("-")
        formatted = "-".join(part.capitalize() for part in parts)
        
    return True, formatted

def correct_common_typos(text: str, corrections: Dict[str, str]) -> str:
    """
    Correct common typos in text.
    
    Args:
        text: Text to correct
        corrections: Dictionary of typos and their corrections
        
    Returns:
        Corrected text
    """
    if not text or not isinstance(text, str):
        return text
        
    for typo, correction in corrections.items():
        text = text.replace(typo, correction)
        
    return text

def validate_lead_data(lead: Dict[str, Any], required_fields: List[str] = None) -> Tuple[bool, Dict[str, Any], List[str]]:
    """
    Validate lead data and return cleaned data and validation issues.
    
    Args:
        lead: Dictionary of lead data
        required_fields: List of field names that are required
        
    Returns:
        Tuple of (is_valid, cleaned_lead, validation_issues)
    """
    if required_fields is None:
        required_fields = ["email"]
        
    cleaned_lead = {}
    validation_issues = []
    
    # Check required fields
    for field in required_fields:
        if field not in lead or not lead[field]:
            validation_issues.append(f"Missing required field: {field}")
    
    # Validate email
    if "email" in lead and lead["email"]:
        is_valid, formatted = validate_and_format_email(lead["email"])
        if is_valid:
            cleaned_lead["email"] = formatted
        else:
            validation_issues.append("Invalid email format")
            cleaned_lead["email"] = lead["email"]  # Keep original for reference
    
    # Validate phone
    if "phone" in lead and lead["phone"]:
        is_valid, formatted = validate_and_format_phone(lead["phone"])
        if is_valid:
            cleaned_lead["phone"] = formatted
        else:
            validation_issues.append("Invalid phone format")
            cleaned_lead["phone"] = lead["phone"]  # Keep original for reference
    
    # Validate names
    for field in ["firstName", "lastName"]:
        if field in lead and lead[field]:
            is_valid, formatted = validate_name(lead[field])
            if is_valid:
                cleaned_lead[field] = formatted
            else:
                validation_issues.append(f"Invalid {field} format")
                cleaned_lead[field] = lead[field]  # Keep original for reference
    
    # Copy other fields
    for field, value in lead.items():
        if field not in cleaned_lead:
            cleaned_lead[field] = value
    
    # Overall validation result
    is_valid = len(validation_issues) == 0 or not any("Invalid" in issue for issue in validation_issues)
    
    return is_valid, cleaned_lead, validation_issues
