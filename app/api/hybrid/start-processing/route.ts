import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    
    // Forward the request to Python backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/hybrid/start-processing`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData, let the browser set it
      },
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
    console.error('Error proxying start-processing request:', error);
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
