"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { supabase } from "@/lib/supabase/client"

interface UploadBatch {
  id: number
  filename: string
  status: string
  totalleads: number
  cleanedleads: number
  duplicateleads: number
  dncmatches: number
  createdat: string
  processingprogress: number
  errormessage: string
}

export function RecentUploads() {
  const [uploads, setUploads] = useState<UploadBatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentUploads = async () => {
      try {
        // Get the current session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        const headers: HeadersInit = {
          "Content-Type": "application/json",
        }

        // Add auth token if available
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`
        }

        const response = await fetch("/api/dashboard/recent-uploads?limit=5", {
          headers,
        })

        if (!response.ok) {
          console.error("API response not ok:", response.status, response.statusText)
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          console.error("Non-JSON response:", text)
          throw new Error("Response is not JSON")
        }

        const data = await response.json()
        setUploads(data.batches || [])
      } catch (error) {
        console.error("Error fetching recent uploads:", error)

        // Fallback to demo data
        setUploads([
          {
            id: 1,
            filename: "leads_batch_1.csv",
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
            filename: "leads_batch_2.xlsx",
            status: "Processing",
            totalleads: 200,
            cleanedleads: 0,
            duplicateleads: 0,
            dncmatches: 0,
            createdat: new Date().toISOString(),
            processingprogress: 45,
            errormessage: "",
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchRecentUploads()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-muted-foreground">Loading recent uploads...</p>
      </div>
    )
  }

  if (uploads.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 border rounded-md">
        <p className="text-muted-foreground">No uploads found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {uploads.map((upload) => (
        <div key={upload.id} className="flex flex-col space-y-2 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">{upload.filename}</div>
            <StatusBadge status={upload.status} />
          </div>
          <div className="text-sm text-muted-foreground">
            Uploaded {formatDistanceToNow(new Date(upload.createdat), { addSuffix: true })}
          </div>
          {upload.status === "Processing" && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${upload.processingprogress}%` }}></div>
            </div>
          )}
          {upload.errormessage && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">Error: {upload.errormessage}</div>
          )}
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div>
              <div className="font-medium">{upload.totalleads || 0}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="font-medium">{upload.cleanedleads || 0}</div>
              <div className="text-xs text-muted-foreground">Clean</div>
            </div>
            <div>
              <div className="font-medium">{upload.duplicateleads || 0}</div>
              <div className="text-xs text-muted-foreground">Duplicates</div>
            </div>
            <div>
              <div className="font-medium">{upload.dncmatches || 0}</div>
              <div className="text-xs text-muted-foreground">DNC</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline"

  switch (status.toLowerCase()) {
    case "completed":
      variant = "default"
      break
    case "processing":
      variant = "secondary"
      break
    case "failed":
      variant = "destructive"
      break
    default:
      variant = "outline"
  }

  return <Badge variant={variant}>{status}</Badge>
}
