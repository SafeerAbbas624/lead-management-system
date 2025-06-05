import { type NextRequest, NextResponse } from "next/server"

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL

export async function POST(request: NextRequest) {
  if (!PYTHON_BACKEND_URL) {
    console.error("PYTHON_BACKEND_URL is not set")
    return NextResponse.json({ error: "Backend service URL not configured" }, { status: 500 })
  }

  try {
    const body = await request.json()
    const targetUrl = `${PYTHON_BACKEND_URL}/auto-mapping`

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
    console.error("Error proxying /auto-mapping to Python backend:", error)
    return NextResponse.json({ error: "Failed to connect to backend service", details: error.message }, { status: 503 })
  }
}
