import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

interface ReportRequest {
  type: string[]
  format: 'pdf' | 'csv'
  dateRange: {
    from: string
    to: string
  }
  name?: string
  category?: string
}

export async function POST(request: Request) {
  console.log('=== REPORT GENERATION STARTED ===')
  try {
    // Parse the request body first
    console.log('Parsing request body...')
    const requestBody = await request.json()
    console.log('Raw request body:', requestBody)

    const { type, format, dateRange, name, category } = requestBody as ReportRequest
    let reportName = name || `Report ${new Date().toLocaleDateString()}`

    console.log('Parsed request details:', { type, format, dateRange, reportName })

    // Step 1: Test authentication
    console.log('Testing authentication...')

    // Declare supabase variable in the correct scope
    let supabase: any
    let user: any

    try {
      const jwt = await import('jsonwebtoken')
      console.log('JWT import successful')

      const { createClient } = await import('@supabase/supabase-js')
      console.log('Supabase import successful')

      const { cookies } = await import('next/headers')
      console.log('Cookies import successful')

      const cookieStore = await cookies()
      console.log('Cookie store created')

      const token = cookieStore.get('auth-token')?.value
      console.log('Auth token found:', !!token)

      if (!token) {
        console.log('No auth token - returning 401')
        return NextResponse.json(
          { error: 'No authentication token found - Please sign in again' },
          { status: 401 }
        )
      }

      // Test JWT verification
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
      console.log('JWT_SECRET available:', !!JWT_SECRET)

      const decoded = jwt.verify(token, JWT_SECRET)
      console.log('JWT verified successfully, user ID:', (decoded as any).userId)

      // Test Supabase client creation
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      console.log('Supabase client created')

      // Test user lookup
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, fullName, email, role')
        .eq('id', (decoded as any).userId)
        .single()

      if (userError) {
        console.error('User lookup error:', userError)
        return NextResponse.json(
          { error: 'User lookup failed: ' + userError.message },
          { status: 401 }
        )
      }

      if (!userData) {
        console.log('User not found')
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        )
      }

      // Assign to the outer scope variable
      user = userData
      console.log('User authenticated successfully:', user.id, user.username)

      // Authentication successful, continue with report generation
      console.log('Authentication successful, proceeding with report generation...')

      // Reuse the supabase client created above for data access

    } catch (authError) {
      console.error('Authentication error:', authError)
      return NextResponse.json(
        {
          error: 'Authentication failed: ' + (authError instanceof Error ? authError.message : 'Unknown error'),
          details: authError instanceof Error ? authError.stack : 'No stack trace'
        },
        { status: 500 }
      )
    }

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

    // Use the authenticated supabase client for data access
    // For now, we'll use the user's session instead of service role
    console.log('Fetching data for report type:', type)

    console.log('Starting data fetch for report type:', type)

    // Fetch data based on report type
    if (type.includes('all')) {
      reportName = 'Comprehensive Business Report'
      console.log('=== GENERATING COMPREHENSIVE BUSINESS REPORT ===')
      console.log('This will include all reports except Lead Activity')

      // Initialize comprehensive report structure
      const comprehensiveReport: any = {
        report_title: 'Comprehensive Business Report',
        period: `${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`,
        generated_at: new Date().toISOString(),
        sections: {}
      }

      try {
        // 1. CONVERSION ANALYSIS SECTION
        console.log('1. Generating Conversion Analysis...')
        const { data: totalLeadsData } = await supabase
          .from('leads')
          .select('id, leadsource, supplierid, createdat, suppliers(name)')
          .gte('createdat', fromDate.toISOString())
          .lte('createdat', toDate.toISOString())

        const { data: soldLeadsData } = await supabase
          .from('clients_history')
          .select('lead_id, selling_cost, source_supplier_id, source_name, distributed_at, suppliers(name)')
          .gte('distributed_at', fromDate.toISOString())
          .lte('distributed_at', toDate.toISOString())

        const totalLeadsCount = totalLeadsData?.length || 0
        const totalSoldCount = soldLeadsData?.length || 0
        const totalRevenue = soldLeadsData?.reduce((sum, sale) => sum + (parseFloat(sale.selling_cost) || 0), 0) || 0
        const overallConversionRate = totalLeadsCount > 0 ? ((totalSoldCount / totalLeadsCount) * 100).toFixed(2) : 0

        comprehensiveReport.sections.conversion_analysis = {
          total_leads_available: totalLeadsCount,
          total_leads_sold: totalSoldCount,
          overall_conversion_rate: overallConversionRate + '%',
          total_revenue_generated: totalRevenue.toFixed(2),
          avg_revenue_per_sold_lead: totalSoldCount > 0 ? (totalRevenue / totalSoldCount).toFixed(2) : '0.00'
        }

        // 2. INVESTMENT VS PROFIT SECTION
        console.log('2. Generating Investment vs Profit Analysis...')
        const { data: investmentData } = await supabase
          .from('upload_batches')
          .select('total_buying_price, totalleads, createdat, suppliers(name)')
          .gte('createdat', fromDate.toISOString())
          .lte('createdat', toDate.toISOString())

        const totalInvestment = investmentData?.reduce((sum, batch) =>
          sum + (parseFloat(batch.total_buying_price) || 0), 0) || 0
        const totalProfit = totalRevenue - totalInvestment
        const roi = totalInvestment > 0 ? ((totalProfit / totalInvestment) * 100).toFixed(2) : 0

        comprehensiveReport.sections.investment_vs_profit = {
          total_investment: totalInvestment.toFixed(2),
          total_revenue: totalRevenue.toFixed(2),
          total_profit: totalProfit.toFixed(2),
          roi_percentage: roi + '%',
          leads_bought: investmentData?.reduce((sum, batch) => sum + (batch.totalleads || 0), 0) || 0
        }

        // 3. SOURCE PERFORMANCE SECTION
        console.log('3. Generating Source Performance Analysis...')
        const { data: batchData } = await supabase
          .from('upload_batches')
          .select('id, totalleads, cleanedleads, duplicateleads, dncmatches, supplierid, sourcename, createdat, suppliers(name)')
          .gte('createdat', fromDate.toISOString())
          .lte('createdat', toDate.toISOString())

        const totalBatches = batchData?.length || 0
        const totalLeadsProcessed = batchData?.reduce((sum, batch) => sum + (batch.totalleads || 0), 0) || 0
        const totalCleaned = batchData?.reduce((sum, batch) => sum + (batch.cleanedleads || 0), 0) || 0
        const totalDuplicates = batchData?.reduce((sum, batch) => sum + (batch.duplicateleads || 0), 0) || 0

        comprehensiveReport.sections.source_performance = {
          total_batches_processed: totalBatches,
          total_leads_processed: totalLeadsProcessed,
          total_cleaned_leads: totalCleaned,
          total_duplicates_found: totalDuplicates,
          overall_quality_rate: totalLeadsProcessed > 0 ? ((totalCleaned / totalLeadsProcessed) * 100).toFixed(2) + '%' : '0%'
        }

        console.log('Comprehensive report generated successfully')

      } catch (error) {
        console.error('Error generating comprehensive report:', error)
        comprehensiveReport.sections.error = { message: 'Some sections failed to generate', details: error instanceof Error ? error.message : String(error) }
      }

      reportData = comprehensiveReport
    }
    else if (type.includes('lead-activity')) {
      reportName = 'Lead Activity Report'
      console.log('Fetching lead activity data...')

      const { data, error } = await supabase
        .from('leads')
        .select(`
          id,
          firstname,
          lastname,
          email,
          phone,
          companyname,
          leadsource,
          leadstatus,
          leadcost,
          createdat,
          updatedat,
          suppliers(name),
          clients(name)
        `)
        .gte('createdat', fromDate.toISOString())
        .lte('createdat', toDate.toISOString())
        .order('createdat', { ascending: false })

      if (error) {
        console.error('Error fetching leads:', error)
        throw error
      }

      // Format the data to show creation and update times clearly
      const formattedData = data?.map(lead => ({
        lead_id: lead.id,
        name: `${lead.firstname || ''} ${lead.lastname || ''}`.trim(),
        email: lead.email,
        phone: lead.phone,
        company: lead.companyname,
        source: lead.leadsource,
        current_status: lead.leadstatus,
        cost: lead.leadcost,
        supplier: lead.suppliers?.name || 'Unknown',
        assigned_client: lead.clients?.name || 'Not Assigned',
        created_at: lead.createdat,
        last_updated: lead.updatedat || lead.createdat,
        days_since_creation: Math.floor((new Date().getTime() - new Date(lead.createdat).getTime()) / (1000 * 60 * 60 * 24))
      }))

      console.log(`Fetched ${formattedData?.length || 0} leads`)
      reportData = formattedData || []
    }
    else if (type.includes('source-performance')) {
      reportName = 'Source Performance Report'
      console.log('Fetching source performance with quality metrics...')

      // Get upload batches with supplier info
      const { data: batchData, error: batchError } = await supabase
        .from('upload_batches')
        .select(`
          id,
          totalleads,
          cleanedleads,
          duplicateleads,
          dncmatches,
          supplierid,
          sourcename,
          createdat,
          suppliers(name)
        `)
        .gte('createdat', fromDate.toISOString())
        .lte('createdat', toDate.toISOString())

      if (batchError) {
        console.error('Error fetching batch data:', batchError)
        throw batchError
      }

      // Get duplicate leads data
      const { data: duplicateData, error: duplicateError } = await supabase
        .from('duplicate_leads')
        .select('supplier_id, supplier_name, upload_batch_id')
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString())

      if (duplicateError) {
        console.error('Error fetching duplicate data:', duplicateError)
        // Continue without duplicate data
      }

      // Calculate quality metrics by supplier
      const supplierQuality: Record<string, any> = {}

      batchData?.forEach(batch => {
        const supplier = batch.suppliers?.name || 'Unknown'
        const totalLeads = batch.totalleads || 0
        const cleanedLeads = batch.cleanedleads || 0
        const duplicateLeads = batch.duplicateleads || 0
        const dncMatches = batch.dncmatches || 0

        if (!supplierQuality[supplier]) {
          supplierQuality[supplier] = {
            supplier_name: supplier,
            total_leads_provided: 0,
            cleaned_leads: 0,
            duplicate_leads: 0,
            dnc_matches: 0,
            quality_score: 0,
            duplicate_rate: 0,
            dnc_rate: 0,
            batch_count: 0
          }
        }

        const stats = supplierQuality[supplier]
        stats.total_leads_provided += totalLeads
        stats.cleaned_leads += cleanedLeads
        stats.duplicate_leads += duplicateLeads
        stats.dnc_matches += dncMatches
        stats.batch_count++
      })

      // Calculate percentages
      Object.values(supplierQuality).forEach((supplier: any) => {
        if (supplier.total_leads_provided > 0) {
          supplier.quality_score = ((supplier.cleaned_leads / supplier.total_leads_provided) * 100).toFixed(2)
          supplier.duplicate_rate = ((supplier.duplicate_leads / supplier.total_leads_provided) * 100).toFixed(2)
          supplier.dnc_rate = ((supplier.dnc_matches / supplier.total_leads_provided) * 100).toFixed(2)
        }
      })

      reportData = Object.values(supplierQuality)
    }
    else if (type.includes('conversion')) {
      reportName = 'Conversion Analysis Report'
      console.log('=== STARTING CONVERSION ANALYSIS ===')
      console.log('Date range:', fromDate.toISOString(), 'to', toDate.toISOString())
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing')
      console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing')

      // Get total leads by supplier (what we have)
      console.log('Fetching total leads...')
      const { data: totalLeadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id,
          leadsource,
          supplierid,
          createdat,
          suppliers(name)
        `)
        .gte('createdat', fromDate.toISOString())
        .lte('createdat', toDate.toISOString())

      if (leadsError) {
        console.error('Error fetching total leads:', leadsError)
        console.error('Leads error details:', JSON.stringify(leadsError, null, 2))
        throw new Error(`Failed to fetch leads: ${leadsError.message}`)
      }

      console.log('Total leads query successful, count:', totalLeadsData?.length || 0)

      // Get converted/sold leads from clients_history (what we sold)
      console.log('Fetching sold leads...')
      const { data: soldLeadsData, error: soldError } = await supabase
        .from('clients_history')
        .select(`
          lead_id,
          selling_cost,
          source_supplier_id,
          source_name,
          distributed_at,
          suppliers(name),
          clients(name)
        `)
        .gte('distributed_at', fromDate.toISOString())
        .lte('distributed_at', toDate.toISOString())

      if (soldError) {
        console.error('Error fetching sold leads:', soldError)
        console.error('Sold leads error details:', JSON.stringify(soldError, null, 2))
        throw new Error(`Failed to fetch sold leads: ${soldError.message}`)
      }

      console.log('Sold leads query successful, count:', soldLeadsData?.length || 0)

      console.log(`Total leads in period: ${totalLeadsData?.length || 0}`)
      console.log(`Sold leads in period: ${soldLeadsData?.length || 0}`)

      // Debug: Log sample data
      if (totalLeadsData && totalLeadsData.length > 0) {
        console.log('Sample total lead:', JSON.stringify(totalLeadsData[0], null, 2))
      }
      if (soldLeadsData && soldLeadsData.length > 0) {
        console.log('Sample sold lead:', JSON.stringify(soldLeadsData[0], null, 2))
      }

      // Group total leads by supplier
      const supplierStats: Record<string, any> = {}

      totalLeadsData?.forEach(lead => {
        const supplierId = lead.supplierid
        const supplierName = lead.suppliers?.name || 'Unknown'
        const source = lead.leadsource || 'Unknown'

        if (!supplierStats[supplierId]) {
          supplierStats[supplierId] = {
            supplier_id: supplierId,
            supplier_name: supplierName,
            source: source,
            total_leads: 0,
            converted_leads: 0,
            conversion_rate: 0,
            total_revenue: 0,
            avg_revenue_per_lead: 0,
            profit_per_converted_lead: 0
          }
        }

        supplierStats[supplierId].total_leads++
      })

      // Add sold leads data by matching supplier
      soldLeadsData?.forEach(sale => {
        const supplierId = sale.source_supplier_id
        const revenue = parseFloat(sale.selling_cost) || 0

        if (supplierStats[supplierId]) {
          supplierStats[supplierId].converted_leads++
          supplierStats[supplierId].total_revenue += revenue
        } else {
          // Handle case where sold lead doesn't match any supplier in our total leads
          const supplierName = sale.suppliers?.name || 'Unknown'
          supplierStats[supplierId] = {
            supplier_id: supplierId,
            supplier_name: supplierName,
            source: sale.source_name || 'Unknown',
            total_leads: 0, // We don't have total leads data for this supplier in this period
            converted_leads: 1,
            conversion_rate: 0, // Can't calculate without total
            total_revenue: revenue,
            avg_revenue_per_lead: revenue,
            profit_per_converted_lead: revenue
          }
        }
      })

      // Calculate conversion rates and averages
      Object.values(supplierStats).forEach((supplier: any) => {
        // Calculate conversion rate (only if we have total leads)
        if (supplier.total_leads > 0) {
          supplier.conversion_rate = ((supplier.converted_leads / supplier.total_leads) * 100).toFixed(2)
        } else {
          supplier.conversion_rate = 0 // No total leads data available
        }

        // Calculate average selling price per lead
        if (supplier.converted_leads > 0) {
          supplier.avg_revenue_per_lead = (supplier.total_revenue / supplier.converted_leads).toFixed(2)
        } else {
          supplier.avg_revenue_per_lead = '0.00'
        }

        // Format total revenue
        supplier.total_revenue = parseFloat(supplier.total_revenue.toFixed(2))
      })

      // Calculate overall summary
      const totalLeadsCount = totalLeadsData?.length || 0
      const totalSoldCount = soldLeadsData?.length || 0
      const totalRevenue = soldLeadsData?.reduce((sum, sale) => sum + (parseFloat(sale.selling_cost) || 0), 0) || 0
      const overallConversionRate = totalLeadsCount > 0 ? ((totalSoldCount / totalLeadsCount) * 100).toFixed(2) : 0

      // Sort suppliers by conversion rate (highest first)
      const sortedSuppliers = Object.values(supplierStats)
        .filter((supplier: any) => supplier.total_leads > 0 || supplier.converted_leads > 0)
        .sort((a: any, b: any) => {
          // Sort by conversion rate if both have total leads
          if (a.total_leads > 0 && b.total_leads > 0) {
            return parseFloat(b.conversion_rate) - parseFloat(a.conversion_rate)
          }
          // Otherwise sort by converted leads count
          return b.converted_leads - a.converted_leads
        })

      reportData = {
        summary: {
          total_leads_available: totalLeadsCount,
          total_leads_sold: totalSoldCount,
          overall_conversion_rate: overallConversionRate + '%',
          total_revenue_generated: totalRevenue.toFixed(2),
          avg_revenue_per_sold_lead: totalSoldCount > 0 ? (totalRevenue / totalSoldCount).toFixed(2) : '0.00',
          period: `${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`,
          explanation: 'Conversion rate = (Leads Sold / Total Leads Available) × 100. Revenue from clients_history table.',
          debug_info: `Found ${totalLeadsData?.length || 0} total leads and ${soldLeadsData?.length || 0} sold leads`
        },
        conversion_by_supplier: sortedSuppliers.length > 0 ? sortedSuppliers.map((supplier: any) => ({
          supplier_name: supplier.supplier_name,
          source: supplier.source,
          total_leads_available: supplier.total_leads,
          leads_sold: supplier.converted_leads,
          conversion_rate: supplier.total_leads > 0 ? supplier.conversion_rate + '%' : 'N/A (no total data)',
          total_selling_revenue: supplier.total_revenue.toFixed(2),
          avg_selling_price_per_lead: supplier.avg_revenue_per_lead || '0.00',
          profit_from_sales: supplier.total_revenue.toFixed(2)
        })) : [{
          supplier_name: 'No Data Available',
          source: 'N/A',
          total_leads_available: 0,
          leads_sold: 0,
          conversion_rate: '0%',
          total_selling_revenue: '0.00',
          avg_selling_price_per_lead: '0.00',
          profit_from_sales: '0.00',
          note: 'No conversion data found for the selected date range'
        }]
      }

      console.log('Final conversion report data:', JSON.stringify(reportData, null, 2))
    }
    else if (type.includes('revenue')) {
      reportName = 'Revenue Analysis Report'
      console.log('Fetching revenue data from clients_history...')

      const { data: revenueData, error } = await supabase
        .from('clients_history')
        .select(`
          selling_cost,
          source_name,
          client_id,
          distributed_at,
          clients(name),
          suppliers(name)
        `)
        .gte('distributed_at', fromDate.toISOString())
        .lte('distributed_at', toDate.toISOString())

      if (error) {
        console.error('Error fetching revenue data:', error)
        throw error
      }

      // Calculate revenue by source and client
      const sourceRevenue: Record<string, any> = {}
      const clientRevenue: Record<string, any> = {}

      revenueData?.forEach(sale => {
        const source = sale.source_name || 'Unknown'
        const client = sale.clients?.name || 'Unknown'
        const supplier = sale.suppliers?.name || 'Unknown'
        const revenue = parseFloat(sale.selling_cost) || 0

        // Revenue by source
        if (!sourceRevenue[source]) {
          sourceRevenue[source] = {
            source: source,
            supplier: supplier,
            total_revenue: 0,
            leads_sold: 0,
            avg_revenue_per_lead: 0
          }
        }
        sourceRevenue[source].total_revenue += revenue
        sourceRevenue[source].leads_sold++

        // Revenue by client
        if (!clientRevenue[client]) {
          clientRevenue[client] = {
            client: client,
            total_revenue: 0,
            leads_purchased: 0,
            avg_revenue_per_lead: 0
          }
        }
        clientRevenue[client].total_revenue += revenue
        clientRevenue[client].leads_purchased++
      })

      // Calculate averages
      Object.values(sourceRevenue).forEach((item: any) => {
        item.avg_revenue_per_lead = item.leads_sold > 0 ?
          (item.total_revenue / item.leads_sold).toFixed(2) : 0
      })

      Object.values(clientRevenue).forEach((item: any) => {
        item.avg_revenue_per_lead = item.leads_purchased > 0 ?
          (item.total_revenue / item.leads_purchased).toFixed(2) : 0
      })

      reportData = {
        revenue_by_source: Object.values(sourceRevenue),
        revenue_by_client: Object.values(clientRevenue),
        summary: {
          total_revenue: revenueData?.reduce((sum, sale) => sum + (parseFloat(sale.selling_cost) || 0), 0) || 0,
          total_leads_sold: revenueData?.length || 0,
          unique_clients: Object.keys(clientRevenue).length,
          unique_sources: Object.keys(sourceRevenue).length
        }
      }
    }
    else if (type.includes('clients')) {
      reportName = 'Client Analysis Report'
      console.log('Fetching client analysis data...')

      const { data: clientData, error } = await supabase
        .from('clients_history')
        .select(`
          client_id,
          selling_cost,
          distributed_at,
          lead_id,
          clients(name, email, contactperson, deliveryformat, isactive)
        `)
        .gte('distributed_at', fromDate.toISOString())
        .lte('distributed_at', toDate.toISOString())

      if (error) {
        console.error('Error fetching client data:', error)
        throw error
      }

      // Process client metrics
      const clientMetrics: Record<string, any> = {}

      clientData?.forEach(record => {
        const client = record.clients
        const clientName = client?.name || 'Unknown'
        const revenue = parseFloat(record.selling_cost) || 0

        if (!clientMetrics[clientName]) {
          clientMetrics[clientName] = {
            client_name: clientName,
            client_email: client?.email || '',
            contact_person: client?.contactperson || '',
            delivery_format: client?.deliveryformat || '',
            is_active: client?.isactive || false,
            total_leads_purchased: 0,
            total_revenue_paid: 0,
            average_cost_per_lead: 0,
            first_purchase: null,
            last_purchase: null
          }
        }

        const metrics = clientMetrics[clientName]
        metrics.total_leads_purchased++
        metrics.total_revenue_paid += revenue

        const purchaseDate = new Date(record.distributed_at)
        if (!metrics.first_purchase || purchaseDate < new Date(metrics.first_purchase)) {
          metrics.first_purchase = record.distributed_at
        }
        if (!metrics.last_purchase || purchaseDate > new Date(metrics.last_purchase)) {
          metrics.last_purchase = record.distributed_at
        }
      })

      // Calculate averages
      Object.values(clientMetrics).forEach((client: any) => {
        client.average_cost_per_lead = client.total_leads_purchased > 0 ?
          (client.total_revenue_paid / client.total_leads_purchased).toFixed(2) : 0
      })

      reportData = Object.values(clientMetrics)
    }
    else if (type.includes('lead-sources')) {
      reportName = 'Lead Sources Report'
      console.log('Fetching lead sources data...')

      const { data: sourceData, error } = await supabase
        .from('leads')
        .select(`
          leadsource,
          supplierid,
          id,
          leadcost,
          suppliers(name)
        `)
        .gte('createdat', fromDate.toISOString())
        .lte('createdat', toDate.toISOString())

      if (error) {
        console.error('Error fetching lead sources:', error)
        throw error
      }

      // Group by source and supplier
      const sourcesData = sourceData?.reduce<Record<string, any>>((acc, lead) => {
        const source = lead.leadsource || 'Unknown'
        const supplier = lead.suppliers?.name || 'Unknown'
        const key = `${source}_${supplier}`

        if (!acc[key]) {
          acc[key] = {
            lead_source: source,
            supplier_name: supplier,
            lead_count: 0,
            total_cost: 0,
            avg_cost: 0
          }
        }

        acc[key].lead_count++
        acc[key].total_cost += parseFloat(lead.leadcost) || 0

        return acc
      }, {})

      // Calculate averages
      Object.values(sourcesData || {}).forEach((item: any) => {
        item.avg_cost = item.lead_count > 0 ? (item.total_cost / item.lead_count).toFixed(2) : 0
      })

      reportData = sourcesData ? Object.values(sourcesData) : []
    }
    else if (type.includes('roi-analysis')) {
      reportName = 'ROI Analysis Report'
      console.log('Fetching ROI analysis data...')

      // Get investment data (what we bought)
      const { data: investmentData, error: investmentError } = await supabase
        .from('upload_batches')
        .select(`
          id,
          supplierid,
          total_buying_price,
          totalleads,
          createdat,
          suppliers(name)
        `)
        .gte('createdat', fromDate.toISOString())
        .lte('createdat', toDate.toISOString())

      if (investmentError) {
        console.error('Error fetching investment data:', investmentError)
        throw investmentError
      }

      // Get revenue data (what we sold) from clients_history
      const { data: revenueData, error: revenueError } = await supabase
        .from('clients_history')
        .select(`
          selling_cost,
          source_batch_id,
          source_supplier_id,
          distributed_at,
          suppliers(name)
        `)
        .gte('distributed_at', fromDate.toISOString())
        .lte('distributed_at', toDate.toISOString())

      if (revenueError) {
        console.error('Error fetching revenue data:', revenueError)
        throw revenueError
      }

      // Calculate ROI by supplier
      const supplierROI: Record<string, any> = {}

      // Track investments
      investmentData?.forEach(batch => {
        const supplier = batch.suppliers?.name || 'Unknown'
        const investment = parseFloat(batch.total_buying_price) || 0

        if (!supplierROI[supplier]) {
          supplierROI[supplier] = {
            supplier_name: supplier,
            total_investment: 0,
            total_revenue: 0,
            leads_bought: 0,
            leads_sold: 0,
            roi_percentage: 0,
            profit: 0
          }
        }

        supplierROI[supplier].total_investment += investment
        supplierROI[supplier].leads_bought += batch.totalleads || 0
      })

      // Track revenue (leads sold)
      revenueData?.forEach(sale => {
        const supplier = sale.suppliers?.name || 'Unknown'
        const revenue = parseFloat(sale.selling_cost) || 0

        if (supplierROI[supplier]) {
          supplierROI[supplier].total_revenue += revenue
          supplierROI[supplier].leads_sold++
        }
      })

      // Calculate ROI metrics
      Object.values(supplierROI).forEach((supplier: any) => {
        supplier.profit = supplier.total_revenue - supplier.total_investment
        supplier.roi_percentage = supplier.total_investment > 0 ?
          ((supplier.profit / supplier.total_investment) * 100).toFixed(2) : 0
        supplier.conversion_rate = supplier.leads_bought > 0 ?
          ((supplier.leads_sold / supplier.leads_bought) * 100).toFixed(2) : 0
      })

      reportData = Object.values(supplierROI)
    }
    else if (type.includes('investment-profit')) {
      reportName = 'Investment vs Profit Report'
      console.log('Fetching investment vs profit data...')

      // Get total investments (buying costs)
      const { data: investmentData, error: investmentError } = await supabase
        .from('upload_batches')
        .select('total_buying_price, totalleads, createdat, suppliers(name)')
        .gte('createdat', fromDate.toISOString())
        .lte('createdat', toDate.toISOString())

      if (investmentError) {
        console.error('Error fetching investment data:', investmentError)
        throw investmentError
      }

      // Get total revenue (selling income)
      const { data: revenueData, error: revenueError } = await supabase
        .from('clients_history')
        .select('selling_cost, distributed_at, source_supplier_id, suppliers(name)')
        .gte('distributed_at', fromDate.toISOString())
        .lte('distributed_at', toDate.toISOString())

      if (revenueError) {
        console.error('Error fetching revenue data:', revenueError)
        throw revenueError
      }

      // Calculate totals
      const totalInvestment = investmentData?.reduce((sum, batch) =>
        sum + (parseFloat(batch.total_buying_price) || 0), 0) || 0

      const totalRevenue = revenueData?.reduce((sum, sale) =>
        sum + (parseFloat(sale.selling_cost) || 0), 0) || 0

      const totalProfit = totalRevenue - totalInvestment
      const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0
      const roi = totalInvestment > 0 ? ((totalProfit / totalInvestment) * 100).toFixed(2) : 0

      // Breakdown by supplier
      const supplierBreakdown: Record<string, any> = {}

      // Add investment data
      investmentData?.forEach(batch => {
        const supplier = batch.suppliers?.name || 'Unknown'
        const investment = parseFloat(batch.total_buying_price) || 0

        if (!supplierBreakdown[supplier]) {
          supplierBreakdown[supplier] = {
            supplier_name: supplier,
            total_investment: 0,
            total_revenue: 0,
            leads_bought: 0,
            leads_sold: 0,
            profit: 0,
            roi_percentage: 0
          }
        }

        supplierBreakdown[supplier].total_investment += investment
        supplierBreakdown[supplier].leads_bought += batch.totalleads || 0
      })

      // Add revenue data
      revenueData?.forEach(sale => {
        const supplier = sale.suppliers?.name || 'Unknown'
        const revenue = parseFloat(sale.selling_cost) || 0

        if (supplierBreakdown[supplier]) {
          supplierBreakdown[supplier].total_revenue += revenue
          supplierBreakdown[supplier].leads_sold += 1
        } else {
          // Create entry for suppliers with sales but no investment data in this period
          supplierBreakdown[supplier] = {
            supplier_name: supplier,
            total_investment: 0,
            total_revenue: revenue,
            leads_bought: 0,
            leads_sold: 1,
            profit: 0,
            roi_percentage: 0
          }
        }
      })

      // Calculate profit and ROI for each supplier
      Object.values(supplierBreakdown).forEach((supplier: any) => {
        supplier.profit = supplier.total_revenue - supplier.total_investment
        supplier.roi_percentage = supplier.total_investment > 0 ?
          ((supplier.profit / supplier.total_investment) * 100).toFixed(2) : 'N/A'

        // Format numbers
        supplier.total_investment = supplier.total_investment.toFixed(2)
        supplier.total_revenue = supplier.total_revenue.toFixed(2)
        supplier.profit = supplier.profit.toFixed(2)
      })

      reportData = {
        summary: {
          total_investment: totalInvestment.toFixed(2),
          total_revenue: totalRevenue.toFixed(2),
          total_profit: totalProfit.toFixed(2),
          profit_margin_percentage: profitMargin + '%',
          roi_percentage: roi + '%',
          leads_bought: investmentData?.reduce((sum, batch) => sum + (batch.totalleads || 0), 0) || 0,
          leads_sold: revenueData?.length || 0,
          period: `${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}`
        },
        supplier_breakdown: Object.values(supplierBreakdown).sort((a: any, b: any) =>
          parseFloat(b.profit) - parseFloat(a.profit)
        )
      }
    }
    else if (type.includes('daily-summary') || type.includes('weekly-summary') || type.includes('monthly-summary')) {
      const period = type.includes('daily-summary') ? 'Daily' : type.includes('weekly-summary') ? 'Weekly' : 'Monthly'
      reportName = `${period} Summary Report`
      console.log(`Fetching ${period.toLowerCase()} summary data...`)

      // Get buying data (what we purchased from suppliers)
      const { data: buyingData, error: buyingError } = await supabase
        .from('upload_batches')
        .select(`
          total_buying_price,
          totalleads,
          createdat,
          suppliers(name)
        `)
        .gte('createdat', fromDate.toISOString())
        .lte('createdat', toDate.toISOString())

      if (buyingError) {
        console.error('Error fetching buying data:', buyingError)
        throw buyingError
      }

      // Get selling data (what we sold to clients)
      const { data: sellingData, error: sellingError } = await supabase
        .from('clients_history')
        .select(`
          selling_cost,
          distributed_at,
          clients(name),
          suppliers(name)
        `)
        .gte('distributed_at', fromDate.toISOString())
        .lte('distributed_at', toDate.toISOString())

      if (sellingError) {
        console.error('Error fetching selling data:', sellingError)
        throw sellingError
      }

      // Calculate buying summary by supplier
      const buyingBySupplier: Record<string, any> = {}
      buyingData?.forEach(batch => {
        const supplier = batch.suppliers?.name || 'Unknown'
        const cost = parseFloat(batch.total_buying_price) || 0
        const leads = batch.totalleads || 0

        if (!buyingBySupplier[supplier]) {
          buyingBySupplier[supplier] = {
            supplier_name: supplier,
            total_spent: 0,
            leads_bought: 0,
            batches: 0
          }
        }

        buyingBySupplier[supplier].total_spent += cost
        buyingBySupplier[supplier].leads_bought += leads
        buyingBySupplier[supplier].batches++
      })

      // Calculate selling summary by client
      const sellingByClient: Record<string, any> = {}
      sellingData?.forEach(sale => {
        const client = sale.clients?.name || 'Unknown'
        const revenue = parseFloat(sale.selling_cost) || 0

        if (!sellingByClient[client]) {
          sellingByClient[client] = {
            client_name: client,
            total_revenue: 0,
            leads_sold: 0
          }
        }

        sellingByClient[client].total_revenue += revenue
        sellingByClient[client].leads_sold++
      })

      // Calculate totals
      const totalInvestment = buyingData?.reduce((sum, batch) =>
        sum + (parseFloat(batch.total_buying_price) || 0), 0) || 0
      const totalRevenue = sellingData?.reduce((sum, sale) =>
        sum + (parseFloat(sale.selling_cost) || 0), 0) || 0
      const totalProfit = totalRevenue - totalInvestment

      reportData = {
        period: `${period} Summary (${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]})`,
        financial_overview: {
          total_investment: totalInvestment.toFixed(2),
          total_revenue: totalRevenue.toFixed(2),
          total_profit: totalProfit.toFixed(2),
          profit_margin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0,
          roi_percentage: totalInvestment > 0 ? ((totalProfit / totalInvestment) * 100).toFixed(2) : 0
        },
        buying_summary: {
          total_leads_bought: buyingData?.reduce((sum, batch) => sum + (batch.totalleads || 0), 0) || 0,
          total_batches: buyingData?.length || 0,
          unique_suppliers: Object.keys(buyingBySupplier).length,
          by_supplier: Object.values(buyingBySupplier)
        },
        selling_summary: {
          total_leads_sold: sellingData?.length || 0,
          unique_clients: Object.keys(sellingByClient).length,
          by_client: Object.values(sellingByClient)
        }
      }
    }
    else {
      // Fallback for any unimplemented report types
      reportName = 'Basic Report'
      console.log('Using fallback basic report...')

      const { data, error } = await supabase
        .from('leads')
        .select('id, firstname, lastname, email, leadsource, leadstatus, createdat')
        .gte('createdat', fromDate.toISOString())
        .lte('createdat', toDate.toISOString())
        .limit(100)

      if (error) {
        console.error('Error fetching basic report data:', error)
        throw error
      }

      reportData = data || []
    }

    // Generate file content based on format
    let fileContent = ''
    let contentType = 'text/plain'
    let fileName = `${reportName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`
    
    if (format === 'csv') {
      contentType = 'text/csv'

      // Handle different report data structures
      if (Array.isArray(reportData)) {
        // Simple array data
        if (reportData.length > 0) {
          const headers = Object.keys(reportData[0]).join(',')
          const rows = reportData.map((row: any) =>
            Object.values(row).map(field =>
              `"${String(field ?? '').replace(/"/g, '""')}"`
            ).join(',')
          )
          fileContent = [headers, ...rows].join('\n')
        }
      } else if (reportData && typeof reportData === 'object') {
        // Handle structured reports (like conversion analysis)
        if (reportData.summary && reportData.conversion_by_supplier) {
          // Conversion Analysis Report
          let csvContent = '# CONVERSION ANALYSIS REPORT\n\n'

          // Add summary section
          csvContent += '# SUMMARY\n'
          csvContent += 'Metric,Value\n'
          Object.entries(reportData.summary).forEach(([key, value]) => {
            csvContent += `"${key}","${value}"\n`
          })

          csvContent += '\n# CONVERSION BY SUPPLIER\n'
          if (reportData.conversion_by_supplier.length > 0) {
            const headers = Object.keys(reportData.conversion_by_supplier[0]).map(key => `"${key}"`).join(',')
            const rows = reportData.conversion_by_supplier.map((row: any) =>
              Object.values(row).map(field =>
                `"${String(field ?? '').replace(/"/g, '""')}"`
              ).join(',')
            )
            csvContent += [headers, ...rows].join('\n')
          }

          fileContent = csvContent
        } else if (reportData.revenue_by_source && reportData.revenue_by_client) {
          // Revenue Analysis Report
          let csvContent = '# REVENUE ANALYSIS REPORT\n\n'

          // Summary
          if (reportData.summary) {
            csvContent += '# SUMMARY\n'
            csvContent += 'Metric,Value\n'
            Object.entries(reportData.summary).forEach(([key, value]) => {
              csvContent += `"${key}","${value}"\n`
            })
            csvContent += '\n'
          }

          // Revenue by source
          csvContent += '# REVENUE BY SOURCE\n'
          if (reportData.revenue_by_source.length > 0) {
            const headers = Object.keys(reportData.revenue_by_source[0]).map(key => `"${key}"`).join(',')
            const rows = reportData.revenue_by_source.map((row: any) =>
              Object.values(row).map(field =>
                `"${String(field ?? '').replace(/"/g, '""')}"`
              ).join(',')
            )
            csvContent += [headers, ...rows].join('\n')
          }

          csvContent += '\n# REVENUE BY CLIENT\n'
          if (reportData.revenue_by_client.length > 0) {
            const headers = Object.keys(reportData.revenue_by_client[0]).map(key => `"${key}"`).join(',')
            const rows = reportData.revenue_by_client.map((row: any) =>
              Object.values(row).map(field =>
                `"${String(field ?? '').replace(/"/g, '""')}"`
              ).join(',')
            )
            csvContent += [headers, ...rows].join('\n')
          }

          fileContent = csvContent
        } else if (reportData.summary && reportData.supplier_breakdown) {
          // Investment vs Profit Report
          let csvContent = '# INVESTMENT VS PROFIT REPORT\n\n'

          // Add summary section
          csvContent += '# SUMMARY\n'
          csvContent += 'Metric,Value\n'
          Object.entries(reportData.summary).forEach(([key, value]) => {
            csvContent += `"${key}","${value}"\n`
          })

          csvContent += '\n# SUPPLIER BREAKDOWN\n'
          if (reportData.supplier_breakdown.length > 0) {
            const headers = Object.keys(reportData.supplier_breakdown[0]).map(key => `"${key}"`).join(',')
            const rows = reportData.supplier_breakdown.map((row: any) =>
              Object.values(row).map(field =>
                `"${String(field ?? '').replace(/"/g, '""')}"`
              ).join(',')
            )
            csvContent += [headers, ...rows].join('\n')
          }

          fileContent = csvContent
        } else if (reportData.financial_overview && reportData.buying_summary && reportData.selling_summary) {
          // Daily/Weekly/Monthly Summary Report
          let csvContent = `# ${reportData.period.toUpperCase()}\n\n`

          // Financial Overview
          csvContent += '# FINANCIAL OVERVIEW\n'
          csvContent += 'Metric,Value\n'
          Object.entries(reportData.financial_overview).forEach(([key, value]) => {
            csvContent += `"${key}","${value}"\n`
          })

          // Buying Summary
          csvContent += '\n# BUYING SUMMARY\n'
          csvContent += 'Metric,Value\n'
          const buyingSummaryMetrics = {
            total_leads_bought: reportData.buying_summary.total_leads_bought,
            total_batches: reportData.buying_summary.total_batches,
            unique_suppliers: reportData.buying_summary.unique_suppliers
          }
          Object.entries(buyingSummaryMetrics).forEach(([key, value]) => {
            csvContent += `"${key}","${value}"\n`
          })

          csvContent += '\n# BUYING BY SUPPLIER\n'
          if (reportData.buying_summary.by_supplier.length > 0) {
            const headers = Object.keys(reportData.buying_summary.by_supplier[0]).map(key => `"${key}"`).join(',')
            const rows = reportData.buying_summary.by_supplier.map((row: any) =>
              Object.values(row).map(field =>
                `"${String(field ?? '').replace(/"/g, '""')}"`
              ).join(',')
            )
            csvContent += [headers, ...rows].join('\n')
          }

          // Selling Summary
          csvContent += '\n\n# SELLING SUMMARY\n'
          csvContent += 'Metric,Value\n'
          const sellingSummaryMetrics = {
            total_leads_sold: reportData.selling_summary.total_leads_sold,
            unique_clients: reportData.selling_summary.unique_clients
          }
          Object.entries(sellingSummaryMetrics).forEach(([key, value]) => {
            csvContent += `"${key}","${value}"\n`
          })

          csvContent += '\n# SELLING BY CLIENT\n'
          if (reportData.selling_summary.by_client.length > 0) {
            const headers = Object.keys(reportData.selling_summary.by_client[0]).map(key => `"${key}"`).join(',')
            const rows = reportData.selling_summary.by_client.map((row: any) =>
              Object.values(row).map(field =>
                `"${String(field ?? '').replace(/"/g, '""')}"`
              ).join(',')
            )
            csvContent += [headers, ...rows].join('\n')
          }

          fileContent = csvContent
        } else if (reportData.report_title && reportData.sections) {
          // Comprehensive Business Report
          let csvContent = `# ${reportData.report_title.toUpperCase()}\n`
          csvContent += `# Period: ${reportData.period}\n`
          csvContent += `# Generated: ${reportData.generated_at}\n\n`

          // Add each section
          Object.entries(reportData.sections).forEach(([sectionName, sectionData]: [string, any]) => {
            csvContent += `# ${sectionName.toUpperCase().replace(/_/g, ' ')}\n`
            csvContent += 'Metric,Value\n'

            if (typeof sectionData === 'object' && sectionData !== null) {
              Object.entries(sectionData).forEach(([key, value]) => {
                csvContent += `"${key}","${value}"\n`
              })
            }
            csvContent += '\n'
          })

          fileContent = csvContent
        } else {
          // Generic object handling
          fileContent = 'Key,Value\n' +
            Object.entries(reportData).map(([key, value]) =>
              `"${key}","${String(value).replace(/"/g, '""')}"`
            ).join('\n')
        }
      } else {
        fileContent = 'No data available'
      }
      fileName += '.csv'
    }
    else if (format === 'pdf') {
      // PDF generation using jsPDF
      contentType = 'application/pdf'

      try {
        // Import jsPDF dynamically
        const { jsPDF } = await import('jspdf')
        const doc = new jsPDF()

        // Set up PDF styling
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')

        let yPosition = 20
        const pageHeight = doc.internal.pageSize.height
        const margin = 20

        // Helper function to add text with word wrapping
        const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
          doc.setFontSize(fontSize)
          doc.setFont('helvetica', isBold ? 'bold' : 'normal')

          const lines = doc.splitTextToSize(text, doc.internal.pageSize.width - 2 * margin)

          // Check if we need a new page
          if (yPosition + (lines.length * fontSize * 0.5) > pageHeight - margin) {
            doc.addPage()
            yPosition = margin
          }

          doc.text(lines, margin, yPosition)
          yPosition += lines.length * fontSize * 0.5 + 5
        }

        // Add title
        addText(reportName, 18, true)
        yPosition += 10

        if (Array.isArray(reportData)) {
          // Simple array data
          if (reportData.length > 0) {
            addText('Report Data:', 14, true)

            // Add headers
            const headers = Object.keys(reportData[0])
            addText(headers.join(' | '), 10, true)

            // Add data rows (limit to first 50 for PDF readability)
            const limitedData = reportData.slice(0, 50)
            limitedData.forEach((row: any) => {
              const rowText = Object.values(row).map(field => String(field ?? '')).join(' | ')
              addText(rowText, 9)
            })

            if (reportData.length > 50) {
              addText(`... and ${reportData.length - 50} more records`, 10, true)
            }
          }
        } else if (reportData && typeof reportData === 'object') {
          // Handle structured reports
          if (reportData.summary && reportData.conversion_by_supplier) {
            // Conversion Analysis Report
            addText('SUMMARY', 14, true)
            Object.entries(reportData.summary).forEach(([key, value]) => {
              addText(`${key}: ${value}`, 11)
            })

            yPosition += 10
            addText('CONVERSION BY SUPPLIER', 14, true)
            if (reportData.conversion_by_supplier.length > 0) {
              const headers = Object.keys(reportData.conversion_by_supplier[0])
              addText(headers.join(' | '), 10, true)

              reportData.conversion_by_supplier.forEach((row: any) => {
                const rowText = Object.values(row).map(field => String(field ?? '')).join(' | ')
                addText(rowText, 9)
              })
            }
          } else if (reportData.summary && reportData.supplier_breakdown) {
            // Investment vs Profit Report
            addText('INVESTMENT VS PROFIT ANALYSIS', 14, true)
            addText('SUMMARY', 12, true)
            Object.entries(reportData.summary).forEach(([key, value]) => {
              addText(`${key}: ${value}`, 11)
            })

            yPosition += 10
            addText('SUPPLIER BREAKDOWN', 12, true)
            if (reportData.supplier_breakdown.length > 0) {
              const headers = Object.keys(reportData.supplier_breakdown[0])
              addText(headers.join(' | '), 10, true)

              reportData.supplier_breakdown.forEach((row: any) => {
                const rowText = Object.values(row).map(field => String(field ?? '')).join(' | ')
                addText(rowText, 9)
              })
            }
          } else if (reportData.financial_overview && reportData.buying_summary && reportData.selling_summary) {
            // Daily/Weekly/Monthly Summary Report
            addText(reportData.period.toUpperCase(), 14, true)

            addText('FINANCIAL OVERVIEW', 12, true)
            Object.entries(reportData.financial_overview).forEach(([key, value]) => {
              addText(`${key}: ${value}`, 11)
            })

            yPosition += 10
            addText('BUYING SUMMARY', 12, true)
            const buyingSummaryMetrics = {
              total_leads_bought: reportData.buying_summary.total_leads_bought,
              total_batches: reportData.buying_summary.total_batches,
              unique_suppliers: reportData.buying_summary.unique_suppliers
            }
            Object.entries(buyingSummaryMetrics).forEach(([key, value]) => {
              addText(`${key}: ${value}`, 11)
            })

            yPosition += 10
            addText('SELLING SUMMARY', 12, true)
            const sellingSummaryMetrics = {
              total_leads_sold: reportData.selling_summary.total_leads_sold,
              unique_clients: reportData.selling_summary.unique_clients
            }
            Object.entries(sellingSummaryMetrics).forEach(([key, value]) => {
              addText(`${key}: ${value}`, 11)
            })
          } else if (reportData.revenue_by_source && reportData.revenue_by_client && reportData.summary) {
            // Revenue Analysis Report
            addText('REVENUE ANALYSIS REPORT', 16, true)

            // Summary section
            addText('SUMMARY', 14, true)
            Object.entries(reportData.summary).forEach(([key, value]) => {
              addText(`${key}: ${value}`, 11)
            })

            yPosition += 10
            // Revenue by Source
            addText('REVENUE BY SOURCE', 14, true)
            if (Array.isArray(reportData.revenue_by_source) && reportData.revenue_by_source.length > 0) {
              const headers = Object.keys(reportData.revenue_by_source[0])
              addText(headers.join(' | '), 10, true)

              reportData.revenue_by_source.forEach((row: any) => {
                const rowText = Object.values(row).map(field => String(field ?? '')).join(' | ')
                addText(rowText, 9)
              })
            }

            yPosition += 10
            // Revenue by Client
            addText('REVENUE BY CLIENT', 14, true)
            if (Array.isArray(reportData.revenue_by_client) && reportData.revenue_by_client.length > 0) {
              const headers = Object.keys(reportData.revenue_by_client[0])
              addText(headers.join(' | '), 10, true)

              reportData.revenue_by_client.forEach((row: any) => {
                const rowText = Object.values(row).map(field => String(field ?? '')).join(' | ')
                addText(rowText, 9)
              })
            }
          } else if (reportData.report_title && reportData.sections) {
            // Comprehensive Business Report
            addText(reportData.report_title, 16, true)
            addText(`Period: ${reportData.period}`, 12)
            addText(`Generated: ${new Date(reportData.generated_at).toLocaleString()}`, 10)
            yPosition += 10

            Object.entries(reportData.sections).forEach(([sectionName, sectionData]: [string, any]) => {
              addText(sectionName.toUpperCase().replace(/_/g, ' '), 14, true)

              if (typeof sectionData === 'object' && sectionData !== null) {
                Object.entries(sectionData).forEach(([key, value]) => {
                  addText(`${key}: ${value}`, 11)
                })
              }
              yPosition += 5
            })
          } else {
            // Generic object handling
            Object.entries(reportData).forEach(([key, value]) => {
              addText(`${key}: ${String(value)}`, 11)
            })
          }
        }

        // Generate PDF buffer
        const pdfBuffer = doc.output('arraybuffer')
        fileContent = Buffer.from(pdfBuffer)
        fileName += '.pdf'

      } catch (error) {
        console.error('Error generating PDF:', error)
        // Fallback to text format if PDF generation fails
        let textContent = `${reportName}\n\nError generating PDF. Fallback to text format.\n\n`

        if (Array.isArray(reportData)) {
          textContent += JSON.stringify(reportData, null, 2)
        } else {
          textContent += JSON.stringify(reportData, null, 2)
        }

        fileContent = textContent
        fileName += '.txt'
        contentType = 'text/plain'
      }
    }

    // Reports are generated immediately (no scheduling)

    // Try to save report record in database with basic fields first
    let report = null
    try {
      console.log('Saving report record to database...')
      const { data: reportRecord, error: reportError } = await supabase
        .from('reports')
        .insert([{
          user_id: user.id, // Use the integer ID from your custom users table
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
        console.error('Error saving basic report record:', reportError)
        // Continue anyway, don't fail the whole request
      } else {
        report = reportRecord
        console.log('Report record saved successfully:', report?.id)
      }
    } catch (dbError) {
      console.error('Database save failed, continuing with file generation:', dbError)
      // Continue anyway - the user can still download the file
    }



    // Return the file for download
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('=== ERROR IN REPORT GENERATION ===')
    console.error('Error generating report:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error type:', typeof error)
    console.error('Error constructor:', error?.constructor?.name)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return new NextResponse(
      JSON.stringify({
        error: 'Failed to generate report',
        details: errorMessage,
        errorType: typeof error,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
