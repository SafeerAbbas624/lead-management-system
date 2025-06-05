import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const { filePath, batchId, reprocess = false } = await request.json()

    if (!batchId) {
      return NextResponse.json({ error: "Batch ID is required" }, { status: 400 })
    }

    // Update batch status to processing
    await supabase.from("upload_batches").update({ status: "Processing" }).eq("id", batchId)

    // In a real application, you would call your Python backend here
    // For now, we'll simulate processing with a timeout

    // Call Python backend API
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"
    const response = await fetch(`${pythonBackendUrl}/process-csv`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filePath,
        batchId,
        reprocess,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to process file")
    }

    // For demo purposes, simulate successful processing
    // In a real app, the Python backend would update the database
    setTimeout(async () => {
      await supabase
        .from("upload_batches")
        .update({
          status: "Completed",
          totalLeads: 100,
          cleanedLeads: 85,
          duplicateLeads: 10,
          dncMatches: 5,
          processingProgress: 100,
          completedAt: new Date().toISOString(),
        })
        .eq("id", batchId)
    }, 5000)

    return NextResponse.json({ success: true, message: "Processing started" })
  } catch (error: any) {
    console.error("Error processing CSV:", error)

    return NextResponse.json({ error: error.message || "Failed to process file" }, { status: 500 })
  }
}
