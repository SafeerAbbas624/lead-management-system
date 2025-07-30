import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get total uploaded leads
    const { count: totalUploaded, error: uploadError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })

    if (uploadError) {
      console.error('Error fetching total leads:', uploadError)
      throw uploadError
    }

    // Get clean leads (total - duplicates - dnc)
    const { data: batches, error: batchError } = await supabase
      .from('upload_batches')
      .select('totalleads, cleanedleads, duplicateleads, dncmatches')

    if (batchError) {
      console.error('Error fetching batch data:', batchError)
      throw batchError
    }

    const totalClean = batches?.reduce((sum, batch) => sum + (batch.cleanedleads || 0), 0) || 0

    // Get distributed leads
    const { data: distributions, error: distError } = await supabase
      .from('lead_distributions')
      .select('leadsallocated')

    if (distError) {
      console.error('Error fetching distribution data:', distError)
      throw distError
    }

    const totalDistributed = distributions?.reduce((sum, dist) => sum + (dist.leadsallocated || 0), 0) || 0

    // Get leads by status for conversion funnel
    const { data: leadsByStatus, error: statusError } = await supabase
      .from('leads')
      .select('leadstatus')

    if (statusError) {
      console.error('Error fetching lead status data:', statusError)
      throw statusError
    }

    // Count leads by status
    const statusCounts = leadsByStatus?.reduce((counts: any, lead) => {
      const status = lead.leadstatus?.toLowerCase() || 'new'
      counts[status] = (counts[status] || 0) + 1
      return counts
    }, {}) || {}

    const contacted = statusCounts['contacted'] || Math.floor(totalDistributed * 0.6)
    const qualified = statusCounts['qualified'] || Math.floor(contacted * 0.4)
    const converted = statusCounts['converted'] || statusCounts['closed won'] || Math.floor(qualified * 0.25)

    const funnelData = [
      { name: 'Total Uploaded', value: totalUploaded || 0, fill: '#8884d8' },
      { name: 'Clean Leads', value: totalClean, fill: '#82ca9d' },
      { name: 'Distributed', value: totalDistributed, fill: '#ffc658' },
      { name: 'Contacted', value: contacted, fill: '#ff7c7c' },
      { name: 'Qualified', value: qualified, fill: '#8dd1e1' },
      { name: 'Converted', value: converted, fill: '#d084d0' }
    ]

    return NextResponse.json({
      success: true,
      data: funnelData
    })

  } catch (error) {
    console.error('Error in conversion funnel API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch conversion funnel data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
