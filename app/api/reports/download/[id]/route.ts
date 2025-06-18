import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const reportId = params.id

    // Get the auth token from cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // This is a no-op for server components
            // The cookie will be set by the client-side auth flow
          },
          remove(name: string, options: any) {
            // This is a no-op for server components
            // The cookie will be removed by the client-side auth flow
          },
        },
      }
    )

    // Get user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Create a new Supabase client with the session
    const supabaseWithAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      }
    )

    // Get report metadata
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', session.user.id)
      .single()

    if (reportError || !report) {
      console.error('Error fetching report:', reportError)
      return new NextResponse('Report not found', { status: 404 })
    }

    // In a real app, you would fetch the actual file from storage
    // For now, we'll return a simple response
    const fileContent = `Report: ${report.name}\n` +
      `Type: ${report.type}\n` +
      `Date Range: ${new Date(report.date_from).toLocaleDateString()} - ${new Date(report.date_to).toLocaleDateString()}\n` +
      `Generated at: ${new Date(report.created_at).toLocaleString()}\n\n` +
      `This is a sample report. In a real application, this would contain the actual report data.`

    // Return the file
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${report.file_name || 'report.txt'}"`,
      },
    })
  } catch (error) {
    console.error('Error downloading report:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
