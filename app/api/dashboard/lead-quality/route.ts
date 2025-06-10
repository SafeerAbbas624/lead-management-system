import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type LeadQualityData = {
  name: string;
  value: number;
  percentage: number;
};

export async function GET() {
  try {
    // Fetch leads with their quality scores (assuming a quality_score column exists)
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, quality_score, createdat')
      .not('quality_score', 'is', null);

    if (leadsError) throw leadsError;

    // If no quality_score column or data, return sample data
    if (!leads || leads.length === 0) {
      return NextResponse.json({
        data: generateSampleData(),
        message: 'No quality score data found. Showing sample data.'
      });
    }

    // Categorize leads by quality score
    const qualityRanges = [
      { name: 'Poor', min: 0, max: 3 },
      { name: 'Fair', min: 4, max: 6 },
      { name: 'Good', min: 7, max: 8 },
      { name: 'Very Good', min: 9, max: 9 },
      { name: 'Excellent', min: 10, max: 10 },
    ];

    // Count leads in each quality range
    const qualityCounts = qualityRanges.map(range => {
      const count = leads.filter(lead => {
        const score = parseFloat(lead.quality_score);
        return score >= range.min && score <= range.max;
      }).length;
      
      return {
        name: range.name,
        value: count,
        percentage: Math.round((count / leads.length) * 100)
      };
    });

    // Filter out empty categories
    const result = qualityCounts.filter(item => item.value > 0);

    return NextResponse.json({ data: result });

  } catch (error: any) {
    console.error('Error in lead-quality endpoint:', error);
    
    // Return sample data in case of error
    return NextResponse.json({
      data: generateSampleData(),
      error: 'Failed to fetch lead quality data. Showing sample data.'
    }, { status: 200 }); // Still return 200 to avoid breaking the UI
  }
}

// Generate sample data for demonstration
function generateSampleData(): LeadQualityData[] {
  return [
    { name: 'Poor', value: 15, percentage: 15 },
    { name: 'Fair', value: 35, percentage: 35 },
    { name: 'Good', value: 30, percentage: 30 },
    { name: 'Very Good', value: 15, percentage: 15 },
    { name: 'Excellent', value: 5, percentage: 5 },
  ];
}
