import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-client';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('leads')
    .select('id, uploadbatchid, clientid, createdat, leadstatus')
    .order('createdat', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // Group by batch/client and summarize allocations
  const history = {};
  for (const lead of data) {
    const key = `${lead.uploadbatchid}-${lead.clientid}`;
    if (!history[key]) {
      history[key] = {
        batchId: lead.uploadbatchid,
        clientId: lead.clientid,
        leadsAllocated: 0,
        deliveryStatus: 'Delivered',
        deliveryDate: lead.createdat,
      };
    }
    history[key].leadsAllocated += 1;
  }
  return NextResponse.json(Object.values(history));
}
