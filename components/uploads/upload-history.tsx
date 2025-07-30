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
import { MoreHorizontal, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  totalBuyingPrice: number
  buyingPricePerLead: number
  createdAt: string
  completedAt: string | null
}

export function UploadHistory() {
  const [uploads, setUploads] = useState<UploadBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Calculate pagination
  const totalPages = Math.ceil(uploads.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUploads = uploads.slice(startIndex, endIndex)

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
          totalBuyingPrice: b.total_buying_price || 0,
          buyingPricePerLead: b.buying_price_per_lead || 0,
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

  // Unused - keeping for potential future use
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
          totalBuyingPrice: b.total_buying_price || 0,
          buyingPricePerLead: b.buying_price_per_lead || 0,
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

  // Unused - keeping for potential future use
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
      {/* Pagination Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => {
            setItemsPerPage(Number(value))
            setCurrentPage(1) // Reset to first page when changing items per page
          }}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">entries</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, uploads.length)} of {uploads.length} entries
          </span>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table with sticky header */}
      <div className="rounded-md border max-h-[600px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="bg-background">File Name</TableHead>
              <TableHead className="bg-background">Source</TableHead>
              <TableHead className="bg-background">Status</TableHead>
              <TableHead className="bg-background">Total Leads</TableHead>
              <TableHead className="bg-background">Clean Leads</TableHead>
              <TableHead className="bg-background">Duplicates</TableHead>
              <TableHead className="bg-background">DNC Matches</TableHead>
              <TableHead className="bg-background">Total Cost</TableHead>
              <TableHead className="bg-background">Cost/Lead</TableHead>
              <TableHead className="bg-background">Upload Date</TableHead>
              <TableHead className="text-right bg-background">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentUploads.map((upload) => (
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
                <TableCell className="text-green-600 font-medium">
                  ${upload.totalBuyingPrice?.toFixed(2) || '0.00'}
                </TableCell>
                <TableCell className="text-green-600 font-medium">
                  ${upload.buyingPricePerLead?.toFixed(2) || '0.00'}
                </TableCell>
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
                      <DropdownMenuItem onClick={() => handleViewDetails(upload.id)}>
                        <Eye className="mr-2 h-4 w-4" />
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
