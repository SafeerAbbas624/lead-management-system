"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Pencil, Trash2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

type DNCList = {
  id: number
  name: string
  type: 'internal' | 'external'
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
  entry_count?: number
}

type FormData = {
  name: string
  type: 'internal' | 'external'
  description: string
  is_active: boolean
}

export function DncListManager() {
  const router = useRouter()
  const { toast } = useToast()
  const [dncLists, setDncLists] = useState<DNCList[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingList, setEditingList] = useState<DNCList | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    type: "internal",
    description: "",
    is_active: true,
  })

  useEffect(() => {
    fetchDncLists()
  }, [])

  const fetchDncLists = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dnc?type=lists')
      
      if (!response.ok) {
        throw new Error('Failed to fetch DNC lists')
      }
      
      const { data } = await response.json()
      setDncLists(data || [])
    } catch (error) {
      console.error("Error fetching DNC lists:", error)
      toast({
        title: "Error",
        description: "Failed to load DNC lists. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (key: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleEditList = (list: DNCList) => {
    setEditingList(list)
    setFormData({
      name: list.name,
      type: list.type,
      description: list.description || "",
      is_active: list.is_active,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const url = editingList 
        ? `/api/dnc?type=list&id=${editingList.id}`
        : '/api/dnc'
      
      const method = editingList ? 'PUT' : 'POST'
      
      // Create payload without the type property to avoid conflict
      const { type, ...formDataWithoutType } = formData
      const payload = {
        ...formDataWithoutType,
        listType: type, // Use the extracted type as listType
        ...(editingList && { id: editingList.id })
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'list',
          ...payload,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save DNC list')
      }

      const data = await response.json()
      
      toast({
        title: editingList ? "List updated" : "List created",
        description: `DNC list has been ${editingList ? 'updated' : 'created'} successfully`,
      })

      // Reset form and close dialog
      setFormData({
        name: "",
        type: "internal",
        description: "",
        is_active: true,
      })
      setEditingList(null)
      setDialogOpen(false)

      // Refresh the list
      fetchDncLists()
    } catch (error) {
      console.error("Error saving DNC list:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save DNC list",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this DNC list? This action cannot be undone.')) {
      return
    }

    try {
      setIsDeleting(id)
      const response = await fetch(`/api/dnc?type=list&id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete DNC list')
      }
      
      toast({
        title: "List deleted",
        description: "The DNC list has been deleted successfully",
      })

      // Refresh the list
      fetchDncLists()
    } catch (error) {
      console.error("Error deleting DNC list:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete DNC list",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">DNC Lists</h2>
          <p className="text-muted-foreground">
            Manage your Do Not Contact lists
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingList(null)
                setFormData({
                  name: "",
                  type: "internal",
                  description: "",
                  is_active: true,
                })
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add DNC List
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingList ? 'Edit DNC List' : 'Create New DNC List'}
              </DialogTitle>
              <DialogDescription>
                {editingList 
                  ? 'Update the details of this DNC list.'
                  : 'Create a new DNC list to manage your do not contact entries.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">List Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Unsubscribed Users"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">List Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'internal' | 'external') => handleInputChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select list type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Internal: Managed within the system. External: Imported from external sources.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description for this list"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingList ? 'Updating...' : 'Creating...'}
                    </>
                  ) : editingList ? 'Update List' : 'Create List'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {dncLists.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium">No DNC lists found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Get started by creating a new DNC list.
          </p>
          <div className="mt-6">
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create List
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Entries</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dncLists.map((list) => (
                <TableRow key={list.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{list.name}</span>
                      {list.description && (
                        <span className="text-xs text-muted-foreground">
                          {list.description.length > 50 
                            ? `${list.description.substring(0, 50)}...` 
                            : list.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={list.type === 'internal' ? 'default' : 'outline'}>
                      {list.type.charAt(0).toUpperCase() + list.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{list.entry_count || 0}</TableCell>
                  <TableCell>
                    <Badge variant={list.is_active ? 'default' : 'secondary'}>
                      {list.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {list.updated_at ? format(new Date(list.updated_at), 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditList(list)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(list.id)}
                        disabled={isDeleting === list.id}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        {isDeleting === list.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
