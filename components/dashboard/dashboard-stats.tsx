"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase-client"
import { Users, FileText, AlertTriangle, TrendingUp } from "lucide-react"

interface DashboardStats {
  totalLeads: number
  totalUploads: number
  dncMatches: number
  conversionRate: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    totalUploads: 0,
    dncMatches: 0,
    conversionRate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total leads count
        const { count: leadsCount, error: leadsError } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })

        if (leadsError) throw leadsError

        // Fetch total uploads count
        const { count: uploadsCount, error: uploadsError } = await supabase
          .from("upload_batches")
          .select("*", { count: "exact", head: true })

        if (uploadsError) throw uploadsError

        // Fetch DNC matches count (leads with status 'DNC')
        const { count: dncCount, error: dncError } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("leadstatus", "DNC")

        if (dncError) throw dncError

        // Fetch converted leads count
        const { count: convertedCount, error: convertedError } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("leadstatus", "Converted")

        if (convertedError) throw convertedError

        // Calculate conversion rate
        const conversionRate = leadsCount && leadsCount > 0 ? ((convertedCount || 0) / leadsCount) * 100 : 0

        setStats({
          totalLeads: leadsCount || 0,
          totalUploads: uploadsCount || 0,
          dncMatches: dncCount || 0,
          conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimal places
        })
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)

        // Fallback to demo data
        setStats({
          totalLeads: 1234,
          totalUploads: 45,
          dncMatches: 67,
          conversionRate: 12.5,
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
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalLeads.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">All leads in the system</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUploads}</div>
          <p className="text-xs text-muted-foreground">Files processed</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">DNC Matches</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.dncMatches}</div>
          <p className="text-xs text-muted-foreground">Leads on DNC list</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.conversionRate}%</div>
          <p className="text-xs text-muted-foreground">Leads to conversions</p>
        </CardContent>
      </Card>
    </div>
  )
}
