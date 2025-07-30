import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get revenue data for the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Fetch upload batches for cost data
    const { data: batches, error: batchError } = await supabase
      .from('upload_batches')
      .select('createdat, total_buying_price')
      .gte('createdat', sixMonthsAgo.toISOString())
      .order('createdat', { ascending: true })

    if (batchError) {
      console.error('Error fetching batch data:', batchError)
      throw batchError
    }

    // Fetch lead distributions for revenue data
    const { data: distributions, error: distError } = await supabase
      .from('lead_distributions')
      .select('createdat, selling_price_per_sheet')
      .gte('createdat', sixMonthsAgo.toISOString())
      .order('createdat', { ascending: true })

    if (distError) {
      console.error('Error fetching distribution data:', distError)
      throw distError
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
        totalCost: 0,
        totalRevenue: 0,
        profit: 0,
        profitMargin: 0
      })
    }

    // Aggregate cost data by month
    batches?.forEach(batch => {
      const date = new Date(batch.createdat)
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`
      const existing = monthlyData.get(monthKey)
      
      if (existing) {
        existing.totalCost += batch.total_buying_price || 0
      }
    })

    // Aggregate revenue data by month
    distributions?.forEach(dist => {
      const date = new Date(dist.createdat)
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`
      const existing = monthlyData.get(monthKey)
      
      if (existing) {
        existing.totalRevenue += dist.selling_price_per_sheet || 0
      }
    })

    // Calculate profit and profit margin
    monthlyData.forEach(data => {
      data.profit = data.totalRevenue - data.totalCost
      data.profitMargin = data.totalRevenue > 0 ? (data.profit / data.totalRevenue) * 100 : 0
    })

    const result = Array.from(monthlyData.values())

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error in revenue analysis API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch revenue analysis data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
