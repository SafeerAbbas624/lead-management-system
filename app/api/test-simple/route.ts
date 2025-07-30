import { NextResponse } from 'next/server'

export async function GET() {
  console.log('Simple test endpoint called')
  return NextResponse.json({
    success: true,
    message: 'Simple test successful',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: Request) {
  console.log('Simple POST test endpoint called')
  try {
    const body = await request.json()
    console.log('Request body:', body)
    
    return NextResponse.json({
      success: true,
      message: 'Simple POST test successful',
      receivedData: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in simple POST test:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
