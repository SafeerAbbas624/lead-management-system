import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Database field mapping for leads table
const DATABASE_FIELDS = {
  // Personal Information
  'email': { type: 'string', required: true, description: 'Email address' },
  'firstname': { type: 'string', required: false, description: 'First name' },
  'lastname': { type: 'string', required: false, description: 'Last name' },
  'phone': { type: 'string', required: false, description: 'Phone number' },
  
  // Company Information
  'companyname': { type: 'string', required: false, description: 'Company name' },
  'taxid': { type: 'string', required: false, description: 'Tax ID/EIN' },
  
  // Address Information
  'address': { type: 'string', required: false, description: 'Street address' },
  'city': { type: 'string', required: false, description: 'City' },
  'state': { type: 'string', required: false, description: 'State/Province' },
  'zipcode': { type: 'string', required: false, description: 'ZIP/Postal code' },
  'country': { type: 'string', required: false, description: 'Country' },
  
  // Lead Information
  'leadsource': { type: 'string', required: false, description: 'Lead source' },
  'leadstatus': { type: 'string', required: false, description: 'Lead status' },
  'leadscore': { type: 'number', required: false, description: 'Lead score (0-100)' },
  'leadcost': { type: 'number', required: false, description: 'Cost per lead' },
  'exclusivity': { type: 'boolean', required: false, description: 'Exclusivity flag' },
  'exclusivitynotes': { type: 'string', required: false, description: 'Exclusivity notes' },
  
  // Metadata
  'tags': { type: 'array', required: false, description: 'Lead tags' },
  'metadata': { type: 'object', required: false, description: 'Additional metadata' },
};

// Common field variations and their mappings
const FIELD_VARIATIONS = {
  // Email variations
  'email': ['email', 'email_address', 'mail', 'e-mail', 'emailaddress', 'email address'],
  
  // Name variations
  'firstname': ['firstname', 'first_name', 'first name', 'fname', 'given_name', 'givenname'],
  'lastname': ['lastname', 'last_name', 'last name', 'lname', 'surname', 'family_name'],
  
  // Phone variations
  'phone': ['phone', 'phone_number', 'phonenumber', 'tel', 'telephone', 'mobile', 'cell'],
  
  // Company variations
  'companyname': ['companyname', 'company_name', 'company name', 'company', 'business', 'biz', 'organization'],
  
  // Tax ID variations
  'taxid': ['taxid', 'tax_id', 'tax id', 'ein', 'ssn', 'tin'],
  
  // Address variations
  'address': ['address', 'street', 'street_address', 'address1', 'addr'],
  'city': ['city', 'town', 'locality'],
  'state': ['state', 'province', 'region', 'st'],
  'zipcode': ['zipcode', 'zip_code', 'zip', 'postal_code', 'postcode'],
  'country': ['country', 'nation', 'co'],
  
  // Lead specific variations
  'leadsource': ['leadsource', 'lead_source', 'source', 'origin', 'channel'],
  'leadstatus': ['leadstatus', 'lead_status', 'status', 'stage'],
  'leadscore': ['leadscore', 'lead_score', 'score', 'rating'],
  'leadcost': ['leadcost', 'lead_cost', 'cost', 'price', 'amount', 'loan_amount', 'loan'],
  
  // Exclusivity variations
  'exclusivity': ['exclusivity', 'exclusive', 'exclu', 'notes', 'comments', 'remarks'],
  'exclusivitynotes': ['exclusivitynotes', 'exclusivity_notes', 'notes', 'comments', 'remarks', 'extra'],
};

export async function GET(request: NextRequest) {
  try {
    // Return the field mapping rules and variations
    return NextResponse.json({
      success: true,
      databaseFields: DATABASE_FIELDS,
      fieldVariations: FIELD_VARIATIONS,
      mappingRules: {
        caseSensitive: false,
        trimWhitespace: true,
        removeSpecialChars: true,
        fuzzyMatching: true,
        confidenceThreshold: 0.7,
      }
    });
  } catch (error) {
    console.error('Error fetching field mapping rules:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch field mapping rules',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { headers, customMappings } = body;

    // Apply manual field mapping
    const mappedFields: Record<string, string> = {};
    
    // First, apply custom mappings if provided
    if (customMappings) {
      Object.assign(mappedFields, customMappings);
    }

    // Then, apply automatic mapping for unmapped headers
    for (const header of headers) {
      if (!mappedFields[header]) {
        const normalizedHeader = header.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        
        // Find best match using field variations
        let bestMatch = null;
        let bestScore = 0;

        for (const [dbField, variations] of Object.entries(FIELD_VARIATIONS)) {
          for (const variation of variations) {
            const normalizedVariation = variation.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            // Exact match
            if (normalizedHeader === normalizedVariation) {
              bestMatch = dbField;
              bestScore = 1.0;
              break;
            }
            
            // Partial match (contains)
            if (normalizedHeader.includes(normalizedVariation) || normalizedVariation.includes(normalizedHeader)) {
              const score = Math.min(normalizedHeader.length, normalizedVariation.length) / 
                           Math.max(normalizedHeader.length, normalizedVariation.length);
              if (score > bestScore && score >= 0.7) {
                bestMatch = dbField;
                bestScore = score;
              }
            }
          }
          
          if (bestScore === 1.0) break; // Perfect match found
        }

        if (bestMatch) {
          mappedFields[header] = bestMatch;
        }
      }
    }

    return NextResponse.json({
      success: true,
      mappedFields,
      unmappedHeaders: headers.filter((h: string) => !mappedFields[h]),
      confidence: Object.keys(mappedFields).length / headers.length,
    });
  } catch (error) {
    console.error('Error processing field mapping:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process field mapping',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
