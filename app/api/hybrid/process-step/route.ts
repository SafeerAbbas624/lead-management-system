import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/hybrid/process-step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Python backend error: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `Backend service error: ${response.status}`,
          details: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error proxying process-step request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to backend service',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
