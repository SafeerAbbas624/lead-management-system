"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, MoreHorizontal, RefreshCw } from "lucide-react"
import { uploadBatchesApi } from "@/lib/mock-api"
import { format } from "date-fns"

interface UploadBatch {
  id: number
  fileName: string
  fileType: string
  status: string
  totalLeads: number
  cleanedLeads: number
  duplicateLeads: number
  dncMatches: number
  sourceName: string
  createdAt: string
  completedAt: string | null
}

export function UploadHistory() {
  const [uploads, setUploads] = useState<UploadBatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUploads = async () => {
      try {
        const data = await uploadBatchesApi.getUploadBatches()
        // Sort by createdAt in descending order
        const sortedData = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setUploads(sortedData)
      } catch (error) {
        console.error("Error fetching uploads:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUploads()
  }, [])

  const handleReprocess = async (id: number) => {
    try {
      // Update status to reprocessing
      await uploadBatchesApi.updateUploadBatch(id, { status: "Reprocessing" })

      // Simulate reprocessing
      await uploadBatchesApi.processFile("mock-file-path", id)

      // Refresh the list
      const data = await uploadBatchesApi.getUploadBatches()
      const sortedData = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setUploads(sortedData)
    } catch (error) {
      console.error("Error reprocessing batch:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading upload history...</p>
      </div>
    )
  }

  if (uploads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border rounded-md">
        <p className="text-muted-foreground mb-4">No uploads found</p>
        <Button asChild>
          <a href="/uploads?tab=upload">Upload a File</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total Leads</TableHead>
            <TableHead>Clean Leads</TableHead>
            <TableHead>Duplicates</TableHead>
            <TableHead>DNC Matches</TableHead>
            <TableHead>Upload Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {uploads.map((upload) => (
            <TableRow key={upload.id}>
              <TableCell className="font-medium">{upload.fileName}</TableCell>
              <TableCell>{upload.sourceName || "Unknown"}</TableCell>
              <TableCell>
                <StatusBadge status={upload.status} />
              </TableCell>
              <TableCell>{upload.totalLeads}</TableCell>
              <TableCell>{upload.cleanedLeads}</TableCell>
              <TableCell>{upload.duplicateLeads}</TableCell>
              <TableCell>{upload.dncMatches}</TableCell>
              <TableCell>
                {upload.createdAt ? format(new Date(upload.createdAt), "MMM d, yyyy h:mm a") : "Unknown"}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Download Results
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleReprocess(upload.id)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reprocess File
                    </DropdownMenuItem>
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
    case "reprocessing":
    case "uploaded":
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
