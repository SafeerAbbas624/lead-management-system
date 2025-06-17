import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type Lead = {
  id: number;
  leadscore: number | null;
  createdat: string;
};

type LeadQualityData = {
  name: string;
  value: number;
  percentage: number;
};

const QUALITY_RANGES = [
  { name: 'Poor (0-3)', min: 0, max: 3 },
  { name: 'Fair (4-6)', min: 4, max: 6 },
  { name: 'Good (7-8)', min: 7, max: 8 },
  { name: 'Very Good (9)', min: 9, max: 9 },
  { name: 'Excellent (10)', min: 10, max: 10 },
] as const;

export async function GET() {
  try {
    // Fetch leads with their lead scores
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select<Lead>('id, leadscore, createdat')
      .not('leadscore', 'is', null)
      .order('createdat', { ascending: false });

    if (leadsError) throw leadsError;

    // If no leads with scores found, return sample data
    if (!leads || leads.length === 0) {
      console.warn('No lead score data found. Returning sample data.');
      return NextResponse.json({
        data: generateSampleData(),
        message: 'No lead score data found. Showing sample data.'
      });
    }

    // Count leads in each quality range
    const qualityCounts = QUALITY_RANGES.map(range => {
      const count = leads.filter(lead => {
        if (lead.leadscore === null) return false;
        const score = parseFloat(lead.leadscore.toString());
        return !isNaN(score) && score >= range.min && score <= range.max;
      }).length;
      
      return {
        name: range.name,
        value: count,
        percentage: leads.length > 0 ? Math.round((count / leads.length) * 100) : 0
      };
    });

    // Filter out empty categories
    const result = qualityCounts.filter(item => item.value > 0);

    // If all categories are empty, return sample data
    if (result.length === 0) {
      console.warn('No leads matched the quality ranges. Showing sample data.');
      return NextResponse.json({
        data: generateSampleData(),
        message: 'No leads matched the quality ranges. Showing sample data.'
      });
    }

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

// Generate sample data for demonstration or fallback
function generateSampleData(): LeadQualityData[] {
  return [
    { name: 'Poor (0-3)', value: 15, percentage: 15 },
    { name: 'Fair (4-6)', value: 35, percentage: 35 },
    { name: 'Good (7-8)', value: 30, percentage: 30 },
    { name: 'Very Good (9)', value: 15, percentage: 15 },
    { name: 'Excellent (10)', value: 5, percentage: 5 },
  ];
}
