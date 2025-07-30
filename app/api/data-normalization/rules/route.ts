import { NextRequest, NextResponse } from 'next/server';

// Data normalization rules
const NORMALIZATION_RULES = {
  // Phone number normalization
  phone: {
    format: 'E164', // +1234567890 or (123) 456-7890
    removeCountryCode: false,
    defaultCountryCode: '+1',
    validateFormat: true,
  },
  
  // Email normalization
  email: {
    toLowerCase: true,
    removeDotsInGmail: false, // Gmail ignores dots
    removePlusAliases: false, // Remove +alias parts
    validateDomain: true,
  },
  
  // Name normalization
  name: {
    titleCase: true, // John Doe
    removeExtraSpaces: true,
    handlePrefixes: true, // Mr., Mrs., Dr., etc.
    handleSuffixes: true, // Jr., Sr., III, etc.
  },
  
  // Address normalization
  address: {
    standardizeAbbreviations: true,
    titleCase: true,
    removeExtraSpaces: true,
    validateZipCode: true,
    standardizeStateNames: true,
  },
  
  // Company name normalization
  company: {
    removeBusinessSuffixes: false, // LLC, Inc, Corp, etc.
    titleCase: true,
    removeExtraSpaces: true,
    standardizeAbbreviations: true,
  },
  
  // Numeric normalization
  numeric: {
    removeCommas: true,
    removeCurrencySymbols: true,
    convertToNumber: true,
    handlePercentages: true,
  },
  
  // Boolean normalization
  boolean: {
    trueValues: ['true', 'yes', 'y', '1', 'on', 'enabled', 'active', 'exclu', 'exclusivity'],
    falseValues: ['false', 'no', 'n', '0', 'off', 'disabled', 'inactive'],
    caseSensitive: false,
  },
};

// State abbreviations mapping
const STATE_ABBREVIATIONS: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
};

