import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// Database field mapping for leads table
const DATABASE_FIELDS = {
  'email': { type: 'string', required: true, description: 'Email address' },
  'firstname': { type: 'string', required: false, description: 'First name' },
  'lastname': { type: 'string', required: false, description: 'Last name' },
  'phone': { type: 'string', required: false, description: 'Phone number' },
  'companyname': { type: 'string', required: false, description: 'Company name' },
  'taxid': { type: 'string', required: false, description: 'Tax ID/EIN' },
  'address': { type: 'string', required: false, description: 'Street address' },
  'city': { type: 'string', required: false, description: 'City' },
  'state': { type: 'string', required: false, description: 'State/Province' },
  'zipcode': { type: 'string', required: false, description: 'ZIP/Postal code' },
  'country': { type: 'string', required: false, description: 'Country' },
  'leadsource': { type: 'string', required: false, description: 'Lead source' },
  'leadstatus': { type: 'string', required: false, description: 'Lead status' },
  'leadscore': { type: 'number', required: false, description: 'Lead score (0-100)' },
  'leadcost': { type: 'number', required: false, description: 'Cost per lead' },
  'exclusivity': { type: 'boolean', required: false, description: 'Exclusivity flag' },
  'exclusivitynotes': { type: 'string', required: false, description: 'Exclusivity notes' },
  'tags': { type: 'array', required: false, description: 'Lead tags' },
  'metadata': { type: 'object', required: false, description: 'Additional metadata' },
};

// Enhanced field variations with fuzzy matching
const FIELD_VARIATIONS = {
  'email': ['email', 'email_address', 'emailaddress', 'mail', 'e-mail', 'e_mail', 'email address'],
  'firstname': ['firstname', 'first_name', 'first name', 'fname', 'given_name', 'givenname', 'given name'],
  'lastname': ['lastname', 'last_name', 'last name', 'lname', 'surname', 'family_name', 'familyname'],
  'phone': ['phone', 'phone_number', 'phonenumber', 'tel', 'telephone', 'mobile', 'cell', 'phone number'],
  'companyname': ['companyname', 'company_name', 'company name', 'company', 'business', 'biz', 'organization', 'org'],
  'taxid': ['taxid', 'tax_id', 'tax id', 'ein', 'ssn', 'tin', 'tax_number'],
  'address': ['address', 'street', 'street_address', 'streetaddress', 'address1', 'addr', 'street address'],
  'city': ['city', 'town', 'locality', 'municipality'],
  'state': ['state', 'province', 'region', 'st', 'prov'],
  'zipcode': ['zipcode', 'zip_code', 'zip', 'postal_code', 'postcode', 'postal code', 'zip code'],
  'country': ['country', 'nation', 'co', 'nationality'],
  'leadsource': ['leadsource', 'lead_source', 'source', 'origin', 'channel', 'lead source'],
  'leadstatus': ['leadstatus', 'lead_status', 'status', 'stage', 'lead status'],
  'leadscore': ['leadscore', 'lead_score', 'score', 'rating', 'lead score'],
  'leadcost': ['leadcost', 'lead_cost', 'cost', 'price', 'amount', 'loan_amount', 'loan', 'lead cost'],
  'exclusivity': ['exclusivity', 'exclusive', 'exclu', 'exclus', 'notes', 'comments', 'remarks'],
  'exclusivitynotes': ['exclusivitynotes', 'exclusivity_notes', 'notes', 'comments', 'remarks', 'extra', 'exclusivity notes'],
};

// Function to calculate string similarity
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

// Function to parse file content
async function parseFileContent(file: File): Promise<{ headers: string[], data: any[] }> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  if (fileExtension === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
          } else {
            resolve({
              headers: results.meta.fields || [],
              data: results.data as any[]
            });
          }
        },
        error: (error) => reject(error)
      });
    });
  } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (jsonData.length === 0) {
      throw new Error('Excel file is empty');
    }

    const headers = jsonData[0] as string[];
    const data = jsonData.slice(1).map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = (row as any[])[index] || '';
      });
      return obj;
    });

    return { headers, data };
  } else {
    throw new Error('Unsupported file format. Please upload CSV or Excel files.');
  }
}

// Function to perform intelligent field mapping
function performAutoMapping(headers: string[]): { mappedFields: Record<string, string>, unmappedHeaders: string[], confidence: number } {
  const mappedFields: Record<string, string> = {};
  const unmappedHeaders: string[] = [];
  let totalConfidence = 0;
  let mappedCount = 0;

  for (const header of headers) {
    const normalizedHeader = header.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    let bestMatch = null;
    let bestScore = 0;

    // Try exact matches first
    for (const [dbField, variations] of Object.entries(FIELD_VARIATIONS)) {
      for (const variation of variations) {
        const normalizedVariation = variation.toLowerCase().replace(/[^a-z0-9]/g, '');

        // Exact match
        if (normalizedHeader === normalizedVariation) {
          bestMatch = dbField;
          bestScore = 1.0;
          break;
        }

        // Fuzzy match
        const similarity = calculateSimilarity(normalizedHeader, normalizedVariation);
        if (similarity > bestScore && similarity >= 0.7) {
          bestMatch = dbField;
          bestScore = similarity;
        }
      }

      if (bestScore === 1.0) break; // Perfect match found
    }

    if (bestMatch && bestScore >= 0.7) {
      mappedFields[header] = bestMatch;
      totalConfidence += bestScore;
      mappedCount++;
    } else {
      unmappedHeaders.push(header);
    }
  }

  const overallConfidence = mappedCount > 0 ? totalConfidence / mappedCount : 0;

  return {
    mappedFields,
    unmappedHeaders,
    confidence: overallConfidence
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new Error('No file provided');
    }

    // Parse file content
    const { headers, data } = await parseFileContent(file);

    if (headers.length === 0) {
      throw new Error('No headers found in file');
    }

    if (data.length === 0) {
      throw new Error('No data found in file');
    }

    // Perform auto mapping
    const { mappedFields, unmappedHeaders, confidence } = performAutoMapping(headers);

    // Apply field mapping to data
    const mappedData = data.map(row => {
      const mappedRow: any = {};

      for (const [originalHeader, value] of Object.entries(row)) {
        const mappedField = mappedFields[originalHeader];
        if (mappedField) {
          mappedRow[mappedField] = value;
        } else {
          // Keep unmapped fields as-is for manual review
          mappedRow[originalHeader] = value;
        }
      }

      return mappedRow;
    });

    return NextResponse.json({
      success: true,
      originalHeaders: headers,
      mappedFields,
      unmappedHeaders,
      data: mappedData,
      confidence,
    });
  } catch (error) {
    console.error('Error in auto-mapping:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process file for auto-mapping',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
