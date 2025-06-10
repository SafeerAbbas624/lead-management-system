import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type FunnelStage = {
  name: string;
  value: number;
  percentage: string;
};

export async function GET() {
  try {
    // Fetch all leads with their status
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('leadstatus, createdat')
      .order('createdat', { ascending: false });

    if (leadsError) throw leadsError;

    // Calculate total leads
    const totalLeads = leads?.length || 0;
    
    // Count leads by status
    const statusCounts = leads?.reduce((acc, lead) => {
      const status = lead.leadstatus?.toLowerCase() || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Define the funnel stages in order
    const funnelStages = [
      { name: 'Total Leads', status: 'total' },
      { name: 'Contacted', status: 'contacted' },
      { name: 'Qualified', status: 'qualified' },
      { name: 'Proposal Sent', status: 'proposal_sent' },
      { name: 'Negotiation', status: 'negotiation' },
      { name: 'Converted', status: 'converted' },
    ];

    // Calculate funnel data
    const funnelData: FunnelStage[] = [];
    let previousValue = totalLeads;

    for (const stage of funnelStages) {
      let value: number;
      
      if (stage.status === 'total') {
        value = totalLeads;
      } else {
        value = statusCounts?.[stage.status] || 0;
      }

      // Calculate percentage of total leads
      const percentage = totalLeads > 0 ? ((value / totalLeads) * 100).toFixed(1) : '0.0';
      
      // Calculate drop-off percentage
      const dropOff = previousValue > 0 ? (100 - (value / previousValue) * 100).toFixed(1) : '0.0';
      
      funnelData.push({
        name: `${stage.name} (${dropOff}% drop-off)`,
        value,
        percentage: dropOff,
      });
      
      previousValue = value;
    }

    return NextResponse.json({ data: funnelData });

  } catch (error: any) {
    console.error('Error in conversion-funnel endpoint:', error);
    
    // Return sample data in case of error
    const sampleData = [
      { name: 'Total Leads (0% drop-off)', value: 100, percentage: '0' },
      { name: 'Contacted (30% drop-off)', value: 70, percentage: '30' },
      { name: 'Qualified (20% drop-off)', value: 56, percentage: '20' },
      { name: 'Proposal Sent (25% drop-off)', value: 42, percentage: '25' },
      { name: 'Negotiation (15% drop-off)', value: 36, percentage: '15' },
      { name: 'Converted (10% drop-off)', value: 32, percentage: '10' },
    ];
    
    return NextResponse.json(
      { 
        data: sampleData,
        error: 'Failed to fetch conversion funnel data. Showing sample data.'
      },
      { status: 200 } // Still return 200 to avoid breaking the UI
    );
  }
}
