"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Tag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  tags: string[]
  createdAt: string
}

interface TagOption {
  id: string
  name: string
  color: string
  description: string
}

export function LeadTagging() {
  const { toast } = useToast()
  const [leads, setLeads] = useState<Lead[]>([])
  const [tags, setTags] = useState<TagOption[]>([])
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [selectedTag, setSelectedTag] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeads()
    fetchTags()
  }, [])

  const fetchLeads = async () => {
    try {
      // Mock data for now
      const mockLeads: Lead[] = [
        {
          id: "1",
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          phone: "(555) 123-4567",
          company: "Acme Inc",
          tags: ["hot", "qualified"],
          createdAt: "2023-05-15T10:30:00Z",
        },
        {
          id: "2",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@example.com",
          phone: "(555) 987-6543",
          company: "XYZ Corp",
          tags: ["cold"],
          createdAt: "2023-05-16T14:45:00Z",
        },
        {
          id: "3",
          firstName: "Bob",
          lastName: "Johnson",
          email: "bob.johnson@example.com",
          phone: "(555) 555-5555",
          company: "123 Industries",
          tags: ["warm", "qualified"],
          createdAt: "2023-05-17T09:15:00Z",
        },
        {
          id: "4",
          firstName: "Alice",
          lastName: "Williams",
          email: "alice.williams@example.com",
          phone: "(555) 111-2222",
          company: "Tech Solutions",
          tags: [],
          createdAt: "2023-05-18T16:20:00Z",
        },
        {
          id: "5",
          firstName: "Charlie",
          lastName: "Brown",
          email: "charlie.brown@example.com",
          phone: "(555) 333-4444",
          company: "Brown Enterprises",
          tags: ["unqualified"],
          createdAt: "2023-05-19T11:10:00Z",
        },
      ]
      setLeads(mockLeads)
    } catch (error) {
      console.error("Error fetching leads:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      // Mock data for now
      const mockTags: TagOption[] = [
        { id: "1", name: "hot", color: "red", description: "Hot lead" },
        { id: "2", name: "warm", color: "orange", description: "Warm lead" },
        { id: "3", name: "cold", color: "blue", description: "Cold lead" },
        { id: "4", name: "qualified", color: "green", description: "Qualified lead" },
        { id: "5", name: "unqualified", color: "gray", description: "Unqualified lead" },
      ]
      setTags(mockTags)
    } catch (error) {
      console.error("Error fetching tags:", error)
    }
  }

  const filteredLeads = leads.filter(
    (lead) =>
      lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map((lead) => lead.id))
    } else {
      setSelectedLeads([])
    }
  }

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId])
    } else {
      setSelectedLeads(selectedLeads.filter((id) => id !== leadId))
    }
  }

  const handleApplyTag = async () => {
    if (!selectedTag || selectedLeads.length === 0) {
      toast({
        title: "Error",
        description: "Please select a tag and at least one lead",
        variant: "destructive",
      })
      return
    }

    try {
      // In a real application, you would call an API to apply the tag
      console.log(`Applying tag ${selectedTag} to leads:`, selectedLeads)

      // Update local state to reflect the change
      const updatedLeads = leads.map((lead) => {
        if (selectedLeads.includes(lead.id) && !lead.tags.includes(selectedTag)) {
          return {
            ...lead,
            tags: [...lead.tags, selectedTag],
          }
        }
        return lead
      })

      setLeads(updatedLeads)
      setSelectedLeads([])
      setSelectedTag("")

      toast({
        title: "Success",
        description: `Tag applied to ${selectedLeads.length} lead(s)`,
      })
    } catch (error) {
      console.error("Error applying tag:", error)
      toast({
        title: "Error",
        description: "Failed to apply tag",
        variant: "destructive",
      })
    }
  }

  const getTagBadge = (tagName: string) => {
    const tag = tags.find((t) => t.name === tagName)
    if (!tag) return null

    const getTagColor = (color: string) => {
      switch (color) {
        case "red":
          return "bg-red-100 text-red-800 border-red-200"
        case "orange":
          return "bg-orange-100 text-orange-800 border-orange-200"
        case "blue":
          return "bg-blue-100 text-blue-800 border-blue-200"
        case "green":
          return "bg-green-100 text-green-800 border-green-200"
        case "gray":
          return "bg-gray-100 text-gray-800 border-gray-200"
        default:
          return "bg-gray-100 text-gray-800 border-gray-200"
      }
    }

    return (
      <Badge key={tag.id} variant="outline" className={getTagColor(tag.color)}>
        {tag.name}
      </Badge>
    )
  }

  if (loading) {
    return <div className="p-6">Loading leads...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lead Tagging</h2>
          <p className="text-muted-foreground">Apply tags to leads for better organization and filtering</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Apply Tags</CardTitle>
          <CardDescription>Select leads and apply tags to categorize them</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end space-x-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="tag">Select Tag</Label>
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger id="tag">
                    <SelectValue placeholder="Select a tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.name}>
                        <div className="flex items-center">
                          <span>{tag.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">({tag.description})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleApplyTag} disabled={!selectedTag || selectedLeads.length === 0}>
                <Tag className="mr-2 h-4 w-4" />
                Apply Tag to Selected ({selectedLeads.length})
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={(checked) => handleSelectLead(lead.id, !!checked)}
                          aria-label={`Select ${lead.firstName} ${lead.lastName}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {lead.firstName} {lead.lastName}
                        </div>
                      </TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.company}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {lead.tags.length > 0 ? (
                            lead.tags.map((tag) => getTagBadge(tag))
                          ) : (
                            <span className="text-muted-foreground text-sm">No tags</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
