import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Get leads count by status
    const { data, error } = await supabase
      .from('leads')
      .select('leadStatus, count')
      .not('leadStatus', 'is', null)
      .order('count', { ascending: false });

    if (error) throw error;

    // Format the data for the chart
    const formattedData = data.map(item => ({
      status: item.leadStatus,
      count: item.count,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Error fetching leads by status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch leads by status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
