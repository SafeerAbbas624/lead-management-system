import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get duplicate leads with supplier information
    const { data, error } = await supabase
      .from('duplicate_leads')
      .select(`
        supplier_id,
        suppliers!inner(name)
      `)
      .not('supplier_id', 'is', null)

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Count duplicates by supplier
    const supplierCounts = data.reduce((acc: any, duplicate: any) => {
      const supplierId = duplicate.supplier_id
      const supplierName = duplicate.suppliers?.name || 'Unknown'

      if (!acc[supplierId]) {
        acc[supplierId] = {
          name: supplierName,
          count: 0
        }
      }
      acc[supplierId].count++
      return acc
    }, {})

    // Convert to array and sort by duplicate count
    const topDuplicatesBySuppliers = Object.values(supplierCounts)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10) // Top 10 suppliers by duplicate count

    return NextResponse.json({
      success: true,
      data: topDuplicatesBySuppliers
    })
  } catch (error) {
    console.error("Error fetching top duplicates by suppliers:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch top duplicates by suppliers"
      },
      { status: 500 }
    )
  }
}
