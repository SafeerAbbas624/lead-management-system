import { NextResponse } from "next/server"

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"
const API_TOKEN = process.env.API_TOKEN

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    // Build query string
    const queryParams = new URLSearchParams()
    if (startDate) queryParams.append("start_date", startDate)
    if (endDate) queryParams.append("end_date", endDate)

    // Call Python backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/dashboard/stats?${queryParams}`, {
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
    console.error("Error fetching comprehensive dashboard stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch comprehensive dashboard stats" },
      { status: 500 }
    )
  }
}
