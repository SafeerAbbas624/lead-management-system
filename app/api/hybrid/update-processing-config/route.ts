import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Frontend API: Forwarding processing config update to backend:', body)
    
    const response = await fetch(`${BACKEND_URL}/api/hybrid/update-processing-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
    console.error('Error forwarding processing config update:', error)
    return NextResponse.json(
      { error: 'Failed to update processing config' },
      { status: 500 }
    )
  }
}
