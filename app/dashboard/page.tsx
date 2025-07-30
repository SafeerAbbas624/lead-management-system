import { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ComprehensiveDashboardStats } from "@/components/dashboard/comprehensive-dashboard-stats"
import { TopSuppliers } from "@/components/dashboard/top-suppliers"
import { TopClients } from "@/components/dashboard/top-clients"
import { TopDuplicatesBySuppliers } from "@/components/dashboard/top-duplicates-by-suppliers"
import { TopDNCBySuppliers } from "@/components/dashboard/top-dnc-by-suppliers"
import { RecentUploads } from "@/components/dashboard/recent-uploads"
import { LeadsBySourceChartJS } from "@/components/dashboard/leads-by-source-chartjs"
import { LeadsByClientsChartJS } from "@/components/dashboard/leads-by-clients-chartjs"
import { LeadsByTagsChartJS } from "@/components/dashboard/leads-by-tags-chartjs"
import { LeadTrendsChartV2 } from "@/components/dashboard/lead-trends-chart-v2"
import { ConversionFunnelChart } from "@/components/analytics/conversion-funnel-chart"
import { SupplierROIChartJS } from "@/components/dashboard/supplier-roi-chart-chartjs"

import { Reports } from "@/components/dashboard/reports"
import { LeadVolumeChart } from "@/components/analytics/lead-volume-chart"
import { RevenueAnalysisChartJS } from "@/components/analytics/revenue-analysis-chart-chartjs"
import { SupplierPerformanceChart } from "@/components/analytics/supplier-performance-chart"
import { QualityMetricsChart } from "@/components/analytics/quality-metrics-chart"

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
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Comprehensive Stats - 12 boxes in 4 columns */}
          <ComprehensiveDashboardStats />

          {/* Top Lists - 2 boxes per line */}
          <div className="grid gap-6 md:grid-cols-2">
            <TopSuppliers />
            <TopClients />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <TopDuplicatesBySuppliers />
            <TopDNCBySuppliers />
          </div>

          {/* Charts - Leads by Source and Leads by Clients */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Leads by Source</CardTitle>
                <CardDescription>Distribution of leads by their source or supplier</CardDescription>
              </CardHeader>
              <CardContent>
                <LeadsBySourceChartJS />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leads by Clients</CardTitle>
                <CardDescription>Distribution of leads purchased by clients</CardDescription>
              </CardHeader>
              <CardContent>
                <LeadsByClientsChartJS />
              </CardContent>
            </Card>
          </div>

          {/* Recent Uploads and Leads by Tags */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Uploads</CardTitle>
                <CardDescription>Your most recent lead file uploads and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentUploads />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leads by Tags</CardTitle>
                <CardDescription>Distribution of leads by their assigned tags</CardDescription>
              </CardHeader>
              <CardContent>
                <LeadsByTagsChartJS />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Lead Volume & Revenue Analysis */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Lead Volume Trends</CardTitle>
                <CardDescription>Daily lead acquisition over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <LeadVolumeChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Analysis</CardTitle>
                <CardDescription>Cost vs Revenue trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueAnalysisChartJS />
              </CardContent>
            </Card>
          </div>

          {/* Supplier Performance & Quality Metrics */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Performance</CardTitle>
                <CardDescription>Lead quality and volume by supplier</CardDescription>
              </CardHeader>
              <CardContent>
                <SupplierPerformanceChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
                <CardDescription>Duplicates, DNC matches, and clean lead rates</CardDescription>
              </CardHeader>
              <CardContent>
                <QualityMetricsChart />
              </CardContent>
            </Card>
          </div>

          {/* Lead Trends Chart */}
          <LeadTrendsChartV2 />

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Lead progression through sales stages</CardDescription>
              </CardHeader>
              <CardContent>
                <ConversionFunnelChart />
              </CardContent>
            </Card>
            <SupplierROIChartJS />
          </div>
        </TabsContent>



        <TabsContent value="reports" className="space-y-6">
          <Reports />
        </TabsContent>
      </Tabs>
    </div>
  )
}
