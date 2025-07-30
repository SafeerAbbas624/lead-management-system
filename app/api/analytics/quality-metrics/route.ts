import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get quality metrics for the last 14 days
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    // Fetch upload batches from the last 14 days
    const { data: batches, error } = await supabase
      .from('upload_batches')
      .select('createdat, totalleads, cleanedleads, duplicateleads, dncmatches')
      .gte('createdat', fourteenDaysAgo.toISOString())
      .order('createdat', { ascending: true })

    if (error) {
      console.error('Error fetching quality metrics data:', error)
      throw error
    }

    // Group data by date
    const dailyData = new Map()
    
    // Initialize all days in the last 14 days
    for (let i = 13; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      
      dailyData.set(dateKey, {
        date: dateKey,
        totalLeads: 0,
        cleanLeads: 0,
        duplicates: 0,
        dncMatches: 0,
        cleanRate: 0,
        duplicateRate: 0,
        dncRate: 0,
        qualityScore: 0
      })
    }

    // Aggregate batch data by date
    batches?.forEach(batch => {
      const dateKey = new Date(batch.createdat).toISOString().split('T')[0]
      const existing = dailyData.get(dateKey)
      
      if (existing) {
        existing.totalLeads += batch.totalleads || 0
        existing.cleanLeads += batch.cleanedleads || 0
        existing.duplicates += batch.duplicateleads || 0
        existing.dncMatches += batch.dncmatches || 0
      }
    })

    // Calculate rates and quality scores
    dailyData.forEach(data => {
      if (data.totalLeads > 0) {
        data.cleanRate = (data.cleanLeads / data.totalLeads) * 100
        data.duplicateRate = (data.duplicates / data.totalLeads) * 100
        data.dncRate = (data.dncMatches / data.totalLeads) * 100
        data.qualityScore = data.cleanRate // Quality score based on clean rate
      }
    })

    const result = Array.from(dailyData.values())

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error in quality metrics API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch quality metrics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
