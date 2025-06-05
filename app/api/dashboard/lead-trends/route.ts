import { type NextRequest, NextResponse } from "next/server"

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"
const API_TOKEN = process.env.API_TOKEN

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "daily"
    const days = searchParams.get("days") || "30"

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

    const url = `${PYTHON_BACKEND_URL}/dashboard/lead-trends?period=${period}&days=${days}`

    console.log("Fetching from:", url)

    const response = await fetch(url, {
      headers,
      method: "GET",
    })

    if (!response.ok) {
      console.error("Backend error:", response.status, response.statusText)
      const errorText = await response.text()
      console.error("Error details:", errorText)

      // Return mock data if backend is unavailable
      const mockData = []
      for (let i = 29; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        mockData.push({
          date: date.toISOString().split("T")[0],
          totalLeads: Math.floor(Math.random() * 50) + 30,
          convertedLeads: Math.floor(Math.random() * 15) + 5,
          dncLeads: Math.floor(Math.random() * 5) + 1,
          totalCost: Math.floor(Math.random() * 200) + 100,
          totalRevenue: Math.floor(Math.random() * 500) + 300,
        })
      }

      return NextResponse.json({
        trends: mockData,
        period: period,
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching lead trends:", error)

    // Return mock data on error
    const mockData = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      mockData.push({
        date: date.toISOString().split("T")[0],
        totalLeads: Math.floor(Math.random() * 50) + 30,
        convertedLeads: Math.floor(Math.random() * 15) + 5,
        dncLeads: Math.floor(Math.random() * 5) + 1,
        totalCost: Math.floor(Math.random() * 200) + 100,
        totalRevenue: Math.floor(Math.random() * 500) + 300,
      })
    }

    return NextResponse.json({
      trends: mockData,
      period: period,
    })
  }
}