// Normalization functions
const normalizationFunctions = {
  // Normalize phone numbers
  normalizePhone: (value: string, rules: any) => {
    if (!value || typeof value !== 'string') return value;
    
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    if (digits.length === 0) return null;
    
    // Handle different formats
    if (digits.length === 10) {
      // US phone number without country code
      if (rules.format === 'E164') {
        return `+1${digits}`;
      } else {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
    } else if (digits.length === 11 && digits.startsWith('1')) {
      // US phone number with country code
      if (rules.format === 'E164') {
        return `+${digits}`;
      } else {
        return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
      }
    }
    
    return value; // Return original if can't normalize
  },
  
  // Normalize email addresses
  normalizeEmail: (value: string, rules: any) => {
    if (!value || typeof value !== 'string') return value;
    
    let normalized = value.trim();
    
    if (rules.toLowerCase) {
      normalized = normalized.toLowerCase();
    }
    
    // Gmail-specific normalization
    if (rules.removeDotsInGmail && normalized.includes('@gmail.com')) {
      const [localPart, domain] = normalized.split('@');
      normalized = `${localPart.replace(/\./g, '')}@${domain}`;
    }
    
    // Remove plus aliases
    if (rules.removePlusAliases && normalized.includes('+')) {
      const [localPart, domain] = normalized.split('@');
      const cleanLocalPart = localPart.split('+')[0];
      normalized = `${cleanLocalPart}@${domain}`;
    }
    
    return normalized;
  },
  
  // Normalize names
  normalizeName: (value: string, rules: any) => {
    if (!value || typeof value !== 'string') return value;
    
    let normalized = value.trim();
    
    if (rules.removeExtraSpaces) {
      normalized = normalized.replace(/\s+/g, ' ');
    }
    
    if (rules.titleCase) {
      normalized = normalized.split(' ')
        .map(word => {
          // Handle common prefixes and suffixes
          const lowerWord = word.toLowerCase();
          if (['jr', 'sr', 'ii', 'iii', 'iv', 'v'].includes(lowerWord)) {
            return word.toUpperCase();
          }
          if (['mr', 'mrs', 'ms', 'dr', 'prof'].includes(lowerWord.replace('.', ''))) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() + (word.includes('.') ? '' : '.');
          }
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
    }
    
    return normalized;
  },
  
  // Normalize addresses
  normalizeAddress: (value: string, rules: any) => {
    if (!value || typeof value !== 'string') return value;
    
    let normalized = value.trim();
    
    if (rules.removeExtraSpaces) {
      normalized = normalized.replace(/\s+/g, ' ');
    }
    
    if (rules.standardizeAbbreviations) {
      const abbreviations: Record<string, string> = {
        'street': 'St', 'avenue': 'Ave', 'boulevard': 'Blvd', 'drive': 'Dr',
        'lane': 'Ln', 'road': 'Rd', 'court': 'Ct', 'place': 'Pl',
        'apartment': 'Apt', 'suite': 'Ste', 'building': 'Bldg',
        'north': 'N', 'south': 'S', 'east': 'E', 'west': 'W',
        'northeast': 'NE', 'northwest': 'NW', 'southeast': 'SE', 'southwest': 'SW'
      };
      
      for (const [full, abbr] of Object.entries(abbreviations)) {
        const regex = new RegExp(`\\b${full}\\b`, 'gi');
        normalized = normalized.replace(regex, abbr);
      }
    }
    
    if (rules.titleCase) {
      normalized = normalized.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    return normalized;
  },
  
  // Normalize state names
  normalizeState: (value: string, rules: any) => {
    if (!value || typeof value !== 'string') return value;
    
    const normalized = value.trim().toLowerCase();
    
    // Check if it's already an abbreviation
    if (normalized.length === 2) {
      return normalized.toUpperCase();
    }
    
    // Look up full state name
    const abbreviation = STATE_ABBREVIATIONS[normalized];
    return abbreviation || value;
  },
  
  // Normalize numeric values
  normalizeNumeric: (value: any, rules: any) => {
    if (value === null || value === undefined || value === '') return null;
    
    let normalized = String(value);
    
    if (rules.removeCommas) {
      normalized = normalized.replace(/,/g, '');
    }
    
    if (rules.removeCurrencySymbols) {
      normalized = normalized.replace(/[$£€¥]/g, '');
    }
    
    if (rules.handlePercentages && normalized.includes('%')) {
      normalized = normalized.replace('%', '');
      const num = parseFloat(normalized);
      return isNaN(num) ? null : num / 100;
    }
    
    if (rules.convertToNumber) {
      const num = parseFloat(normalized);
      return isNaN(num) ? null : num;
    }
    
    return normalized;
  },
  
  // Normalize boolean values
  normalizeBoolean: (value: any, rules: any) => {
    if (value === null || value === undefined || value === '') return null;
    
    const normalized = String(value).trim();
    const compareValue = rules.caseSensitive ? normalized : normalized.toLowerCase();
    
    if (rules.trueValues.includes(compareValue)) {
      return true;
    }
    
    if (rules.falseValues.includes(compareValue)) {
      return false;
    }
    
    // Check if it contains exclusivity keywords
    if (compareValue.includes('exclu')) {
      return true;
    }
    
    return null; // Unable to determine boolean value
  },
  
  // Normalize company names
  normalizeCompany: (value: string, rules: any) => {
    if (!value || typeof value !== 'string') return value;
    
    let normalized = value.trim();
    
    if (rules.removeExtraSpaces) {
      normalized = normalized.replace(/\s+/g, ' ');
    }
    
    if (rules.titleCase) {
      normalized = normalized.split(' ')
        .map(word => {
          // Keep business suffixes in proper case
          const lowerWord = word.toLowerCase().replace(/[.,]/g, '');
          if (['llc', 'inc', 'corp', 'ltd', 'co', 'company', 'corporation'].includes(lowerWord)) {
            return word.toUpperCase();
          }
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
    }
    
    return normalized;
  },
};

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      normalizationRules: NORMALIZATION_RULES,
      availableFunctions: Object.keys(normalizationFunctions),
      stateAbbreviations: STATE_ABBREVIATIONS,
    });
  } catch (error) {
    console.error('Error fetching data normalization rules:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch data normalization rules',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, fieldMappings, customRules } = body;

    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid data format. Expected array of objects.');
    }

    // Merge custom rules with default rules
    const rules = { ...NORMALIZATION_RULES, ...customRules };

    // Normalize each row of data
    const normalizedData = data.map((row: any) => {
      const normalizedRow: any = {};

      for (const [field, value] of Object.entries(row)) {
        let normalizedValue = value;

        // Apply appropriate normalization based on field type
        if (field === 'email') {
          normalizedValue = normalizationFunctions.normalizeEmail(value as string, rules.email);
        } else if (field === 'phone') {
          normalizedValue = normalizationFunctions.normalizePhone(value as string, rules.phone);
        } else if (['firstname', 'lastname'].includes(field)) {
          normalizedValue = normalizationFunctions.normalizeName(value as string, rules.name);
        } else if (field === 'address') {
          normalizedValue = normalizationFunctions.normalizeAddress(value as string, rules.address);
        } else if (field === 'state') {
          normalizedValue = normalizationFunctions.normalizeState(value as string, rules.address);
        } else if (field === 'companyname') {
          normalizedValue = normalizationFunctions.normalizeCompany(value as string, rules.company);
        } else if (['leadcost', 'leadscore'].includes(field)) {
          normalizedValue = normalizationFunctions.normalizeNumeric(value, rules.numeric);
        } else if (field === 'exclusivity') {
          normalizedValue = normalizationFunctions.normalizeBoolean(value, rules.boolean);
        }

        normalizedRow[field] = normalizedValue;
      }

      return normalizedRow;
    });

    // Calculate normalization statistics
    const stats = {
      totalRows: data.length,
      normalizedRows: normalizedData.length,
      fieldsProcessed: Object.keys(fieldMappings || {}).length,
      phoneNumbersNormalized: 0,
      emailsNormalized: 0,
      namesNormalized: 0,
      addressesNormalized: 0,
      booleansNormalized: 0,
    };

    // Count normalized fields
    normalizedData.forEach(row => {
      if (row.phone) stats.phoneNumbersNormalized++;
      if (row.email) stats.emailsNormalized++;
      if (row.firstname || row.lastname) stats.namesNormalized++;
      if (row.address) stats.addressesNormalized++;
      if (typeof row.exclusivity === 'boolean') stats.booleansNormalized++;
    });

    return NextResponse.json({
      success: true,
      normalizedData,
      stats,
      rulesApplied: rules,
    });
  } catch (error) {
    console.error('Error applying data normalization:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to apply data normalization',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
