import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnhancedDashboardStats } from "@/components/dashboard/enhanced-dashboard-stats"
import { RecentUploads } from "@/components/dashboard/recent-uploads"
import { LeadsBySource } from "@/components/dashboard/leads-by-source"
import { LeadsByStatus } from "@/components/dashboard/leads-by-status"
import { LeadTrendsChart } from "@/components/dashboard/lead-trends-chart"
import { SourcePerformanceChart } from "@/components/dashboard/source-performance-chart"
import { SupplierROIChart } from "@/components/dashboard/supplier-roi-chart"
import { ConversionFunnel } from "@/components/dashboard/conversion-funnel"
import { LeadQualityMetrics } from "@/components/dashboard/lead-quality-metrics"
import { Reports } from "@/components/dashboard/reports"

export const metadata: Metadata = {
  title: "Dashboard | Lead Management System",
  description: "Dashboard overview of lead management system",
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <EnhancedDashboardStats />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Uploads</CardTitle>
                <CardDescription>Your most recent lead file uploads and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentUploads />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Leads by Status</CardTitle>
                <CardDescription>Distribution of leads by their current status</CardDescription>
              </CardHeader>
              <CardContent>
                <LeadsByStatus />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Leads by Source</CardTitle>
              <CardDescription>Distribution of leads by their source or supplier</CardDescription>
            </CardHeader>
            <CardContent>
              <LeadsBySource />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <LeadTrendsChart />

          <div className="grid gap-6 md:grid-cols-2">
            <SourcePerformanceChart />
            <SupplierROIChart />
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ConversionFunnel />
            <LeadQualityMetrics />
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Reports />
        </TabsContent>
      </Tabs>
    </div>
  )
}
