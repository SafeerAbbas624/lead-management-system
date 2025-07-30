import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const distributionId = params.id
    console.log('Frontend API: Exporting CSV for distribution:', distributionId)
    
    const response = await fetch(`${BACKEND_URL}/api/distribution/export-csv/${distributionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', response.status, errorText)
      return NextResponse.json(
        { error: `Backend error: ${response.status} ${errorText}` },
        { status: response.status }
      )
    }

    // Get the CSV content and filename from backend
    const csvContent = await response.text()
    const contentDisposition = response.headers.get('content-disposition')
    const filename = contentDisposition 
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : `distribution_${distributionId}.csv`
    
    console.log('CSV export successful, filename:', filename)
    
    // Return CSV as downloadable response
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting CSV:', error)
    return NextResponse.json(
      { error: 'Failed to export CSV' },
      { status: 500 }
    )
  }
}
