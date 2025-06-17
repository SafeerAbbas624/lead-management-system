import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-client';

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient();
  const body = await req.json();
  const { batchId, clientIds } = body;

  if (!batchId || !Array.isArray(clientIds) || clientIds.length === 0) {
    return NextResponse.json({ error: 'batchId and clientIds are required.' }, { status: 400 });
  }

  // Fetch leads from the selected batch
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .eq('uploadbatchid', batchId)
    .is('clientid', null);

  if (leadsError) {
    return NextResponse.json({ error: leadsError.message }, { status: 500 });
  }

  // Calculate allocations
  const leadsPerClient = Math.floor(leads.length / clientIds.length);
  let allocations = [];
  let leadIndex = 0;
  for (const clientId of clientIds) {
    const allocatedLeads = leads.slice(leadIndex, leadIndex + leadsPerClient);
    allocations.push({ clientId, leads: allocatedLeads.map(l => l.id) });
    leadIndex += leadsPerClient;
  }
  // Distribute any remaining leads
  let remaining = leads.length - leadIndex;
  let i = 0;
  while (remaining > 0) {
    if (allocations[i]) {
      allocations[i].leads.push(leads[leadIndex].id);
      leadIndex++;
      remaining--;
      i = (i + 1) % allocations.length;
    } else {
      break;
    }
  }

  // Update leads with client assignments
  let updatedCount = 0;
  for (const alloc of allocations) {
    if (alloc.leads.length > 0) {
      const { error: updateError } = await supabase
        .from('leads')
        .update({ clientid: alloc.clientId })
        .in('id', alloc.leads);
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      updatedCount += alloc.leads.length;
    }
  }

  return NextResponse.json({ totalLeads: updatedCount, distributions: allocations });
}
