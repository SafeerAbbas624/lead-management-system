"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowUpIcon,
  ArrowDownIcon,
  DollarSign,
  Users,
  FileText,
  AlertCircle,
  TrendingUp,
  Activity,
} from "lucide-react"
import { supabase } from "@/lib/supabase-client"

interface DashboardStats {
  totalLeads: number
  totalUploads: number
  dncMatches: number
  conversionRate: number
  convertedLeads: number
  totalCost: number
  totalRevenue: number
  netProfit: number
  roi: number
  processingBatches: number
  failedBatches: number
  avgLeadCost: number
  avgRevenue: number
}

export function EnhancedDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get the current session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        const headers: HeadersInit = {
          "Content-Type": "application/json",
        }

        // Add auth token if available
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`
        }

        const response = await fetch("/api/dashboard/stats", {
          headers,
        })

        if (!response.ok) {
          console.error("API response not ok:", response.status, response.statusText)
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          console.error("Non-JSON response:", text)
          throw new Error("Response is not JSON")
        }

        const data = await response.json()
        setStats(data)
      } catch (err) {
        console.error("Error fetching dashboard stats:", err)
        setError(err instanceof Error ? err.message : "An error occurred")

        // Set demo data on error
        setStats({
          totalLeads: 1250,
          totalUploads: 45,
          dncMatches: 87,
          conversionRate: 12.5,
          convertedLeads: 156,
          totalCost: 5000,
          totalRevenue: 15000,
          netProfit: 10000,
          roi: 200,
          processingBatches: 2,
          failedBatches: 1,
          avgLeadCost: 4,
          avgRevenue: 96.15,
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
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const statCards = [
    {
      title: "Total Leads",
      value: stats.totalLeads.toLocaleString(),
      icon: Users,
      change: "+12.5%",
      trend: "up",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      change: "+23.1%",
      trend: "up",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Net Profit",
      value: `$${stats.netProfit.toLocaleString()}`,
      icon: TrendingUp,
      change: "+18.2%",
      trend: "up",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "ROI",
      value: `${stats.roi.toFixed(1)}%`,
      icon: Activity,
      change: "+5.4%",
      trend: "up",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      change: "-2.3%",
      trend: "down",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Total Uploads",
      value: stats.totalUploads.toLocaleString(),
      icon: FileText,
      change: "+8.7%",
      trend: "up",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "DNC Matches",
      value: stats.dncMatches.toLocaleString(),
      icon: AlertCircle,
      change: "-15.3%",
      trend: "down",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Processing",
      value: stats.processingBatches.toString(),
      icon: Activity,
      subtitle: `${stats.failedBatches} failed`,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ]

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">Using demo data. Backend connection error: {error}</p>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.change && (
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    {stat.trend === "up" ? (
                      <ArrowUpIcon className="h-3 w-3 text-green-600 mr-1" />
                    ) : (
                      <ArrowDownIcon className="h-3 w-3 text-red-600 mr-1" />
                    )}
                    <span className={stat.trend === "up" ? "text-green-600" : "text-red-600"}>{stat.change}</span>
                    <span className="ml-1">from last month</span>
                  </p>
                )}
                {stat.subtitle && <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
