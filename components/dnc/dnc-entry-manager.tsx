"use client"

import type React from "react"
import { useCallback, useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Search, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { useToast } from "@/hooks/use-toast"
import { format, isAfter } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DNCList {
  id: number
  name: string
  type: string
  description: string
  isactive: boolean
}

type EntryType = 'email' | 'phone' | 'domain'
type SourceType = 'Manual Entry' | 'Customer Request' | 'Federal Registry' | 'Compliance'

interface DNCEntry {
  id: number
  value: string
  valuetype: 'email' | 'phone' | 'domain'
  source: string
  reason: string
  dnclistid: number
  createdat: string
  expirydate: string | null
}

const ITEMS_PER_PAGE = 10

export function DncEntryManager() {
  const { toast } = useToast()
  const [dncLists, setDncLists] = useState<DNCList[]>([])
  const [entries, setEntries] = useState<DNCEntry[]>([])
  const [selectedList, setSelectedList] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null)
  
  const [formData, setFormData] = useState<{
    value: string
    valuetype: 'email' | 'phone' | 'domain'
    source: string
    reason: string
    dnclistid: number
    expirydate: string
    id?: number
  }>({
    value: '',
    valuetype: 'email',
    source: '',
    reason: '',
    dnclistid: 0,
    expirydate: '',
    id: undefined,
  })

  useEffect(() => {
    const fetchDncLists = async () => {
      try {
        const { data, error } = await supabase
          .from("dnc_lists")
          .select("id, name, type, description, isactive")
          .eq("isactive", true)

        if (error) throw error

        setDncLists(data || [])
        if (data && data.length > 0) {
          setSelectedList(data[0].id.toString())
        }
      } catch (error) {
        console.error("Error fetching DNC lists:", error)
      }
    }

    fetchDncLists()
  }, [])

  useEffect(() => {
    const fetchEntries = async () => {
      if (!selectedList) return

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("dnc_entries")
          .select("id, value, valuetype, source, reason, dnclistid, createdat, expirydate")
          .eq("dnclistid", Number.parseInt(selectedList))
          .order("createdat", { ascending: false })

        if (error) throw error

        setEntries(data || [])
      } catch (error) {
        console.error("Error fetching DNC entries:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEntries()
  }, [selectedList])

  const handleInputChange = (key: string, value: string) => {
    setFormData({
      ...formData,
      [key]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = `/api/dnc`
      const method = 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'entry',
          value: formData.value,
          value_type: formData.valuetype,
          source: formData.source,
          reason: formData.reason,
          dnclistid: formData.dnclistid,
          expirydate: formData.expirydate || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setEntries([data, ...entries])
        resetForm()
        toast({
          title: "Success",
          description: "DNC entry added successfully",
        })
      } else {
        throw new Error('Failed to add DNC entry')
      }
    } catch (error) {
      console.error("Error adding DNC entry:", error)
      toast({
        title: "Error",
        description: "Failed to add DNC entry",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (id: number) => {
    setEntryToDelete(id)
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!entryToDelete) return
    
    try {
      setIsDeleting(entryToDelete)
      const { error } = await supabase
        .from("dnc_entries")
        .delete()
        .eq("id", entryToDelete)

      if (error) throw error

      setEntries(entries.filter((entry) => entry.id !== entryToDelete))
      setIsDialogOpen(false)
      
      toast({
        title: "Success",
        description: "DNC entry deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting DNC entry:", error)
      toast({
        title: "Error",
        description: "Failed to delete DNC entry",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
      setEntryToDelete(null)
    }
  }

  const handleEdit = (entry: DNCEntry) => {
    setFormData({
      value: entry.value,
      valuetype: entry.valuetype,
      source: entry.source,
      reason: entry.reason,
      dnclistid: entry.dnclistid,
      expirydate: entry.expirydate || '',
      id: entry.id,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setFormData({
      value: '',
      valuetype: 'email',
      source: '',
      reason: '',
      dnclistid: 0,
      expirydate: '',
      id: undefined,
    })
  }

  const handleCancelEdit = () => {
    resetForm()
  }

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => 
      entry.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reason.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [entries, searchTerm])

  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-2 flex-1">
            <Label htmlFor="dncList">DNC List</Label>
            <div className="flex gap-2">
              <Select 
                value={selectedList} 
                onValueChange={(value) => {
                  setSelectedList(value)
                  setCurrentPage(1)
                  setSearchTerm("")
                }}
              >
                <SelectTrigger className="min-w-[200px]">
                  <SelectValue placeholder="Select DNC list" />
                </SelectTrigger>
                <SelectContent>
                  {dncLists.map((list) => (
                    <SelectItem key={list.id} value={list.id.toString()}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {formData.id && formData.id > 0 && (
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
              >
                Cancel Edit
              </Button>
            )}
            <Button
              onClick={() => {
                resetForm()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              variant="outline"
            >
              Add New Entry
            </Button>
          </div>
        </div>

        <div className="rounded-lg border p-6 bg-card">
          <h3 className="text-lg font-medium mb-4">
            {formData.id && formData.id > 0 ? 'Edit Entry' : 'Add New Entry'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Value <span className="text-destructive">*</span></Label>
                <Input
                  id="value"
                  placeholder={
                    formData.valuetype === 'email' ? 'email@example.com' :
                    formData.valuetype === 'phone' ? '+1234567890' :
                    'example.com'
                  }
                  value={formData.value}
                  onChange={(e) => handleInputChange("value", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valuetype">Type <span className="text-destructive">*</span></Label>
                <Select 
                  value={formData.valuetype} 
                  onValueChange={(value) => handleInputChange("valuetype", value as EntryType)}
                >
                  <SelectTrigger id="valuetype">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="domain">Domain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select 
                  value={formData.source} 
                  onValueChange={(value) => handleInputChange("source", value as SourceType)}
                >
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manual Entry">Manual Entry</SelectItem>
                    <SelectItem value="Customer Request">Customer Request</SelectItem>
                    <SelectItem value="Federal Registry">Federal Registry</SelectItem>
                    <SelectItem value="Compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expirydate">Expiry Date</Label>
                <Input
                  id="expirydate"
                  type="date"
                  value={formData.expirydate}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => handleInputChange("expirydate", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="Reason for adding to DNC"
                value={formData.reason}
                onChange={(e) => handleInputChange("reason", e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {formData.id && formData.id > 0 ? 'Updating...' : 'Adding...'}
                  </>
                ) : formData.id && formData.id > 0 ? 'Update Entry' : 'Add Entry'}
              </Button>
            </div>
          </form>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Value</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No entries found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEntries.map((entry) => (
                  <TableRow key={entry.id} className={entry.expirydate && isAfter(new Date(), new Date(entry.expirydate)) ? 'opacity-50 bg-muted/50' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {entry.value}
                        {entry.expirydate && isAfter(new Date(), new Date(entry.expirydate)) && (
                          <Badge variant="outline" className="text-xs">Expired</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{entry.valuetype}</TableCell>
                    <TableCell>{entry.source}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={entry.reason || '-'}>
                      {entry.reason || '-'}
                    </TableCell>
                    <TableCell>{format(new Date(entry.createdat), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      {entry.expirydate ? format(new Date(entry.expirydate), 'MMM d, yyyy') : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(entry)}
                          className="text-primary hover:text-primary"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(entry.id)}
                          disabled={isDeleting === entry.id}
                          className="text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          {isDeleting === entry.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {filteredEntries.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredEntries.length)}
                </span>{' '}
                of <span className="font-medium">{filteredEntries.length}</span> entries
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="px-2 text-sm">
                  Page {currentPage} of {Math.ceil(filteredEntries.length / ITEMS_PER_PAGE)}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(filteredEntries.length / ITEMS_PER_PAGE)))}
                  disabled={currentPage * ITEMS_PER_PAGE >= filteredEntries.length}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.ceil(filteredEntries.length / ITEMS_PER_PAGE))}
                  disabled={currentPage * ITEMS_PER_PAGE >= filteredEntries.length}
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete the DNC entry.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={!!isDeleting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={!!isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
