import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get top suppliers by lead count with supplier names
    const { data, error } = await supabase
      .from('leads')
      .select(`
        supplierid,
        suppliers!inner(name)
      `)
      .not('supplierid', 'is', null)

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Count leads by supplier
    const supplierCounts = data.reduce((acc: any, lead: any) => {
      const supplierId = lead.supplierid
      const supplierName = lead.suppliers?.name || 'Unknown'

      if (!acc[supplierId]) {
        acc[supplierId] = {
          name: supplierName,
          count: 0
        }
      }
      acc[supplierId].count++
      return acc
    }, {})

    // Convert to array and sort by lead count
    const topSuppliers = Object.values(supplierCounts)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10) // Top 10 suppliers

    return NextResponse.json({
      success: true,
      data: topSuppliers
    })
  } catch (error) {
    console.error("Error fetching top suppliers:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch top suppliers"
      },
      { status: 500 }
    )
  }
}
