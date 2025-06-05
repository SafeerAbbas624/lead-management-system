"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { dncListsApi } from "@/lib/mock-api"
import { useToast } from "@/hooks/use-toast"

export function DncListManager() {
  const { toast } = useToast()
  const [dncLists, setDncLists] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingList, setEditingList] = useState<any | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    type: "internal",
    description: "",
    isActive: true,
  })

  useEffect(() => {
    fetchDncLists()
  }, [])

  const fetchDncLists = async () => {
    try {
      setLoading(true)
      const data = await dncListsApi.getDncLists()
      setDncLists(data)
    } catch (error) {
      console.error("Error fetching DNC lists:", error)
      toast({
        title: "Error",
        description: "Failed to load DNC lists",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (key: string, value: string | boolean) => {
    setFormData({
      ...formData,
      [key]: value,
    })
  }

  const handleEditList = (list: any) => {
    setEditingList(list)
    setFormData({
      name: list.name,
      type: list.type,
      description: list.description || "",
      isActive: list.isActive,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      if (editingList) {
        // Update existing list
        await dncListsApi.updateDncList(editingList.id, {
          ...formData,
          lastupdated: new Date().toISOString(),
        })

        toast({
          title: "DNC list updated",
          description: "The DNC list has been updated successfully",
        })
      } else {
        // Create new list
        await dncListsApi.createDncList({
          ...formData,
          createdat: new Date().toISOString(),
          lastupdated: new Date().toISOString(),
        })

        toast({
          title: "DNC list created",
          description: "The DNC list has been created successfully",
        })
      }

      // Reset form and close dialog
      setFormData({
        name: "",
        type: "internal",
        description: "",
        isActive: true,
      })
      setEditingList(null)
      setDialogOpen(false)

      // Refresh the list
      fetchDncLists()
    } catch (error) {
      console.error("Error saving DNC list:", error)
      toast({
        title: "Error",
        description: "Failed to save DNC list",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await dncListsApi.deleteDncList(id)
      
      toast({
        title: "DNC list deleted",
        description: "The DNC list has been deleted successfully",
      })

      // Refresh the list
      fetchDncLists()
    } catch (error) {
      console.error("Error deleting DNC list:", error)
      toast({
        title: "Error",
        description: "Failed to delete DNC list",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingList(null)
              setFormData({
                name: "",
                type: "internal",
                description: "",
                isActive: true,
              })
              setDialogOpen(true)
            }}>
              Add DNC List
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>
    </div>
  )
}
