from typing import List, Dict, Any, Optional
import re
import difflib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from sentence_transformers import SentenceTransformer

class FieldMapper:
    """Field mapping utility class."""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer()
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.field_patterns = {
            'email': ['email', 'e-mail', 'mail'],
            'phone': ['phone', 'phone1', 'phone2', 'mobile', 'cell', 'telephone'],
            'firstname': ['firstname', 'first name', 'first_name', 'fname'],
            'lastname': ['lastname', 'last name', 'last_name', 'lname'],
            'companyname': ['companyname', 'company name', 'company_name', 'company'],
            'revenue': ['revenue', 'annual revenue', 'yearly revenue'],
            'dnc': ['dnc', 'do not call', 'do_not_call']
        }
    
    def map_fields(self, headers: List[str], sample_data: Optional[List[Dict[str, Any]]] = None) -> Dict[str, str]:
        """Map CSV headers to internal field names."""
        mapping = {}
        
        # First try direct matches
        for internal_field, possible_names in self.field_patterns.items():
            for header in headers:
                header_lower = header.lower()
                if any(name in header_lower for name in possible_names):
                    mapping[internal_field] = header
                    break
        
        # For remaining fields, use NLP similarity
        header_embeddings = self.model.encode(headers)
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
        
        return mapping
    
    def _calculate_similarity(self, source: str, target_patterns: List[str]) -> float:
        """Calculate similarity between source and target patterns."""
        source_clean = re.sub(r'[^a-zA-Z0-9]', '', source.lower())
        max_similarity = 0
        
        for pattern in target_patterns:
            pattern_clean = re.sub(r'[^a-zA-Z0-9]', '', pattern.lower())
            if source_clean == pattern_clean:
                return 1.0
            if pattern_clean in source_clean or source_clean in pattern_clean:
                max_similarity = max(max_similarity, 0.8)
            
            seq_similarity = difflib.SequenceMatcher(None, source_clean, pattern_clean).ratio()
            max_similarity = max(max_similarity, seq_similarity)
            
            try:
                source_vec = self.vectorizer.transform([source_clean])
                pattern_vec = self.vectorizer.transform([pattern_clean])
                cosine_sim = cosine_similarity(source_vec, pattern_vec)[0][0]
                max_similarity = max(max_similarity, cosine_sim)
            except Exception:
                pass
        
        return max_similarity 