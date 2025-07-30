import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    console.log('=== SIMPLE REPORT TEST ===')
    
    // Parse request
    const body = await request.json()
    console.log('Request body:', body)
    
    // Test authentication
    const jwt = await import('jsonwebtoken')
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 })
    }
    
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Test Supabase connection
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Test simple query
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, firstname, lastname')
      .limit(5)
    
    if (error) {
      console.error('Query error:', error)
      return NextResponse.json({ error: 'Query failed', details: error.message }, { status: 500 })
    }
    
    // Return simple CSV
    const csvContent = 'id,firstname,lastname\n' + 
      (leads || []).map(lead => `${lead.id},"${lead.firstname || ''}","${lead.lastname || ''}"`).join('\n')
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="test-report.csv"'
      }
    })
    
  } catch (error) {
    console.error('Simple test error:', error)
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}
