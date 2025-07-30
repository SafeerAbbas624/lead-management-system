import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('=== AUTH TEST STARTED ===')
    
    // Use your custom authentication system
    const jwt = await import('jsonwebtoken')
    const { createClient } = await import('@supabase/supabase-js')
    
    // Get token from cookie
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    console.log('Auth token found:', !!token)
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'No authentication token found'
      })
    }

    // Verify JWT token
    let decoded: any
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
      decoded = jwt.verify(token, JWT_SECRET)
      console.log('JWT verified successfully, user ID:', decoded.userId)
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError)
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token'
      })
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user from your custom users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, fullName, email, role')
      .eq('id', decoded.userId)
      .single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return NextResponse.json({
        success: false,
        error: 'User not found'
      })
    }

    console.log('User authenticated:', user.id, user.username)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      },
      message: 'Authentication successful'
    })
  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
