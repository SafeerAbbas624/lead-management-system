"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, TrendingUp, Loader2 } from "lucide-react"
import { SupplierDialog } from "@/components/supplier/supplier-dialog"
import { useToast } from "@/hooks/use-toast"
import { RoleGuard } from "@/components/auth/role-guard"

interface Supplier {
  id: number
  name: string
  email: string
  contactperson: string | null
  status: "Active" | "Inactive"
  leadcost: number | null
  apikey: string
  createdat: string
  total_leads?: number
  acceptance_rate?: number
  revenue?: number
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/suppliers')
      
      if (!response.ok) {
        throw new Error('Failed to fetch suppliers')
      }
      
      const data = await response.json()
      setSuppliers(data)
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      toast({
        title: "Error",
        description: "Failed to load suppliers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleSupplierAdded = () => {
    fetchSuppliers()
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchSuppliers()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contactperson?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  )

  const activeSuppliers = filteredSuppliers.filter(s => s.status === 'Active')
  const inactiveSuppliers = filteredSuppliers.filter(s => s.status === 'Inactive')

  const renderSupplierCard = (supplier: Supplier) => (
    <Card key={supplier.id}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {supplier.name}
        </CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          <div className={`h-2 w-2 rounded-full ${
            supplier.status === "Active" ? "bg-green-500" : "bg-gray-400"
          }`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{supplier.total_leads || 0} leads</div>
        <p className="text-xs text-muted-foreground mt-1">
          {supplier.email}
        </p>
        {supplier.contactperson && (
          <p className="text-xs text-muted-foreground mt-1">
            Contact: {supplier.contactperson}
          </p>
        )}
        {supplier.lead_cost !== null && (
          <p className="text-xs text-muted-foreground mt-1">
            Lead Cost: ${supplier.lead_cost.toFixed(2)}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">
              {supplier.acceptance_rate || 0}% acceptance
            </span>
          </div>
          <div className="space-x-2">
            <SupplierDialog 
              initialData={supplier}
              onSuccess={handleSupplierAdded}
            >
              <Button variant="ghost" size="sm">Edit</Button>
            </SupplierDialog>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(supplier.api_key)
                toast({
                  title: "API Key Copied",
                  description: "The API key has been copied to your clipboard.",
                })
              }}
            >
              Copy API Key
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderLoadingState = () => (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )

  const renderEmptyState = (message: string) => (
    <div className="text-center py-12">
      <p className="text-muted-foreground">{message}</p>
    </div>
  )

  return (
    <RoleGuard requiredPermission="canManageSuppliers">
      <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your lead suppliers and their performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search suppliers..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1 sm:flex-none"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : 'Refresh'}
            </Button>
            <SupplierDialog onSuccess={handleSupplierAdded}>
              <Button className="flex-1 sm:flex-none">
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            </SupplierDialog>
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Suppliers</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {loading ? (
            renderLoadingState()
          ) : filteredSuppliers.length === 0 ? (
            renderEmptyState("No suppliers found")
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSuppliers.map(renderSupplierCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4 mt-4">
          {loading ? (
            renderLoadingState()
          ) : activeSuppliers.length === 0 ? (
            renderEmptyState("No active suppliers found")
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeSuppliers.map(renderSupplierCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="inactive" className="space-y-4 mt-4">
          {loading ? (
            renderLoadingState()
          ) : inactiveSuppliers.length === 0 ? (
            renderEmptyState("No inactive suppliers found")
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inactiveSuppliers.map(renderSupplierCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </RoleGuard>
  )
}
