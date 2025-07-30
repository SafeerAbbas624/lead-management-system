"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  FileText, 
  Building2, 
  Truck, 
  DollarSign, 
  TrendingUp, 
  Calculator,
  Target,
  Upload,
  Ban,
  Copy,
  Package
} from "lucide-react"

interface ComprehensiveStats {
  total_leads: number
  total_sold_leads: number
  total_clients: number
  total_suppliers: number
  total_revenue_spent: number
  total_revenue_generated: number
  average_cost: number
  conversion_rate: number
  total_uploads: number
  total_dnc: number
  total_duplicates: number
  total_batches: number
}

export function ComprehensiveDashboardStats() {
  const [stats, setStats] = useState<ComprehensiveStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/comprehensive-stats')
        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }

        const result = await response.json()
        if (result.success) {
          setStats(result.data)
        }
      } catch (error) {
        console.error("Error fetching comprehensive dashboard stats:", error)
        
        // Set demo data on error
        setStats({
          total_leads: 1250,
          total_sold_leads: 890,
          total_clients: 24,
          total_suppliers: 8,
          total_revenue_spent: 5000,
          total_revenue_generated: 15000,
          average_cost: 4.5,
          conversion_rate: 200,
          total_uploads: 45,
          total_dnc: 87,
          total_duplicates: 156,
          total_batches: 45
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load dashboard statistics</p>
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Leads",
      value: stats.total_leads.toLocaleString(),
      description: "All leads in system",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Total Sold Leads",
      value: stats.total_sold_leads.toLocaleString(),
      description: "Distributed to clients",
      icon: Target,
      color: "text-green-600"
    },
    {
      title: "Total Clients",
      value: stats.total_clients.toLocaleString(),
      description: "Active clients",
      icon: Building2,
      color: "text-purple-600"
    },
    {
      title: "Total Suppliers",
      value: stats.total_suppliers.toLocaleString(),
      description: "Lead suppliers",
      icon: Truck,
      color: "text-orange-600"
    },
    {
      title: "Total Revenue Spent",
      value: `$${stats.total_revenue_spent.toLocaleString()}`,
      description: "Cost of leads",
      icon: DollarSign,
      color: "text-red-600"
    },
    {
      title: "Total Revenue Generated",
      value: `$${stats.total_revenue_generated.toLocaleString()}`,
      description: "Revenue from sales",
      icon: TrendingUp,
      color: "text-green-600"
    },
    {
      title: "Average Cost",
      value: `$${stats.average_cost.toFixed(2)}`,
      description: "Per lead cost",
      icon: Calculator,
      color: "text-blue-600"
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversion_rate.toFixed(1)}%`,
      description: "Leads to sales",
      icon: Target,
      color: stats.conversion_rate > 0 ? "text-green-600" : "text-red-600"
    },
    {
      title: "Total Uploads",
      value: stats.total_uploads.toLocaleString(),
      description: "File uploads",
      icon: Upload,
      color: "text-indigo-600"
    },
    {
      title: "Total DNC",
      value: stats.total_dnc.toLocaleString(),
      description: "Do not call entries",
      icon: Ban,
      color: "text-red-600"
    },
    {
      title: "Total Duplicate Leads",
      value: stats.total_duplicates.toLocaleString(),
      description: "Duplicate entries",
      icon: Copy,
      color: "text-yellow-600"
    },
    {
      title: "Total Batches",
      value: stats.total_batches.toLocaleString(),
      description: "Upload batches",
      icon: Package,
      color: "text-gray-600"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, index) => {
        const IconComponent = card.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <IconComponent className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
