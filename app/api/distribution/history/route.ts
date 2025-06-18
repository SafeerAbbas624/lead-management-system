import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

interface HistoryItem {
  id: string;  // Unique identifier for each history item
  batchId: number;
  clientId: number;
  leadsAllocated: number;
  deliveryStatus: string;
  deliveryDate: string;
}

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('leads')
      .select('id, uploadbatchid, clientid, createdat, leadstatus')
      .order('createdat', { ascending: false });
      
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json([], { status: 200 });
    }
    
    // Group by batch/client and summarize allocations
    const history: { [key: string]: HistoryItem } = {};
    let index = 0;
    for (const lead of data) {
      const key = `${lead.uploadbatchid}-${lead.clientid}`;
      if (!history[key]) {
        history[key] = {
          id: `dist-${lead.uploadbatchid}-${lead.clientid}-${index++}`,
          batchId: lead.uploadbatchid,
          clientId: lead.clientid,
          leadsAllocated: 0,
          deliveryStatus: lead.leadstatus || 'Pending',
          deliveryDate: lead.createdat,
        };
      }
      history[key].leadsAllocated += 1;
    }
    
    return NextResponse.json(Object.values(history));
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
