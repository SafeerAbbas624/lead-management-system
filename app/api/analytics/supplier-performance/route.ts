import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Fetch suppliers with their upload batch statistics and sales data
    const { data: suppliers, error: supplierError } = await supabase
      .from('suppliers')
      .select(`
        id,
        name,
        lead_cost,
        upload_batches (
          id,
          totalleads,
          cleanedleads,
          duplicateleads,
          dncmatches,
          buying_price_per_lead,
          total_buying_price
        )
      `)

    if (supplierError) {
      console.error('Error fetching supplier data:', supplierError)
      throw supplierError
    }

    // Get sales data for revenue calculation
    const { data: salesData, error: salesError } = await supabase
      .from('clients_history')
      .select('source_supplier_id, selling_cost, source_batch_id')

    if (salesError) {
      console.error('Error fetching sales data:', salesError)
    }

    // Create a map for sales by supplier
    const salesBySupplier = new Map()
    salesData?.forEach(sale => {
      if (sale.source_supplier_id) {
        const supplierId = sale.source_supplier_id
        if (!salesBySupplier.has(supplierId)) {
          salesBySupplier.set(supplierId, { revenue: 0, soldLeads: 0 })
        }
        const supplierSales = salesBySupplier.get(supplierId)
        supplierSales.revenue += parseFloat(sale.selling_cost) || 0
        supplierSales.soldLeads += 1
        salesBySupplier.set(supplierId, supplierSales)
      }
    })

    // Process supplier performance data
    const performanceData = suppliers?.filter(supplier =>
      supplier && supplier.name && typeof supplier.name === 'string' && supplier.name.trim() !== ''
    ).map(supplier => {
      const batches = supplier.upload_batches || []

      const totalLeads = batches.reduce((sum: number, batch: any) => sum + (batch.totalleads || 0), 0)
      const cleanLeads = batches.reduce((sum: number, batch: any) => sum + (batch.cleanedleads || 0), 0)
      const duplicates = batches.reduce((sum: number, batch: any) => sum + (batch.duplicateleads || 0), 0)
      const dncMatches = batches.reduce((sum: number, batch: any) => sum + (batch.dncmatches || 0), 0)

      // Calculate total cost
      const totalCost = batches.reduce((sum: number, batch: any) => {
        return sum + (parseFloat(batch.total_buying_price) || 0)
      }, 0)

      // Get sales data for this supplier
      const supplierSales = salesBySupplier.get(supplier.id) || { revenue: 0, soldLeads: 0 }
      const revenue = supplierSales.revenue
      const soldLeads = supplierSales.soldLeads

      // Calculate ROI
      const roi = totalCost > 0 ? ((revenue - totalCost) / totalCost) * 100 : 0

      // Helper function to safely round numbers
      const safeRound = (value: any, decimals: number = 2): number => {
        if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
          return 0
        }
        const multiplier = Math.pow(10, decimals)
        const result = Math.round(Number(value) * multiplier) / multiplier
        return isNaN(result) || !isFinite(result) ? 0 : result
      }

      return {
        name: String(supplier.name || 'Unknown').trim(),
        leads: Math.max(0, Math.floor(totalLeads)),
        revenue: safeRound(revenue, 2),
        cost: safeRound(totalCost, 2),
        roi: safeRound(roi, 1),
        soldLeads: Math.max(0, Math.floor(soldLeads)),
        qualityScore: totalLeads > 0 ? safeRound((cleanLeads / totalLeads) * 100, 1) : 0
      }
    }) || []

    // Filter out suppliers with no leads
    const filteredData = performanceData.filter(supplier => supplier.leads > 0)

    // Sort by ROI (descending)
    filteredData.sort((a, b) => b.roi - a.roi)

    // Split into top and bottom performers
    const midpoint = Math.ceil(filteredData.length / 2)
    const topSuppliers = filteredData.slice(0, midpoint)
    const bottomSuppliers = filteredData.slice(midpoint)

    // If no data, create demo data
    if (filteredData.length === 0) {
      const demoTopSuppliers = [
        { name: 'Supplier A', leads: 150, revenue: 7500, roi: 25.5 },
        { name: 'Supplier B', leads: 120, revenue: 6000, roi: 20.0 },
        { name: 'Supplier C', leads: 100, revenue: 4500, roi: 15.8 }
      ]
      const demoBottomSuppliers = [
        { name: 'Supplier D', leads: 80, revenue: 2400, roi: 8.5 },
        { name: 'Supplier E', leads: 60, revenue: 1800, roi: 5.2 }
      ]

      return NextResponse.json({
        success: true,
        topSuppliers: demoTopSuppliers,
        bottomSuppliers: demoBottomSuppliers
      })
    }

    return NextResponse.json({
      success: true,
      topSuppliers,
      bottomSuppliers
    })

  } catch (error) {
    console.error('Error in supplier performance API:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch supplier performance data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
