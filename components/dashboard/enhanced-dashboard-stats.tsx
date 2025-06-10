"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  // Overview
  totalLeads: number
  totalUploads: number
  totalSuppliers: number
  activeClients: number
  
  // Lead Status
  newLeads: number
  contactedLeads: number
  qualifiedLeads: number
  convertedLeads: number
  closedLostLeads: number
  
  // Quality Metrics
  dncMatches: number
  duplicateLeads: number
  cleanLeads: number
  qualityScore: number
  
  // Financials
  totalRevenue: number
  totalCost: number
  netProfit: number
  roi: number
  avgLeadCost: number
  avgRevenuePerLead: number
  
  // Performance
  conversionRate: number
  processingBatches: number
  failedBatches: number
  successRate: number
  
  // Trends
  leadsThisMonth: number
  leadsLastMonth: number
  monthOverMonthGrowth: number
  revenueThisMonth: number
  revenueLastMonth: number
  revenueGrowth: number
  
  // Additional calculated fields
  [key: string]: number | string | undefined
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
          // Overview
          totalLeads: 1250,
          totalUploads: 45,
          totalSuppliers: 8,
          activeClients: 24,
          
          // Lead Status
          newLeads: 350,
          contactedLeads: 275,
          qualifiedLeads: 180,
          convertedLeads: 156,
          closedLostLeads: 289,
          
          // Quality Metrics
          dncMatches: 87,
          duplicateLeads: 45,
          cleanLeads: 1118,
          qualityScore: 89,
          
          // Financials
          totalRevenue: 15000,
          totalCost: 5000,
          netProfit: 10000,
          roi: 200,
          avgLeadCost: 4,
          avgRevenuePerLead: 12,
          
          // Performance
          conversionRate: 12.5,
          processingBatches: 2,
          failedBatches: 1,
          successRate: 95,
          
          // Trends
          leadsThisMonth: 350,
          leadsLastMonth: 320,
          monthOverMonthGrowth: 9.4,
          revenueThisMonth: 15000,
          revenueLastMonth: 13500,
          revenueGrowth: 11.1
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

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Dashboard Stats</CardTitle>
          <CardDescription>Error loading dashboard stats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Failed to load dashboard stats. Please try again later.</div>
        </CardContent>
      </Card>
    );
  }

  // Use default values if stats is undefined
  const safeStats = stats || {
    totalLeads: 0,
    totalUploads: 0,
    dncMatches: 0,
    conversionRate: 0,
    totalRevenue: 0,
    totalCost: 0,
    netProfit: 0,
    roi: 0,
    activeClients: 0,
    totalSuppliers: 0,
    leadsThisMonth: 0,
    leadsLastMonth: 0,
    monthOverMonthGrowth: 0,
    revenueThisMonth: 0,
    revenueLastMonth: 0,
    revenueGrowth: 0,
    processingBatches: 0,
    failedBatches: 0,
    successRate: 0,
    duplicateLeads: 0,
    cleanLeads: 0,
    qualityScore: 0,
    avgLeadCost: 0,
    avgRevenuePerLead: 0,
    newLeads: 0,
    contactedLeads: 0,
    qualifiedLeads: 0,
    convertedLeads: 0,
    closedLostLeads: 0
  };

  const statCards = [
    {
      title: "Total Leads",
      value: stats?.totalLeads?.toLocaleString() || '0',
      icon: Users,
      change: stats?.monthOverMonthGrowth ? 
        (stats.monthOverMonthGrowth > 0 ? `+${stats.monthOverMonthGrowth}%` : `${stats.monthOverMonthGrowth}%`) : '0%',
      trend: stats?.monthOverMonthGrowth !== undefined && stats.monthOverMonthGrowth >= 0 ? "up" : "down",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Uploads",
      value: stats?.totalUploads?.toLocaleString() || '0',
      icon: FileText,
      change: stats?.successRate ? 
        (stats.successRate > 0 ? `+${stats.successRate}%` : `${stats.successRate}%`) : '0%',
      trend: stats?.successRate !== undefined && stats.successRate >= 0 ? "up" : "down",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "DNC Matches",
      value: stats?.dncMatches?.toLocaleString() || '0',
      icon: AlertCircle,
      change: stats?.dncMatches ? 
        (stats.dncMatches > 0 ? `+${stats.dncMatches}` : `${stats.dncMatches}`) : '0',
      trend: stats?.dncMatches ? (stats.dncMatches > 0 ? "up" : "down") : "neutral",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Conversion Rate",
      value: stats?.conversionRate ? `${stats.conversionRate.toFixed(1)}%` : '0%',
      icon: TrendingUp,
      change: stats?.conversionRate ? 
        (stats.conversionRate > 0 ? `+${stats.conversionRate.toFixed(1)}%` : `${stats.conversionRate.toFixed(1)}%`) : '0%',
      trend: stats?.conversionRate !== undefined && stats.conversionRate >= 0 ? "up" : "down",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Revenue",
      value: `$${stats?.totalRevenue?.toLocaleString() || '0'}`,
      icon: DollarSign,
      change: stats?.revenueGrowth ? 
        (stats.revenueGrowth > 0 ? `+${stats.revenueGrowth}%` : `${stats.revenueGrowth}%`) : '0%',
      trend: stats?.revenueGrowth !== undefined && stats.revenueGrowth >= 0 ? "up" : "down",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Active Clients",
      value: stats?.activeClients?.toLocaleString() || '0',
      icon: Users,
      change: stats?.activeClients ? 
        (stats.activeClients > 0 ? `+${stats.activeClients}` : `${stats.activeClients}`) : '0',
      trend: stats?.activeClients ? (stats.activeClients > 0 ? "up" : "down") : "neutral",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Processing",
      value: stats?.processingBatches?.toString() || '0',
      icon: Activity,
      subtitle: `${stats?.failedBatches || 0} failed`,
      change: stats?.processingBatches ? 
        (stats.processingBatches > 0 ? `+${stats.processingBatches}` : `${stats.processingBatches}`) : '0',
      trend: stats?.processingBatches ? (stats.processingBatches > 0 ? "up" : "down") : "neutral",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    }
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
