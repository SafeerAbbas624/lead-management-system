import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get lead volume data for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Fetch upload batches from the last 30 days
    const { data: batches, error } = await supabase
      .from('upload_batches')
      .select('createdat, totalleads, cleanedleads, duplicateleads, dncmatches')
      .gte('createdat', thirtyDaysAgo.toISOString())
      .order('createdat', { ascending: true })

    if (error) {
      console.error('Error fetching lead volume data:', error)
      throw error
    }

    // Group data by date
    const dailyData = new Map()
    
    // Initialize all days in the last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      
      dailyData.set(dateKey, {
        date: dateKey,
        totalLeads: 0,
        cleanLeads: 0,
        duplicates: 0,
        dncMatches: 0
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

    const result = Array.from(dailyData.values())

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error in lead volume API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch lead volume data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
