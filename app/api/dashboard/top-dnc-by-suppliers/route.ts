import { NextResponse } from "next/server"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Try a different approach: Get upload batches with their DNC matches count
    // Since upload_batches has a dncmatches field, we can use that
    const { data: batchData, error: batchError } = await supabase
      .from('upload_batches')
      .select(`
        filename,
        sourcename,
        dncmatches,
        supplierid,
        suppliers!inner(name)
      `)
      .gt('dncmatches', 0) // Only batches with DNC matches

    if (batchError) {
      console.error('Supabase batch error:', batchError)
      throw batchError
    }

    console.log('Upload batches with DNC matches:', batchData)

    // If we have upload batches with DNC matches, use those
    if (batchData && batchData.length > 0) {
      const supplierCounts: any = {}

      batchData.forEach((batch: any) => {
        const supplierName = batch.suppliers?.name || 'Unknown'
        const dncCount = batch.dncmatches || 0

        if (!supplierCounts[supplierName]) {
          supplierCounts[supplierName] = {
            name: supplierName,
            count: 0
          }
        }
        supplierCounts[supplierName].count += dncCount
      })

      const topDncBySuppliers = Object.values(supplierCounts)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10)

      return NextResponse.json({
        success: true,
        data: topDncBySuppliers
      })
    }

    // Fallback: Try the original approach with DNC entries
    const { data: dncData, error: dncError } = await supabase
      .from('dnc_entries')
      .select('source')

    if (dncError) {
      console.error('Supabase DNC error:', dncError)
      throw dncError
    }

    // Get all upload batches for mapping
    const { data: allBatches, error: allBatchesError } = await supabase
      .from('upload_batches')
      .select(`
        filename,
        sourcename,
        suppliers!inner(name)
      `)

    if (allBatchesError) {
      console.error('Supabase all batches error:', allBatchesError)
      throw allBatchesError
    }

    // Create mapping with multiple strategies
    const sourceToSupplier: any = {}

    allBatches.forEach((batch: any) => {
      const supplierName = batch.suppliers?.name || 'Unknown'

      // Map various forms of the filename
      if (batch.filename) {
        sourceToSupplier[batch.filename] = supplierName

        // Remove extension
        const nameWithoutExt = batch.filename.replace(/\.(csv|xlsx|xls)$/i, '')
        sourceToSupplier[nameWithoutExt] = supplierName

        // Remove common prefixes
        const cleanName = nameWithoutExt.replace(/^(upload_|Upload:\s*)/i, '')
        sourceToSupplier[cleanName] = supplierName
      }

      if (batch.sourcename) {
        sourceToSupplier[batch.sourcename] = supplierName
      }
    })

    // Count DNC entries by supplier
    const supplierCounts: any = {}

    dncData.forEach((entry: any) => {
      let supplierName = 'Unknown'

      if (entry.source) {
        // Try multiple matching strategies
        const variations = [
          entry.source,
          entry.source.replace(/^Upload:\s*/i, ''),
          entry.source.replace(/\.(csv|xlsx|xls)$/i, ''),
          entry.source.replace(/^Upload:\s*/i, '').replace(/\.(csv|xlsx|xls)$/i, '')
        ]

        for (const variation of variations) {
          if (sourceToSupplier[variation]) {
            supplierName = sourceToSupplier[variation]
            break
          }
        }

        // If still no match, use the cleaned source
        if (supplierName === 'Unknown') {
          supplierName = entry.source
            .replace(/^Upload:\s*/i, '')
            .replace(/\.(csv|xlsx|xls)$/i, '')
            .replace(/^upload_/i, '') || 'Unknown'
        }
      }

      if (!supplierCounts[supplierName]) {
        supplierCounts[supplierName] = {
          name: supplierName,
          count: 0
        }
      }
      supplierCounts[supplierName].count++
    })

    const topDncBySuppliers = Object.values(supplierCounts)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      data: topDncBySuppliers
    })
  } catch (error) {
    console.error("Error fetching top DNC by suppliers:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch top DNC by suppliers"
      },
      { status: 500 }
    )
  }
}
