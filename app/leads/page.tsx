"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Filter, MoreHorizontal, Plus, Search } from "lucide-react"
import { supabase } from "@/lib/supabase-client"

interface Lead {
  id: number
  firstname: string
  lastname: string
  email: string
  phone: string
  companyname: string
  leadstatus: string
  leadsource: string
  createdat: string
  exclusivity: boolean
  tags: string[]
  leadcost: number
  leadscore: number
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true)
        let query = supabase
          .from("leads")
          .select(
            "id, firstname, lastname, email, phone, companyname, leadstatus, leadsource, createdat, exclusivity, tags, leadcost, leadscore",
          )
          .order("createdat", { ascending: false })
          .limit(100)

        if (searchQuery) {
          query = query.or(
            `firstname.ilike.%${searchQuery}%,lastname.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,companyname.ilike.%${searchQuery}%`,
          )
        }

        const { data, error } = await query

        if (error) {
          console.error("Database error:", error.message)
          throw error
        }

        setLeads(data || [])
      } catch (error) {
        console.error("Error fetching leads:", error)

        // Fallback to demo data
        setLeads([
          {
            id: 1,
            firstname: "John",
            lastname: "Doe",
            email: "john.doe@example.com",
            phone: "(555) 123-4567",
            companyname: "Acme Inc",
            leadstatus: "New",
            leadsource: "Website",
            createdat: new Date().toISOString(),
            exclusivity: false,
            tags: ["hot"],
            leadcost: 25.5,
            leadscore: 85,
          },
          {
            id: 2,
            firstname: "Jane",
            lastname: "Smith",
            email: "jane.smith@example.com",
            phone: "(555) 987-6543",
            companyname: "XYZ Corp",
            leadstatus: "Qualified",
            leadsource: "Referral",
            createdat: new Date().toISOString(),
            exclusivity: true,
            tags: ["qualified", "warm"],
            leadcost: 30.0,
            leadscore: 92,
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [searchQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead Management</CardTitle>
          <CardDescription>View, search, and manage all leads in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center space-x-2">
              <Input
                type="search"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-muted-foreground">Loading leads...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 border rounded-md">
              <p className="text-muted-foreground mb-4">No leads found</p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Exclusivity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {lead.firstname} {lead.lastname}
                      </TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell>{lead.companyname}</TableCell>
                      <TableCell>
                        <LeadStatusBadge status={lead.leadstatus} />
                      </TableCell>
                      <TableCell>{lead.leadsource}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          {lead.leadscore || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>${lead.leadcost?.toFixed(2) || "0.00"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {lead.tags && lead.tags.length > 0 ? (
                            lead.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">No tags</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.exclusivity ? (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                            Exclusive
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                            Standard
                          </Badge>
                        )}
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
                            <DropdownMenuItem>View details</DropdownMenuItem>
                            <DropdownMenuItem>Edit lead</DropdownMenuItem>
                            <DropdownMenuItem>Change status</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">Delete lead</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function LeadStatusBadge({ status }: { status: string }) {
  let className = "bg-gray-100 text-gray-800 border-gray-200"

  switch (status?.toLowerCase()) {
    case "new":
      className = "bg-blue-100 text-blue-800 border-blue-200"
      break
    case "qualified":
      className = "bg-green-100 text-green-800 border-green-200"
      break
    case "contacted":
      className = "bg-purple-100 text-purple-800 border-purple-200"
      break
    case "converted":
      className = "bg-green-100 text-green-800 border-green-200"
      break
    case "dnc":
      className = "bg-red-100 text-red-800 border-red-200"
      break
    default:
      className = "bg-gray-100 text-gray-800 border-gray-200"
  }

  return (
    <Badge variant="outline" className={className}>
      {status || "Unknown"}
    </Badge>
  )
}
