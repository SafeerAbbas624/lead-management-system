import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerClient();
    
    // Get completed batches (case-insensitive match)
    const { data, error } = await supabase
      .from('upload_batches')
      .select('*')
      .ilike('status', 'completed')
      .order('createdat', { ascending: false });
      
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch batches' },
        { status: 500 }
      );
    }
    
    // Return empty array if no completed batches found
    if (!data || data.length === 0) {
      return NextResponse.json([], { status: 200 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
