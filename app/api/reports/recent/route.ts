import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Create a server client that can handle cookies
    const supabase = createServerClient()

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        { error: 'Session error' },
        { status: 401 }
      )
    }
    
    if (!session) {
      console.log('No active session')
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }


    // Fetch recent reports for the current user
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    return NextResponse.json(reports || [])
  } catch (error) {
    console.error('Error in GET /api/reports/recent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
