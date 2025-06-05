import { type NextRequest, NextResponse } from "next/server"

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"
const API_TOKEN = process.env.API_TOKEN

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    // Build query string
    const queryParams = new URLSearchParams()
    if (startDate) queryParams.append("start_date", startDate)
    if (endDate) queryParams.append("end_date", endDate)

    // Get authorization header from the request
    const authHeader = request.headers.get("authorization")

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    // Add both auth methods
    if (authHeader) {
      headers.Authorization = authHeader
    }
    if (API_TOKEN) {
      headers["X-API-Key"] = API_TOKEN
    }

    const url = `${PYTHON_BACKEND_URL}/dashboard/stats${queryParams.toString() ? `?${queryParams}` : ""}`
    console.log("Attempting to fetch dashboard stats from:", url) // Add this line
    console.log("With headers:", JSON.stringify(headers)) // Add this line for header inspection

    const response = await fetch(url, {
      headers,
      method: "GET",
    })

    if (!response.ok) {
      console.error("Backend error:", response.status, response.statusText)
      const errorText = await response.text()
      console.error("Error details:", errorText)

      // Return mock data if backend is unavailable
      return NextResponse.json({
        totalLeads: 1250,
        totalUploads: 45,
        dncMatches: 87,
        conversionRate: 12.5,
        convertedLeads: 156,
        totalCost: 5000,
        totalRevenue: 15000,
        netProfit: 10000,
        roi: 200,
        processingBatches: 2,
        failedBatches: 1,
        avgLeadCost: 4,
        avgRevenue: 96.15,
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching dashboard stats from Python backend. Details:")
    if (error instanceof Error) {
      console.error("Error Name:", error.name)
      console.error("Error Message:", error.message)
      console.error("Error Stack:", error.stack)
      // For more detailed network errors, the 'cause' property might be available in newer Node.js versions
      // if (error.cause) {
      //   console.error("Error Cause:", error.cause);
      // }
    } else {
      console.error("Raw error object:", error)
    }
    console.error("PYTHON_BACKEND_URL used:", process.env.PYTHON_BACKEND_URL || "http://localhost:8000 (default)")

    // Return mock data on error
    return NextResponse.json({
      totalLeads: 1250,
      totalUploads: 45,
      dncMatches: 87,
      conversionRate: 12.5,
      convertedLeads: 156,
      totalCost: 5000,
      totalRevenue: 15000,
      netProfit: 10000,
      roi: 200,
      processingBatches: 2,
      failedBatches: 1,
      avgLeadCost: 4,
      avgRevenue: 96.15,
    })
  }
}
