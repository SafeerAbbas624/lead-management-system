import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"
const API_TOKEN = process.env.API_TOKEN

export async function POST(request: Request) {
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

    // Get request body
    const body = await request.json()

    // Call Python backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/roi-metrics`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.access_token || API_TOKEN}`,
        "X-API-Key": API_TOKEN || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      console.error("Backend error:", response.status, response.statusText)

      // Return mock data if backend is unavailable
      return NextResponse.json({
        totalLeads: 0,
        convertedLeads: 0,
        conversionRate: 0,
        totalCost: 0,
        totalRevenue: 0,
        netProfit: 0,
        roi: 0,
        sourcePerformance: [],
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching ROI metrics:", error)

    // Return mock data on error
    return NextResponse.json({
      totalLeads: 0,
      convertedLeads: 0,
      conversionRate: 0,
      totalCost: 0,
      totalRevenue: 0,
      netProfit: 0,
      roi: 0,
      sourcePerformance: [],
    })
  }
}
