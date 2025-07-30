import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection with a simple count query
    const { count, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Database connection failed',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      totalLeads: count || 0
    });
  } catch (error) {
    console.error('Test DB error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test database connection',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
