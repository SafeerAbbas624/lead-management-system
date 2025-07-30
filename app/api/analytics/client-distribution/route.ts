import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Fetch clients with their distribution history
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select(`
        id,
        name,
        isactive,
        clients_history (
          selling_cost
        ),
        lead_distributions (
          leadsallocated,
          selling_price_per_sheet
        )
      `)
      .eq('isactive', true)

    if (clientError) {
      console.error('Error fetching client data:', clientError)
      throw clientError
    }

    // Process client distribution data
    const distributionData = clients?.map(client => {
      const history = client.clients_history || []
      const distributions = client.lead_distributions || []

      // Calculate leads received from clients_history
      const leadsReceived = history.length

      // Calculate total revenue from lead_distributions
      const totalRevenue = distributions.reduce((sum: number, dist: any) =>
        sum + (dist.selling_price_per_sheet || 0), 0)

      // Alternative: use leadsallocated if clients_history is empty
      const alternativeLeads = distributions.reduce((sum: number, dist: any) =>
        sum + (dist.leadsallocated || 0), 0)

      const finalLeadsReceived = leadsReceived > 0 ? leadsReceived : alternativeLeads

      return {
        name: client.name,
        leadsReceived: finalLeadsReceived,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        percentage: 0 // Will calculate after getting total
      }
    }) || []

    // Filter out clients with no activity
    const activeClients = distributionData.filter(client => client.leadsReceived > 0)

    // Calculate total leads for percentage calculation
    const totalLeads = activeClients.reduce((sum, client) => sum + client.leadsReceived, 0)

    // Calculate percentages
    const clientsWithPercentages = activeClients.map(client => ({
      ...client,
      percentage: totalLeads > 0 ? (client.leadsReceived / totalLeads) * 100 : 0
    }))

    // Sort by leads received (descending)
    clientsWithPercentages.sort((a, b) => b.leadsReceived - a.leadsReceived)

    return NextResponse.json({
      success: true,
      data: clientsWithPercentages
    })

  } catch (error) {
    console.error('Error in client distribution API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch client distribution data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
