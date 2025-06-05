import { type NextRequest, NextResponse } from "next/server"

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL

export async function POST(request: NextRequest) {
  if (!PYTHON_BACKEND_URL) {
    console.error("PYTHON_BACKEND_URL is not set")
    return NextResponse.json({ error: "Backend service URL not configured" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const targetUrl = `${PYTHON_BACKEND_URL}/check-duplicates`

    const headers = new Headers()
    headers.set("Content-Type", "application/json")
    const authHeader = request.headers.get("Authorization")
    if (authHeader) {
      headers.set("Authorization", authHeader)
    }
    const apiKeyHeader = request.headers.get("X-API-Key")
    if (apiKeyHeader) {
      headers.set("X-API-Key", apiKeyHeader)
    }
    // Pass through the system API_TOKEN if present and not using JWT
    // This logic might need refinement based on how API_TOKEN is sent from frontend/client
    if (!authHeader && process.env.API_TOKEN) {
      // If no JWT, and server has API_TOKEN
      // headers.set("X-API-Key", process.env.API_TOKEN); // Prefer explicit X-API-Key from request
    }

    const backendResponse = await fetch(targetUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    })

    const responseData = await backendResponse.json()

    if (!backendResponse.ok) {
      return NextResponse.json(responseData, { status: backendResponse.status })
    }

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error("Error proxying /check-duplicates to Python backend:", error)
    return NextResponse.json({ error: "Failed to connect to backend service", details: error.message }, { status: 503 })
  }
}
