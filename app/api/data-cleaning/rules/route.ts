import { NextRequest, NextResponse } from 'next/server';

// Data cleaning rules configuration
const CLEANING_RULES = {
  // Text cleaning rules
  text: {
    trimWhitespace: true,
    removeExtraSpaces: true,
    removeSpecialChars: false, // Keep special chars by default
    toLowerCase: false, // Don't change case by default
    removeEmptyValues: true,
    maxLength: 255,
  },
  
  // Email cleaning rules
  email: {
    toLowerCase: true,
    trimWhitespace: true,
    validateFormat: true,
    removeDuplicates: true,
    removeInvalidEmails: true,
  },
  
  // Phone cleaning rules
  phone: {
    removeNonDigits: false, // Keep formatting by default
    standardizeFormat: true,
    removeCountryCode: false,
    validateLength: true,
    minLength: 10,
    maxLength: 15,
  },
  
  // Name cleaning rules
  name: {
    trimWhitespace: true,
    removeExtraSpaces: true,
    capitalizeFirst: true,
    removeNumbers: true,
    removeSpecialChars: false,
  },
  
  // Address cleaning rules
  address: {
    trimWhitespace: true,
    removeExtraSpaces: true,
    standardizeAbbreviations: true,
    capitalizeWords: true,
  },
  
  // Numeric cleaning rules
  numeric: {
    removeNonNumeric: true,
    convertToNumber: true,
    handleNegatives: true,
    decimalPlaces: 2,
  },
  
  // Date cleaning rules
  date: {
    standardizeFormat: true,
    defaultFormat: 'YYYY-MM-DD',
    handleInvalidDates: true,
    timezone: 'UTC',
  },
};

