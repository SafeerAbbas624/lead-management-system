import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Use your custom authentication system
    const jwt = await import('jsonwebtoken')
    const { createClient } = await import('@supabase/supabase-js')
    const { cookies } = await import('next/headers')

    // Get token from cookie
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      )
    }

    // Verify JWT token
    let decoded: any
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError)
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', decoded.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Try with basic columns first (most compatible)
    console.log('Fetching reports with basic columns...')
    console.log('User ID:', user.id)
    console.log('User ID type:', typeof user.id)

    // First, let's try to just count reports to see if the table is accessible
    const { count, error: countError } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Count query failed:', countError)
      return NextResponse.json(
        { error: `Table access error: ${countError.message}` },
        { status: 500 }
      )
    }

    console.log('Total reports in table:', count)

    // Now try to fetch reports
    const { data: reports, error } = await supabase
      .from('reports')
      .select(`
        id,
        name,
        type,
        format,
        date_from,
        date_to,
        status,
        created_at,
        updated_at,
        file_name
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching reports:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))

      // Return empty array if no reports exist yet
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.log('Reports table might not exist or be accessible, returning empty array')
        return NextResponse.json([])
      }

      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    console.log(`Successfully fetched ${reports?.length || 0} reports`)
    return NextResponse.json(reports || [])
  } catch (error) {
    console.error('Error in GET /api/reports/recent:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
