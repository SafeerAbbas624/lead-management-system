import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get trend analysis data for the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Fetch upload batches for lead trends
    const { data: batches, error: batchError } = await supabase
      .from('upload_batches')
      .select('createdat, totalleads, cleanedleads, duplicateleads, total_buying_price')
      .gte('createdat', sixMonthsAgo.toISOString())
      .order('createdat', { ascending: true })

    if (batchError) {
      console.error('Error fetching batch data:', batchError)
      throw batchError
    }

    // Fetch lead distributions for revenue trends
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
        totalLeads: 0,
        cleanLeads: 0,
        duplicates: 0,
        totalCost: 0,
        totalRevenue: 0,
        leadsGrowth: 0,
        revenueGrowth: 0,
        qualityImprovement: 0,
        costReduction: 0,
        overallScore: 0
      })
    }

    // Aggregate batch data by month
    batches?.forEach(batch => {
      const date = new Date(batch.createdat)
      const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`
      const existing = monthlyData.get(monthKey)
      
      if (existing) {
        existing.totalLeads += batch.totalleads || 0
        existing.cleanLeads += batch.cleanedleads || 0
        existing.duplicates += batch.duplicateleads || 0
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

    // Calculate growth rates and trends
    const dataArray = Array.from(monthlyData.values())
    
    for (let i = 1; i < dataArray.length; i++) {
      const current = dataArray[i]
      const previous = dataArray[i - 1]
      
      // Leads growth
      current.leadsGrowth = previous.totalLeads > 0 
        ? ((current.totalLeads - previous.totalLeads) / previous.totalLeads) * 100 
        : 0
      
      // Revenue growth
      current.revenueGrowth = previous.totalRevenue > 0 
        ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100 
        : 0
      
      // Quality improvement (clean rate improvement)
      const currentQuality = current.totalLeads > 0 ? (current.cleanLeads / current.totalLeads) * 100 : 0
      const previousQuality = previous.totalLeads > 0 ? (previous.cleanLeads / previous.totalLeads) * 100 : 0
      current.qualityImprovement = previousQuality > 0 
        ? currentQuality - previousQuality 
        : 0
      
      // Cost reduction (negative means cost increased)
      const currentCostPerLead = current.totalLeads > 0 ? current.totalCost / current.totalLeads : 0
      const previousCostPerLead = previous.totalLeads > 0 ? previous.totalCost / previous.totalLeads : 0
      current.costReduction = previousCostPerLead > 0 
        ? ((previousCostPerLead - currentCostPerLead) / previousCostPerLead) * 100 
        : 0
      
      // Overall score (weighted average)
      current.overallScore = (
        current.leadsGrowth * 0.3 + 
        current.revenueGrowth * 0.4 + 
        current.qualityImprovement * 0.2 + 
        current.costReduction * 0.1
      )
    }

    return NextResponse.json({
      success: true,
      data: dataArray
    })

  } catch (error) {
    console.error('Error in trend analysis API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch trend analysis data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