// Cleaning functions
const cleaningFunctions = {
  // Clean text fields
  cleanText: (value: string, rules: any) => {
    if (!value || typeof value !== 'string') return value;
    
    let cleaned = value;
    
    if (rules.trimWhitespace) {
      cleaned = cleaned.trim();
    }
    
    if (rules.removeExtraSpaces) {
      cleaned = cleaned.replace(/\s+/g, ' ');
    }
    
    if (rules.removeSpecialChars) {
      cleaned = cleaned.replace(/[^a-zA-Z0-9\s]/g, '');
    }
    
    if (rules.toLowerCase) {
      cleaned = cleaned.toLowerCase();
    }
    
    if (rules.removeEmptyValues && cleaned === '') {
      return null;
    }
    
    if (rules.maxLength && cleaned.length > rules.maxLength) {
      cleaned = cleaned.substring(0, rules.maxLength);
    }
    
    return cleaned;
  },
  
  // Clean email addresses
  cleanEmail: (value: string, rules: any) => {
    if (!value || typeof value !== 'string') return value;
    
    let cleaned = value;
    
    if (rules.trimWhitespace) {
      cleaned = cleaned.trim();
    }
    
    if (rules.toLowerCase) {
      cleaned = cleaned.toLowerCase();
    }
    
    if (rules.validateFormat) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleaned)) {
        return rules.removeInvalidEmails ? null : cleaned;
      }
    }
    
    return cleaned;
  },
  
  // Clean phone numbers
  cleanPhone: (value: string, rules: any) => {
    if (!value || typeof value !== 'string') return value;
    
    let cleaned = value;
    
    if (rules.removeNonDigits) {
      cleaned = cleaned.replace(/\D/g, '');
    }
    
    if (rules.standardizeFormat) {
      // Remove all non-digits first
      const digits = cleaned.replace(/\D/g, '');
      
      // Format based on length
      if (digits.length === 10) {
        cleaned = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      } else if (digits.length === 11 && digits.startsWith('1')) {
        cleaned = `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
      }
    }
    
    if (rules.validateLength) {
      const digits = cleaned.replace(/\D/g, '');
      if (digits.length < rules.minLength || digits.length > rules.maxLength) {
        return null; // Invalid phone number
      }
    }
    
    return cleaned;
  },
  
  // Clean names
  cleanName: (value: string, rules: any) => {
    if (!value || typeof value !== 'string') return value;
    
    let cleaned = value;
    
    if (rules.trimWhitespace) {
      cleaned = cleaned.trim();
    }
    
    if (rules.removeExtraSpaces) {
      cleaned = cleaned.replace(/\s+/g, ' ');
    }
    
    if (rules.removeNumbers) {
      cleaned = cleaned.replace(/\d/g, '');
    }
    
    if (rules.removeSpecialChars) {
      cleaned = cleaned.replace(/[^a-zA-Z\s]/g, '');
    }
    
    if (rules.capitalizeFirst) {
      cleaned = cleaned.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    return cleaned;
  },
  
  // Clean numeric values
  cleanNumeric: (value: any, rules: any) => {
    if (value === null || value === undefined || value === '') return null;
    
    let cleaned = String(value);
    
    if (rules.removeNonNumeric) {
      // Keep decimal points and negative signs
      cleaned = cleaned.replace(/[^0-9.-]/g, '');
    }
    
    if (rules.convertToNumber) {
      const num = parseFloat(cleaned);
      if (isNaN(num)) return null;
      
      if (rules.decimalPlaces !== undefined) {
        return parseFloat(num.toFixed(rules.decimalPlaces));
      }
      
      return num;
    }
    
    return cleaned;
  },
  
  // Clean addresses
  cleanAddress: (value: string, rules: any) => {
    if (!value || typeof value !== 'string') return value;
    
    let cleaned = value;
    
    if (rules.trimWhitespace) {
      cleaned = cleaned.trim();
    }
    
    if (rules.removeExtraSpaces) {
      cleaned = cleaned.replace(/\s+/g, ' ');
    }
    
    if (rules.standardizeAbbreviations) {
      // Common address abbreviations
      const abbreviations: Record<string, string> = {
        'street': 'St',
        'avenue': 'Ave',
        'boulevard': 'Blvd',
        'drive': 'Dr',
        'lane': 'Ln',
        'road': 'Rd',
        'court': 'Ct',
        'place': 'Pl',
        'apartment': 'Apt',
        'suite': 'Ste',
      };
      
      for (const [full, abbr] of Object.entries(abbreviations)) {
        const regex = new RegExp(`\\b${full}\\b`, 'gi');
        cleaned = cleaned.replace(regex, abbr);
      }
    }
    
    if (rules.capitalizeWords) {
      cleaned = cleaned.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    return cleaned;
  },
};

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      cleaningRules: CLEANING_RULES,
      availableFunctions: Object.keys(cleaningFunctions),
    });
  } catch (error) {
    console.error('Error fetching data cleaning rules:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch data cleaning rules',
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
    const rules = { ...CLEANING_RULES, ...customRules };

    // Clean each row of data
    const cleanedData = data.map((row: any) => {
      const cleanedRow: any = {};

      for (const [originalField, value] of Object.entries(row)) {
        const mappedField = fieldMappings?.[originalField] || originalField;
        let cleanedValue = value;

        // Apply appropriate cleaning based on field type
        if (mappedField === 'email') {
          cleanedValue = cleaningFunctions.cleanEmail(value as string, rules.email);
        } else if (mappedField === 'phone') {
          cleanedValue = cleaningFunctions.cleanPhone(value as string, rules.phone);
        } else if (['firstname', 'lastname'].includes(mappedField)) {
          cleanedValue = cleaningFunctions.cleanName(value as string, rules.name);
        } else if (mappedField === 'address') {
          cleanedValue = cleaningFunctions.cleanAddress(value as string, rules.address);
        } else if (['leadcost', 'leadscore'].includes(mappedField)) {
          cleanedValue = cleaningFunctions.cleanNumeric(value, rules.numeric);
        } else {
          cleanedValue = cleaningFunctions.cleanText(value as string, rules.text);
        }

        cleanedRow[mappedField] = cleanedValue;
      }

      return cleanedRow;
    });

    // Calculate cleaning statistics
    const stats = {
      totalRows: data.length,
      cleanedRows: cleanedData.length,
      fieldsProcessed: Object.keys(fieldMappings || {}).length,
      nullValuesRemoved: 0,
      invalidEmailsRemoved: 0,
      invalidPhonesRemoved: 0,
    };

    // Count null values and invalid data
    cleanedData.forEach(row => {
      Object.values(row).forEach(value => {
        if (value === null || value === undefined || value === '') {
          stats.nullValuesRemoved++;
        }
      });
    });

    return NextResponse.json({
      success: true,
      cleanedData,
      stats,
      rulesApplied: rules,
    });
  } catch (error) {
    console.error('Error applying data cleaning:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to apply data cleaning',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
