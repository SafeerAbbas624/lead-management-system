import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get cost analysis data for the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Fetch upload batches for cost data
    const { data: batches, error } = await supabase
      .from('upload_batches')
      .select('createdat, total_buying_price, buying_price_per_lead, totalleads')
      .gte('createdat', sixMonthsAgo.toISOString())
      .order('createdat', { ascending: true })

    if (error) {
      console.error('Error fetching cost analysis data:', error)
      throw error
    }

    // Group data by month
    const monthlyData = new Map()
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`
      const shortKey = months[date.getMonth()]
      
      monthlyData.set(monthKey, {
        month: shortKey,
        totalSpent: 0,
        totalLeads: 0,
        avgCostPerLead: 0,
        efficiency: 100,
        targetCost: 2.50
      })
    }

    // Aggregate cost data by month
    batches?.forEach(batch => {
      const date = new Date(batch.createdat)
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`
      const existing = monthlyData.get(monthKey)
      
      if (existing) {
        existing.totalSpent += batch.total_buying_price || 0
        existing.totalLeads += batch.totalleads || 0
      }
    })

    // Calculate average cost per lead and efficiency
    monthlyData.forEach(data => {
      if (data.totalLeads > 0) {
        data.avgCostPerLead = data.totalSpent / data.totalLeads
        data.efficiency = (data.targetCost / data.avgCostPerLead) * 100
      }
    })

    const result = Array.from(monthlyData.values())

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error in cost analysis API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch cost analysis data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
