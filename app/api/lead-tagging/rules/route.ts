import { NextRequest, NextResponse } from 'next/server';

// Lead tagging rules configuration
const TAGGING_RULES = {
  // Exclusivity-based tags
  exclusivity: {
    enabled: true,
    keywords: ['exclu', 'exclusivity', 'exclusive', 'excl'],
    tags: ['exclusive', 'high-priority'],
    caseSensitive: false,
  },
  
  // Lead score-based tags
  leadScore: {
    enabled: true,
    ranges: [
      { min: 90, max: 100, tags: ['hot-lead', 'high-priority'] },
      { min: 70, max: 89, tags: ['warm-lead', 'medium-priority'] },
      { min: 50, max: 69, tags: ['cold-lead', 'low-priority'] },
      { min: 0, max: 49, tags: ['very-cold', 'nurture'] },
    ],
  },
  
  // Lead cost-based tags
  leadCost: {
    enabled: true,
    ranges: [
      { min: 100, max: Infinity, tags: ['premium-lead', 'high-value'] },
      { min: 50, max: 99, tags: ['standard-lead', 'medium-value'] },
      { min: 20, max: 49, tags: ['budget-lead', 'low-value'] },
      { min: 0, max: 19, tags: ['cheap-lead', 'bulk'] },
    ],
  },
  
  // Company size-based tags (based on company name patterns)
  companySize: {
    enabled: true,
    patterns: [
      { keywords: ['inc', 'corp', 'corporation', 'llc', 'ltd'], tags: ['business', 'b2b'] },
      { keywords: ['consulting', 'services', 'solutions'], tags: ['service-provider', 'b2b'] },
      { keywords: ['group', 'holdings', 'enterprises'], tags: ['large-business', 'enterprise'] },
    ],
    caseSensitive: false,
  },
  
  // Geographic tags
  geographic: {
    enabled: true,
    stateMapping: {
      'CA': ['california', 'west-coast', 'high-tech'],
      'NY': ['new-york', 'east-coast', 'finance'],
      'TX': ['texas', 'south', 'energy'],
      'FL': ['florida', 'south', 'tourism'],
      'WA': ['washington', 'west-coast', 'tech'],
      'IL': ['illinois', 'midwest', 'manufacturing'],
    },
    cityMapping: {
      'new york': ['metro', 'urban', 'high-density'],
      'los angeles': ['metro', 'urban', 'entertainment'],
      'chicago': ['metro', 'urban', 'finance'],
      'houston': ['metro', 'urban', 'energy'],
      'san francisco': ['metro', 'urban', 'tech'],
    },
  },
  
  // Industry-based tags (based on keywords in company name or notes)
  industry: {
    enabled: true,
    patterns: [
      { keywords: ['tech', 'software', 'digital', 'app', 'web'], tags: ['technology', 'software'] },
      { keywords: ['medical', 'health', 'clinic', 'hospital', 'pharma'], tags: ['healthcare', 'medical'] },
      { keywords: ['real estate', 'property', 'realty', 'homes'], tags: ['real-estate', 'property'] },
      { keywords: ['finance', 'bank', 'investment', 'capital'], tags: ['finance', 'banking'] },
      { keywords: ['restaurant', 'food', 'catering', 'dining'], tags: ['food-service', 'hospitality'] },
      { keywords: ['construction', 'building', 'contractor'], tags: ['construction', 'trades'] },
      { keywords: ['retail', 'store', 'shop', 'market'], tags: ['retail', 'commerce'] },
      { keywords: ['education', 'school', 'university', 'training'], tags: ['education', 'academic'] },
    ],
    caseSensitive: false,
  },
  
  // Contact quality tags
  contactQuality: {
    enabled: true,
    rules: [
      { condition: 'hasEmail', tags: ['email-contact'] },
      { condition: 'hasPhone', tags: ['phone-contact'] },
      { condition: 'hasBoth', tags: ['multi-contact', 'high-quality'] },
      { condition: 'hasCompany', tags: ['business-contact'] },
      { condition: 'hasAddress', tags: ['verified-address'] },
    ],
  },
  
  // Data completeness tags
  dataCompleteness: {
    enabled: true,
    thresholds: [
      { percentage: 90, tags: ['complete-profile', 'high-quality'] },
      { percentage: 70, tags: ['good-profile', 'medium-quality'] },
      { percentage: 50, tags: ['partial-profile', 'needs-enrichment'] },
      { percentage: 0, tags: ['incomplete-profile', 'low-quality'] },
    ],
  },
  
  // Custom keyword-based tags
  customKeywords: {
    enabled: true,
    patterns: [
      { keywords: ['urgent', 'asap', 'immediate'], tags: ['urgent', 'time-sensitive'] },
      { keywords: ['budget', 'cheap', 'affordable'], tags: ['price-sensitive', 'budget-conscious'] },
      { keywords: ['premium', 'luxury', 'high-end'], tags: ['premium', 'high-value'] },
      { keywords: ['referral', 'referred', 'recommendation'], tags: ['referral', 'warm-lead'] },
    ],
    caseSensitive: false,
  },
};

