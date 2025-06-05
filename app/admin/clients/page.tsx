"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Building2, DollarSign, TrendingUp } from "lucide-react"

interface Client {
  id: string
  name: string
  email: string
  status: "Active" | "Inactive" | "Pending"
  totalPurchases: number
  totalSpent: number
  averageOrderValue: number
  joinDate: string
  lastPurchase: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      // Mock data for now
      const mockClients: Client[] = [
        {
          id: "1",
          name: "TechCorp Solutions",
          email: "purchasing@techcorp.com",
          status: "Active",
          totalPurchases: 45,
          totalSpent: 89000,
          averageOrderValue: 1978,
          joinDate: "2023-02-15",
          lastPurchase: "2024-01-10",
        },
        {
          id: "2",
          name: "Marketing Pro Inc",
          email: "leads@marketingpro.com",
          status: "Active",
          totalPurchases: 32,
          totalSpent: 67500,
          averageOrderValue: 2109,
          joinDate: "2023-04-22",
          lastPurchase: "2024-01-08",
        },
        {
          id: "3",
          name: "StartupHub",
          email: "growth@startuphub.com",
          status: "Pending",
          totalPurchases: 8,
          totalSpent: 12000,
          averageOrderValue: 1500,
          joinDate: "2023-12-01",
          lastPurchase: "2023-12-15",
        },
      ]
      setClients(mockClients)
    } catch (error) {
      console.error("Error fetching clients:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()),
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

  if (loading) {
    return <div className="p-6">Loading clients...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Client Management</h1>
          <p className="text-muted-foreground">Manage your clients and track their purchasing behavior</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">+3 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.filter((c) => c.status === "Active").length}</div>
            <p className="text-xs text-muted-foreground">67% of total clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${clients.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">+18% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.round(clients.reduce((sum, c) => sum + c.averageOrderValue, 0) / clients.length).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">+5.2% from last month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Directory</CardTitle>
          <CardDescription>View and manage all your clients</CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredClients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                    </div>
                    <Badge variant={getStatusBadgeColor(client.status)}>{client.status}</Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Purchases: </span>
                      <span className="font-medium">{client.totalPurchases}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Spent: </span>
                      <span className="font-medium">${client.totalSpent.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Avg Order Value: </span>
                      <span className="font-medium">${client.averageOrderValue.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Purchase: </span>
                      <span className="font-medium">{new Date(client.lastPurchase).toLocaleDateString()}</span>
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
    </div>
  )
}
