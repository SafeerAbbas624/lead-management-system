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
import { format } from "date-fns"
import BatchDetailsModal from "./BatchDetailsModal"

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
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    const fetchUploads = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/upload-history")
        const json = await res.json()
        if (!json.success) throw new Error(json.error || "Failed to fetch upload history")
        // Map backend fields to frontend UploadBatch interface
        const data = (json.batches || []).map((b: any) => ({
          id: b.id,
          fileName: b.filename,
          fileType: b.filetype,
          status: b.status,
          totalLeads: b.totalleads,
          cleanedLeads: b.cleanedleads,
          duplicateLeads: b.duplicateleads,
          dncMatches: b.dncmatches,
          sourceName: b.sourcename,
          createdAt: b.createdat,
          completedAt: b.completedat,
        }))
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
      const res = await fetch(`/api/reprocess-batch/${id}`, { method: "POST" })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Failed to reprocess batch")
      alert("Reprocessing started!")
      // Optionally refresh list
      setLoading(true)
      const res2 = await fetch("/api/upload-history")
      const json2 = await res2.json()
      if (json2.success) {
        const data = (json2.batches || []).map((b: any) => ({
          id: b.id,
          fileName: b.filename,
          fileType: b.filetype,
          status: b.status,
          totalLeads: b.totalleads,
          cleanedLeads: b.cleanedleads,
          duplicateLeads: b.duplicateleads,
          dncMatches: b.dncmatches,
          sourceName: b.sourcename,
          createdAt: b.createdat,
          completedAt: b.completedat,
        }))
        const sortedData = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setUploads(sortedData)
      }
    } catch (e: any) {
      alert(e.message || "Failed to reprocess batch")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (id: number) => {
    try {
      const res = await fetch(`/api/download-batch/${id}`)
      if (!res.ok) throw new Error("Failed to download batch results")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `batch_${id}_leads.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e: any) {
      alert(e.message || "Failed to download results")
    }
  }

  const handleViewDetails = async (id: number) => {
    setDetailsLoading(true)
    setModalOpen(true)
    try {
      const res = await fetch(`/api/batch-details/${id}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Failed to fetch batch details")
      setSelectedBatch(json.batch)
    } catch (e: any) {
      setSelectedBatch({ error: e.message })
    } finally {
      setDetailsLoading(false)
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
    <>
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
                      <DropdownMenuItem onClick={() => handleDownload(upload.id)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Results
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleReprocess(upload.id)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reprocess File
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewDetails(upload.id)}>
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <BatchDetailsModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setSelectedBatch(null)
        }}
        batch={detailsLoading ? null : selectedBatch}
      />
    </>
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
