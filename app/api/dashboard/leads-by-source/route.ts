import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Get all leads and count by source
    const { data: leads, error } = await supabase
      .from('leads')
      .select('leadsource, supplierid, suppliers(name)')
      .not('leadsource', 'is', null);

    if (error) throw error;

    // Count leads by source
    const sourceCounts: { [key: string]: number } = {};

    leads?.forEach(lead => {
      // Use supplier name if available, otherwise use leadsource
      const source = lead.suppliers?.name || lead.leadsource || 'Unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    // Format the data for the chart
    const formattedData = Object.entries(sourceCounts).map(([source, count]) => ({
      name: source,
      value: count,
    })).sort((a, b) => b.value - a.value); // Sort by count descending

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Error fetching leads by source:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leads by source',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
