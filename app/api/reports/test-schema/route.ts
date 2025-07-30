import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Use service role key to check schema
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Test if we can query the reports table with new columns
    const { data, error } = await supabase
      .from('reports')
      .select(`
        id,
        name,
        type,
        format,
        date_from,
        date_to,
        status,
        created_at,
        file_name,
        report_category,
        schedule_type,
        data_summary
      `)
      .limit(1)

    if (error) {
      console.error('Schema test error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Schema test passed',
      columns_accessible: true,
      sample_data: data
    })
  } catch (error) {
    console.error('Schema test exception:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