// Tagging functions
const taggingFunctions = {
  // Apply exclusivity tags
  applyExclusivityTags: (row: any, rules: any) => {
    const tags: string[] = [];
    
    if (!rules.enabled) return tags;
    
    const checkFields = ['exclusivitynotes', 'notes', 'comments', 'remarks'];
    
    for (const field of checkFields) {
      if (row[field]) {
        const value = rules.caseSensitive ? row[field] : row[field].toLowerCase();
        
        for (const keyword of rules.keywords) {
          const searchKeyword = rules.caseSensitive ? keyword : keyword.toLowerCase();
          if (value.includes(searchKeyword)) {
            tags.push(...rules.tags);
            break;
          }
        }
      }
    }
    
    // Also check boolean exclusivity field
    if (row.exclusivity === true) {
      tags.push(...rules.tags);
    }
    
    return [...new Set(tags)]; // Remove duplicates
  },
  
  // Apply lead score tags
  applyLeadScoreTags: (row: any, rules: any) => {
    const tags: string[] = [];
    
    if (!rules.enabled || !row.leadscore) return tags;
    
    const score = parseFloat(row.leadscore);
    if (isNaN(score)) return tags;
    
    for (const range of rules.ranges) {
      if (score >= range.min && score <= range.max) {
        tags.push(...range.tags);
        break;
      }
    }
    
    return tags;
  },
  
  // Apply lead cost tags
  applyLeadCostTags: (row: any, rules: any) => {
    const tags: string[] = [];
    
    if (!rules.enabled || !row.leadcost) return tags;
    
    const cost = parseFloat(row.leadcost);
    if (isNaN(cost)) return tags;
    
    for (const range of rules.ranges) {
      if (cost >= range.min && cost <= range.max) {
        tags.push(...range.tags);
        break;
      }
    }
    
    return tags;
  },
  
  // Apply company size tags
  applyCompanySizeTags: (row: any, rules: any) => {
    const tags: string[] = [];
    
    if (!rules.enabled || !row.companyname) return tags;
    
    const companyName = rules.caseSensitive ? row.companyname : row.companyname.toLowerCase();
    
    for (const pattern of rules.patterns) {
      for (const keyword of pattern.keywords) {
        const searchKeyword = rules.caseSensitive ? keyword : keyword.toLowerCase();
        if (companyName.includes(searchKeyword)) {
          tags.push(...pattern.tags);
          break;
        }
      }
    }
    
    return [...new Set(tags)];
  },
  
  // Apply geographic tags
  applyGeographicTags: (row: any, rules: any) => {
    const tags: string[] = [];
    
    if (!rules.enabled) return tags;
    
    // State-based tags
    if (row.state && rules.stateMapping[row.state.toUpperCase()]) {
      tags.push(...rules.stateMapping[row.state.toUpperCase()]);
    }
    
    // City-based tags
    if (row.city) {
      const cityLower = row.city.toLowerCase();
      for (const [city, cityTags] of Object.entries(rules.cityMapping)) {
        if (cityLower.includes(city)) {
          tags.push(...cityTags);
          break;
        }
      }
    }
    
    return [...new Set(tags)];
  },
  
  // Apply industry tags
  applyIndustryTags: (row: any, rules: any) => {
    const tags: string[] = [];
    
    if (!rules.enabled) return tags;
    
    const checkFields = ['companyname', 'notes', 'comments', 'remarks'];
    
    for (const field of checkFields) {
      if (row[field]) {
        const value = rules.caseSensitive ? row[field] : row[field].toLowerCase();
        
        for (const pattern of rules.patterns) {
          for (const keyword of pattern.keywords) {
            const searchKeyword = rules.caseSensitive ? keyword : keyword.toLowerCase();
            if (value.includes(searchKeyword)) {
              tags.push(...pattern.tags);
              break;
            }
          }
        }
      }
    }
    
    return [...new Set(tags)];
  },
  
  // Apply contact quality tags
  applyContactQualityTags: (row: any, rules: any) => {
    const tags: string[] = [];
    
    if (!rules.enabled) return tags;
    
    const hasEmail = !!(row.email && row.email.trim());
    const hasPhone = !!(row.phone && row.phone.trim());
    const hasCompany = !!(row.companyname && row.companyname.trim());
    const hasAddress = !!(row.address && row.address.trim());
    
    for (const rule of rules.rules) {
      switch (rule.condition) {
        case 'hasEmail':
          if (hasEmail) tags.push(...rule.tags);
          break;
        case 'hasPhone':
          if (hasPhone) tags.push(...rule.tags);
          break;
        case 'hasBoth':
          if (hasEmail && hasPhone) tags.push(...rule.tags);
          break;
        case 'hasCompany':
          if (hasCompany) tags.push(...rule.tags);
          break;
        case 'hasAddress':
          if (hasAddress) tags.push(...rule.tags);
          break;
      }
    }
    
    return [...new Set(tags)];
  },
  
  // Apply data completeness tags
  applyDataCompletenessTags: (row: any, rules: any) => {
    const tags: string[] = [];
    
    if (!rules.enabled) return tags;
    
    // Calculate completeness percentage
    const requiredFields = ['email', 'firstname', 'lastname', 'phone', 'companyname', 'address'];
    const filledFields = requiredFields.filter(field => row[field] && row[field].toString().trim());
    const completeness = (filledFields.length / requiredFields.length) * 100;
    
    for (const threshold of rules.thresholds.sort((a, b) => b.percentage - a.percentage)) {
      if (completeness >= threshold.percentage) {
        tags.push(...threshold.tags);
        break;
      }
    }
    
    return tags;
  },
  
  // Apply custom keyword tags
  applyCustomKeywordTags: (row: any, rules: any) => {
    const tags: string[] = [];
    
    if (!rules.enabled) return tags;
    
    const checkFields = ['notes', 'comments', 'remarks', 'exclusivitynotes'];
    
    for (const field of checkFields) {
      if (row[field]) {
        const value = rules.caseSensitive ? row[field] : row[field].toLowerCase();
        
        for (const pattern of rules.patterns) {
          for (const keyword of pattern.keywords) {
            const searchKeyword = rules.caseSensitive ? keyword : keyword.toLowerCase();
            if (value.includes(searchKeyword)) {
              tags.push(...pattern.tags);
              break;
            }
          }
        }
      }
    }
    
    return [...new Set(tags)];
  },
};

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      taggingRules: TAGGING_RULES,
      availableFunctions: Object.keys(taggingFunctions),
    });
  } catch (error) {
    console.error('Error fetching lead tagging rules:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch lead tagging rules',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, customRules } = body;

    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid data format. Expected array of objects.');
    }

    // Merge custom rules with default rules
    const rules = { ...TAGGING_RULES, ...customRules };

    // Apply tags to each row of data
    const taggedData = data.map((row: any) => {
      const allTags: string[] = [];

      // Apply all tagging functions
      allTags.push(...taggingFunctions.applyExclusivityTags(row, rules.exclusivity));
      allTags.push(...taggingFunctions.applyLeadScoreTags(row, rules.leadScore));
      allTags.push(...taggingFunctions.applyLeadCostTags(row, rules.leadCost));
      allTags.push(...taggingFunctions.applyCompanySizeTags(row, rules.companySize));
      allTags.push(...taggingFunctions.applyGeographicTags(row, rules.geographic));
      allTags.push(...taggingFunctions.applyIndustryTags(row, rules.industry));
      allTags.push(...taggingFunctions.applyContactQualityTags(row, rules.contactQuality));
      allTags.push(...taggingFunctions.applyDataCompletenessTags(row, rules.dataCompleteness));
      allTags.push(...taggingFunctions.applyCustomKeywordTags(row, rules.customKeywords));

      // Remove duplicates and empty tags
      const uniqueTags = [...new Set(allTags.filter(tag => tag && tag.trim()))];

      return {
        ...row,
        tags: uniqueTags,
      };
    });

    // Calculate tagging statistics
    const stats = {
      totalRows: data.length,
      taggedRows: taggedData.filter(row => row.tags && row.tags.length > 0).length,
      totalTags: taggedData.reduce((sum, row) => sum + (row.tags ? row.tags.length : 0), 0),
      uniqueTags: [...new Set(taggedData.flatMap(row => row.tags || []))],
      averageTagsPerRow: 0,
    };

    stats.averageTagsPerRow = stats.totalTags / stats.totalRows;

    return NextResponse.json({
      success: true,
      taggedData,
      stats,
      rulesApplied: rules,
    });
  } catch (error) {
    console.error('Error applying lead tagging:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to apply lead tagging',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
