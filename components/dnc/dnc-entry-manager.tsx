"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface DNCList {
  id: number
  name: string
  type: string
  description: string
  isactive: boolean
}

interface DNCEntry {
  id: number
  value: string
  valuetype: string
  source: string
  reason: string
  dnclistid: number
  createdat: string
  expirydate: string
}

export function DncEntryManager() {
  const { toast } = useToast()
  const [dncLists, setDncLists] = useState<DNCList[]>([])
  const [entries, setEntries] = useState<DNCEntry[]>([])
  const [selectedList, setSelectedList] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    value: "",
    valuetype: "email",
    source: "Manual Entry",
    reason: "",
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

    if (!formData.value || !selectedList) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const { data, error } = await supabase
        .from("dnc_entries")
        .insert({
          value: formData.value,
          valuetype: formData.valuetype,
          source: formData.source,
          reason: formData.reason,
          dnclistid: Number.parseInt(selectedList),
          createdat: new Date().toISOString(),
        })
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setEntries([data[0], ...entries])
        setFormData({
          ...formData,
          value: "",
          reason: "",
        })

        toast({
          title: "Entry added",
          description: "The DNC entry has been added successfully",
        })
      }
    } catch (error) {
      console.error("Error adding DNC entry:", error)
      toast({
        title: "Error",
        description: "Failed to add DNC entry",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from("dnc_entries").delete().eq("id", id)

      if (error) throw error

      setEntries(entries.filter((entry) => entry.id !== id))

      toast({
        title: "Entry deleted",
        description: "The DNC entry has been removed",
      })
    } catch (error) {
      console.error("Error deleting DNC entry:", error)
      toast({
        title: "Error",
        description: "Failed to delete DNC entry",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dncList">Select DNC List</Label>
          <Select value={selectedList} onValueChange={setSelectedList}>
            <SelectTrigger id="dncList">
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
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                placeholder="Email or phone number"
                value={formData.value}
                onChange={(e) => handleInputChange("value", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valuetype">Type</Label>
              <Select value={formData.valuetype} onValueChange={(value) => handleInputChange("valuetype", value)}>
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
              <Select value={formData.source} onValueChange={(value) => handleInputChange("source", value)}>
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
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="Reason for adding to DNC"
                value={formData.reason}
                onChange={(e) => handleInputChange("reason", e.target.value)}
              />
            </div>
          </div>

          <Button type="submit">Add Entry</Button>
        </form>
      </div>

      <div className="rounded-md border">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Loading entries...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">No entries found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Value</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.value}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {entry.valuetype.charAt(0).toUpperCase() + entry.valuetype.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{entry.source}</TableCell>
                  <TableCell>{entry.reason || "N/A"}</TableCell>
                  <TableCell>{format(new Date(entry.createdat), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
