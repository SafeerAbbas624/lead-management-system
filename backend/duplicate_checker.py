from typing import List, Dict, Any, Set, Tuple
import re
from difflib import SequenceMatcher

class DuplicateChecker:
    """Utility class for checking duplicates in lead data."""
    
    def __init__(self):
        self.email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        self.phone_pattern = re.compile(r'^\+?1?\d{9,15}$')
    
    def find_duplicates(self, leads: List[Dict[str, Any]], existing_leads: List[Dict[str, Any]] = None) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Find duplicates within leads and against existing leads.
        Returns tuple of (unique_leads, duplicate_leads)
        """
        unique_leads = []
        duplicate_leads = []
        seen_emails = set()
        seen_phones = set()
        
        # First check against existing leads if provided
        if existing_leads:
            for lead in existing_leads:
                if lead.get('email'):
                    seen_emails.add(self._normalize_email(lead['email']))
                if lead.get('phone'):
                    seen_phones.add(self._normalize_phone(lead['phone']))
        
        # Then check within current batch
        for lead in leads:
            is_duplicate = False
            email = lead.get('email', '').strip()
            phone = lead.get('phone', '').strip()
            
            if email:
                normalized_email = self._normalize_email(email)
                if normalized_email in seen_emails:
                    is_duplicate = True
                else:
                    seen_emails.add(normalized_email)
            
            if phone:
                normalized_phone = self._normalize_phone(phone)
                if normalized_phone in seen_phones:
                    is_duplicate = True
                else:
                    seen_phones.add(normalized_phone)
            
            if is_duplicate:
                duplicate_leads.append(lead)
            else:
                unique_leads.append(lead)
        
        return unique_leads, duplicate_leads
    
    def _normalize_email(self, email: str) -> str:
        """Normalize email for comparison."""
        return email.lower().strip()
    
    def _normalize_phone(self, phone: str) -> str:
        """Normalize phone number for comparison."""
        # Remove all non-digit characters
        digits = re.sub(r'\D', '', phone)
        # If it starts with 1, remove it
        if digits.startswith('1') and len(digits) > 10:
            digits = digits[1:]
        return digits
    
    def is_valid_email(self, email: str) -> bool:
        """Check if email is valid."""
        return bool(self.email_pattern.match(email))
    
    def is_valid_phone(self, phone: str) -> bool:
        """Check if phone number is valid."""
        normalized = self._normalize_phone(phone)
        return bool(self.phone_pattern.match(normalized))
    
    def calculate_similarity(self, str1: str, str2: str) -> float:
        """Calculate similarity between two strings."""
        return SequenceMatcher(None, str1.lower(), str2.lower()).ratio()

    # Method required for hybrid system
    async def check_duplicates(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Check for duplicates and return results in hybrid system format"""

        # Use existing find_duplicates method
        unique_leads, duplicate_leads = self.find_duplicates(data)

        # Calculate statistics
        stats = {
            'total_leads': len(data),
            'duplicate_count': len(duplicate_leads),
            'clean_leads': len(unique_leads),
            'file_internal_duplicates': len(duplicate_leads),  # All duplicates are internal for now
            'database_duplicates': 0,  # Would need database integration
            'email_duplicates': len([d for d in duplicate_leads if d.get('email')]),
            'phone_duplicates': len([d for d in duplicate_leads if d.get('phone')]),
        }

        return {
            'success': True,
            'duplicate_count': len(duplicate_leads),
            'duplicates': duplicate_leads,
            'clean_data': unique_leads,
            'stats': stats
        }