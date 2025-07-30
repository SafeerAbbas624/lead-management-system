import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch all users to see what's in the database
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, "fullName", email, role')
      .order('id');

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: users,
      count: users?.length || 0
    });

  } catch (error) {
    console.error('Error in test users API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
