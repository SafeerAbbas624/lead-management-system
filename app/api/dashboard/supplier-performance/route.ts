import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"
const API_TOKEN = process.env.API_TOKEN

export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's session token
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Build query string
    const queryParams = new URLSearchParams()
    if (startDate) queryParams.append("start_date", startDate)
    if (endDate) queryParams.append("end_date", endDate)

    // Call Python backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/supplier-performance?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${session?.access_token || API_TOKEN}`,
        "X-API-Key": API_TOKEN || "",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error("Backend error:", response.status, response.statusText)

      // Return mock data if backend is unavailable
      return NextResponse.json({
        supplierPerformance: [],
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching supplier performance:", error)

    // Return mock data on error
    return NextResponse.json({
      supplierPerformance: [],
    })
  }
}
