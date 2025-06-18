import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

interface ReportRequest {
  type: string[]
  format: 'pdf' | 'csv' | 'excel' | 'json'
  dateRange: {
    from: string
    to: string
  }
  name?: string
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // Parse the request body first
    const { type, format, dateRange, name } = await request.json() as ReportRequest
    let reportName = name || `Report ${new Date().toLocaleDateString()}`
    
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
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // If no session, try to refresh it
    let currentSession = session
    if (!currentSession) {
      console.log('No active session, attempting to refresh...')
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError || !refreshedSession) {
        console.error('Failed to refresh session:', refreshError || 'No session after refresh')
        return NextResponse.json(
          { error: 'Unauthorized - Please log in again' }, 
          { status: 401 }
        )
      }
      
      console.log('Session refreshed successfully')
      currentSession = refreshedSession
    }

    // Ensure we have a valid session
    if (!currentSession) {
      return NextResponse.json(
        { error: 'No valid session available' }, 
        { status: 401 }
      )
    }

    // Create a new Supabase client with the session
    const supabaseWithAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${currentSession.access_token}`,
          },
        },
      }
    )

    const fromDate = new Date(dateRange.from)
    const toDate = new Date(dateRange.to)
    // If no name provided, generate one based on type and date range
    if (!name) {
      if (type.includes('all')) {
        reportName = `All Reports - ${new Date(dateRange.from).toLocaleDateString()} to ${new Date(dateRange.to).toLocaleDateString()}`
      } else if (type.includes('leads')) {
        reportName = `Leads Report - ${new Date(dateRange.from).toLocaleDateString()} to ${new Date(dateRange.to).toLocaleDateString()}`
      } else if (type.includes('revenue')) {
        reportName = `Revenue Report - ${new Date(dateRange.from).toLocaleDateString()} to ${new Date(dateRange.to).toLocaleDateString()}`
      } else if (type.includes('source')) {
        reportName = `Source Performance - ${new Date(dateRange.from).toLocaleDateString()} to ${new Date(dateRange.to).toLocaleDateString()}`
      }
    }

    let reportData: any = null

    // Fetch data based on report type
    if (type.includes('all') || type.includes('lead-activity')) {
      reportName = 'Lead Activity Report'
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .gte('createdat', fromDate.toISOString())
        .lte('createdat', toDate.toISOString())
        .order('createdat', { ascending: false })
      
      if (error) throw error
      reportData = data
    } 
    else if (type.includes('source-performance')) {
      reportName = 'Source Performance Report'
      const { data: rawData, error } = await supabase
        .from('leads')
        .select('leadsource, status, id')
        .gte('createdat', fromDate.toISOString())
        .lte('createdat', toDate.toISOString())
        
      // Group data by leadsource and status in JavaScript
      const groupedData = rawData?.reduce<Record<string, { leadsource: string | null, status: string | null, count: number }>>((acc, lead) => {
        const key = `${lead.leadsource}_${lead.status}`;
        if (!acc[key]) {
          acc[key] = { leadsource: lead.leadsource, status: lead.status, count: 0 };
        }
        acc[key].count++;
        return acc;
      }, {});
      
      // Convert the grouped data to an array
      const data = groupedData ? Object.values(groupedData) : [];
      
      if (error) throw error
      reportData = data
    } 
    else if (type.includes('conversion')) {
      reportName = 'Conversion Report'
      const { data: rawData, error } = await supabase
        .from('leads')
        .select('leadsource, leadstatus, id')
        .gte('createdat', fromDate.toISOString())
        .lte('createdat', toDate.toISOString())
        
      // Group data by leadsource and leadstatus in JavaScript
      const groupedData = rawData?.reduce<Record<string, { leadsource: string | null, leadstatus: string | null, count: number }>>((acc, lead) => {
        const key = `${lead.leadsource}_${lead.leadstatus}`;
        if (!acc[key]) {
          acc[key] = { leadsource: lead.leadsource, leadstatus: lead.leadstatus, count: 0 };
        }
        acc[key].count++;
        return acc;
      }, {});
      
      // Convert the grouped data to an array
      const data = groupedData ? Object.values(groupedData) : [];
      
      if (error) throw error
      reportData = data
    } 
    else if (type.includes('revenue')) {
      reportName = 'Revenue Report'
      const { data, error } = await supabase
        .from('leads')
        .select('leadsource, leadstatus, leadcost')
        .gte('createdat', fromDate.toISOString())
        .lte('createdat', toDate.toISOString())
      
      if (error) throw error
      
      // Calculate revenue by source and status
      const revenueData: Record<string, any> = {}
      data?.forEach(lead => {
        if (!revenueData[lead.leadsource]) {
          revenueData[lead.leadsource] = { total: 0, byStatus: {} }
        }
        const cost = parseFloat(lead.leadcost) || 0
        revenueData[lead.leadsource].total += cost
        if (!revenueData[lead.leadsource].byStatus[lead.leadstatus]) {
          revenueData[lead.leadsource].byStatus[lead.leadstatus] = 0
        }
        revenueData[lead.leadsource].byStatus[lead.leadstatus] += cost
      })
      
      reportData = revenueData
    }

    // Generate file content based on format
    let fileContent = ''
    let contentType = 'text/plain'
    let fileName = `${reportName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`
    
    if (format === 'csv') {
      contentType = 'text/csv'
      if (Array.isArray(reportData)) {
        if (reportData.length > 0) {
          const headers = Object.keys(reportData[0]).join(',')
          const rows = reportData.map((row: any) => 
            Object.values(row).map(field => 
              `"${String(field ?? '').replace(/"/g, '""')}"`
            ).join(',')
          )
          fileContent = [headers, ...rows].join('\n')
        }
      } else {
        // Handle non-array data (like revenue report)
        fileContent = 'Source,Status,Value\n' +
          Object.entries(reportData).flatMap(([source, data]: [string, any]) => 
            Object.entries(data.byStatus).map(([status, value]) => 
              `"${source}","${status}",${value}`
            )
          ).join('\n')
      }
      fileName += '.csv'
    } 
    else if (format === 'json') {
      contentType = 'application/json'
      fileContent = JSON.stringify(reportData, null, 2)
      fileName += '.json'
    }
    else if (format === 'excel') {
      // For Excel, we'll generate CSV for now as a simple solution
      // In production, you might want to use a library like exceljs
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      if (Array.isArray(reportData) && reportData.length > 0) {
        const headers = Object.keys(reportData[0]).join('\t')
        const rows = reportData.map((row: any) => 
          Object.values(row).map(field => 
            `"${String(field ?? '').replace(/"/g, '""')}"`
          ).join('\t')
        )
        fileContent = [headers, ...rows].join('\n')
      }
      fileName += '.xls'
    }

    // Save report record in database
    const { data: report, error: reportError } = await supabase
.from('reports')
      .insert([{
        user_id: currentSession.user.id,
        name: reportName,
        type: type.includes('all') ? 'all' : type[0],
        format,
        date_from: fromDate.toISOString(),
        date_to: toDate.toISOString(),
        file_name: fileName,
        status: 'completed'
      }])
      .select()
      .single()

    if (reportError) {
      console.error('Error saving report record:', reportError)
      // Continue anyway, don't fail the whole request
    }

    // Return the file for download
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to generate report' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
