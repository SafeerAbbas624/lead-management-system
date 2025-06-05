import { type NextRequest, NextResponse } from "next/server"

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"
const API_TOKEN = process.env.API_TOKEN

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") || "5"

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

    const url = `${PYTHON_BACKEND_URL}/dashboard/recent-uploads?limit=${limit}`
    console.log("Attempting to fetch recent uploads from:", url) // Add this line
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
        batches: [
          {
            id: 1,
            filename: "demo_batch_1.csv",
            status: "Completed",
            totalleads: 150,
            cleanedleads: 130,
            duplicateleads: 15,
            dncmatches: 5,
            createdat: new Date(Date.now() - 86400000).toISOString(),
            processingprogress: 100,
            errormessage: "",
          },
          {
            id: 2,
            filename: "demo_batch_2.xlsx",
            status: "Processing",
            totalleads: 200,
            cleanedleads: 0,
            duplicateleads: 0,
            dncmatches: 0,
            createdat: new Date().toISOString(),
            processingprogress: 45,
            errormessage: "",
          },
        ],
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching recent uploads from Python backend. Details:")
    if (error instanceof Error) {
      console.error("Error Name:", error.name)
      console.error("Error Message:", error.message)
      console.error("Error Stack:", error.stack)
      // if (error.cause) {
      //   console.error("Error Cause:", error.cause);
      // }
    } else {
      console.error("Raw error object:", error)
    }
    console.error("PYTHON_BACKEND_URL used:", process.env.PYTHON_BACKEND_URL || "http://localhost:8000 (default)")

    // Return mock data on error
    return NextResponse.json({
      batches: [
        {
          id: 1,
          filename: "demo_batch_1.csv",
          status: "Completed",
          totalleads: 150,
          cleanedleads: 130,
          duplicateleads: 15,
          dncmatches: 5,
          createdat: new Date(Date.now() - 86400000).toISOString(),
          processingprogress: 100,
          errormessage: "",
        },
        {
          id: 2,
          filename: "demo_batch_2.xlsx",
          status: "Processing",
          totalleads: 200,
          cleanedleads: 0,
          duplicateleads: 0,
          dncmatches: 0,
          createdat: new Date().toISOString(),
          processingprogress: 45,
          errormessage: "",
        },
      ],
    })
  }
}
