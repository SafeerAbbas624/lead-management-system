"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Tag {
  id: string
  name: string
  color: string
  description: string
}

export function TagManagement() {
  const { toast } = useToast()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    color: "gray",
    description: "",
  })

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      // Mock data for now
      const mockTags: Tag[] = [
        { id: "1", name: "hot", color: "red", description: "Hot lead" },
        { id: "2", name: "warm", color: "orange", description: "Warm lead" },
        { id: "3", name: "cold", color: "blue", description: "Cold lead" },
        { id: "4", name: "qualified", color: "green", description: "Qualified lead" },
        { id: "5", name: "unqualified", color: "gray", description: "Unqualified lead" },
      ]
      setTags(mockTags)
    } catch (error) {
      console.error("Error fetching tags:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (key: string, value: string) => {
    setFormData({
      ...formData,
      [key]: value,
    })
  }

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      color: tag.color,
      description: tag.description,
    })
    setDialogOpen(true)
  }

  const handleAddTag = () => {
    setEditingTag(null)
    setFormData({
      name: "",
      color: "gray",
      description: "",
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      if (!formData.name) {
        toast({
          title: "Error",
          description: "Tag name is required",
          variant: "destructive",
        })
        return
      }

      if (editingTag) {
        // Update existing tag
        const updatedTags = tags.map((tag) => (tag.id === editingTag.id ? { ...tag, ...formData } : tag))
        setTags(updatedTags)

        toast({
          title: "Success",
          description: "Tag updated successfully",
        })
      } else {
        // Create new tag
        const newTag: Tag = {
          id: Date.now().toString(),
          ...formData,
        }
        setTags([...tags, newTag])

        toast({
          title: "Success",
          description: "Tag created successfully",
        })
      }

      setDialogOpen(false)
    } catch (error) {
      console.error("Error saving tag:", error)
      toast({
        title: "Error",
        description: "Failed to save tag",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTag = async (id: string) => {
    try {
      // In a real application, you would call an API to delete the tag
      const updatedTags = tags.filter((tag) => tag.id !== id)
      setTags(updatedTags)

      toast({
        title: "Success",
        description: "Tag deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting tag:", error)
      toast({
        title: "Error",
        description: "Failed to delete tag",
        variant: "destructive",
      })
    }
  }

  const getTagBadge = (color: string) => {
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

  if (loading) {
    return <div className="p-6">Loading tags...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tag Management</h2>
          <p className="text-muted-foreground">Create and manage tags for lead categorization</p>
        </div>
        <Button onClick={handleAddTag}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tag
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Tags</CardTitle>
          <CardDescription>View and manage all tags in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <Badge variant="outline" className={getTagBadge(tag.color)}>
                        {tag.name}
                      </Badge>
                    </TableCell>
                    <TableCell>{tag.description}</TableCell>
                    <TableCell>{tag.color}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditTag(tag)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteTag(tag.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? "Edit Tag" : "Create Tag"}</DialogTitle>
            <DialogDescription>
              {editingTag ? "Update the tag details below" : "Fill in the details to create a new tag"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tag Name</Label>
              <Input
                id="name"
                placeholder="Enter tag name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select value={formData.color} onValueChange={(value) => handleInputChange("color", value)}>
                <SelectTrigger id="color">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="gray">Gray</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter tag description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>{editingTag ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
