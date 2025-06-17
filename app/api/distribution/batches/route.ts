import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-client';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('upload_batches')
    .select('*')
    .eq('status', 'Completed')
    .order('createdat', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
