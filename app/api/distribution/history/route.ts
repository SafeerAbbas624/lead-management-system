import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const skip = searchParams.get('skip') || '0'
    const limit = searchParams.get('limit') || '50'

    console.log('Frontend API: Fetching distribution history')

    const response = await fetch(`${BACKEND_URL}/api/distribution/history?skip=${skip}&limit=${limit}`, {
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

    const result = await response.json()
    console.log('Backend response:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching distribution history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch distribution history' },
      { status: 500 }
    )
  }
}
