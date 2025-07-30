import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get top clients by distributed leads count from clients_history
    const { data, error } = await supabase
      .from('clients_history')
      .select(`
        client_id,
        clients!inner(name)
      `)

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Count distributed leads by client
    const clientCounts = data.reduce((acc: any, record: any) => {
      const clientId = record.client_id
      const clientName = record.clients?.name || 'Unknown'

      if (!acc[clientId]) {
        acc[clientId] = {
          name: clientName,
          count: 0
        }
      }
      acc[clientId].count++
      return acc
    }, {})

    // Convert to array and sort by distributed leads count
    const topClients = Object.values(clientCounts)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10) // Top 10 clients

    return NextResponse.json({
      success: true,
      data: topClients
    })
  } catch (error) {
    console.error("Error fetching top clients:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch top clients"
      },
      { status: 500 }
    )
  }
}
