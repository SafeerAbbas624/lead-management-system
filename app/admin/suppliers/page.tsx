"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, TrendingUp, Users, DollarSign } from "lucide-react"

interface Supplier {
  id: string
  name: string
  email: string
  status: "Active" | "Inactive" | "Pending"
  totalLeads: number
  acceptanceRate: number
  revenue: number
  tier: "Gold" | "Silver" | "Bronze"
  joinDate: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      // Mock data for now
      const mockSuppliers: Supplier[] = [
        {
          id: "1",
          name: "Premium Leads Co",
          email: "contact@premiumleads.com",
          status: "Active",
          totalLeads: 15420,
          acceptanceRate: 94.2,
          revenue: 125000,
          tier: "Gold",
          joinDate: "2023-01-15",
        },
        {
          id: "2",
          name: "Quality Data Inc",
          email: "sales@qualitydata.com",
          status: "Active",
          totalLeads: 8750,
          acceptanceRate: 87.5,
          revenue: 78000,
          tier: "Silver",
          joinDate: "2023-03-22",
        },
        {
          id: "3",
          name: "Fast Leads LLC",
          email: "info@fastleads.com",
          status: "Pending",
          totalLeads: 3200,
          acceptanceRate: 71.8,
          revenue: 28000,
          tier: "Bronze",
          joinDate: "2023-12-01",
        },
      ]
      setSuppliers(mockSuppliers)
    } catch (error) {
      console.error("Error fetching suppliers:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Active":
        return "default"
      case "Inactive":
        return "secondary"
      case "Pending":
        return "outline"
      default:
        return "outline"
    }
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case "Gold":
        return "destructive"
      case "Silver":
        return "default"
      case "Bronze":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (loading) {
    return <div className="p-6">Loading suppliers...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Supplier Management</h1>
          <p className="text-muted-foreground">Manage lead suppliers and track their performance</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.filter((s) => s.status === "Active").length}</div>
            <p className="text-xs text-muted-foreground">85% of total suppliers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${suppliers.reduce((sum, s) => sum + s.revenue, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Acceptance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(suppliers.reduce((sum, s) => sum + s.acceptanceRate, 0) / suppliers.length).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">+3.2% from last month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="suppliers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suppliers">All Suppliers</TabsTrigger>
          <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Directory</CardTitle>
              <CardDescription>View and manage all registered suppliers</CardDescription>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredSuppliers.map((supplier) => (
                  <div key={supplier.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          <p className="text-sm text-muted-foreground">{supplier.email}</p>
                        </div>
                        <Badge variant={getStatusBadgeColor(supplier.status)}>{supplier.status}</Badge>
                        <Badge variant={getTierBadgeColor(supplier.tier)}>{supplier.tier}</Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Leads: </span>
                          <span className="font-medium">{supplier.totalLeads.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Acceptance Rate: </span>
                          <span className="font-medium">{supplier.acceptanceRate}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Revenue: </span>
                          <span className="font-medium">${supplier.revenue.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analysis</CardTitle>
              <CardDescription>Detailed performance metrics for all suppliers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Performance analysis charts and detailed metrics will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
