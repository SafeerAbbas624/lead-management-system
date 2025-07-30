import { NextResponse } from "next/server"

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"
const API_TOKEN = process.env.API_TOKEN

export async function GET() {
  try {
    // Call Python backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/dashboard/leads-by-clients`, {
      headers: {
        "X-API-Key": API_TOKEN || "",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching leads by clients:", error)
    return NextResponse.json(
      { error: "Failed to fetch leads by clients" },
      { status: 500 }
    )
  }
}
