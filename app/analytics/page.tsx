"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ComprehensiveDashboardStats } from "@/components/dashboard/comprehensive-dashboard-stats"
import { LeadVolumeChart } from "@/components/analytics/lead-volume-chart"
import { RevenueAnalysisChart } from "@/components/analytics/revenue-analysis-chart"
import { SupplierPerformanceChart } from "@/components/analytics/supplier-performance-chart"
import { ClientDistributionChart } from "@/components/analytics/client-distribution-chart"
import { QualityMetricsChart } from "@/components/analytics/quality-metrics-chart"
import { ConversionFunnelChart } from "@/components/analytics/conversion-funnel-chart"
import { CostAnalysisChart } from "@/components/analytics/cost-analysis-chart"
import { TrendAnalysisChart } from "@/components/analytics/trend-analysis-chart"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Stats Overview */}
          <ComprehensiveDashboardStats />
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
                <RevenueAnalysisChart />
              </CardContent>
            </Card>
          </div>

          {/* Supplier & Client Performance */}
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
                <CardTitle>Client Distribution</CardTitle>
                <CardDescription>Lead distribution and revenue by client</CardDescription>
              </CardHeader>
              <CardContent>
                <ClientDistributionChart />
              </CardContent>
            </Card>
          </div>

          {/* Quality & Conversion Metrics */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
                <CardDescription>Duplicates, DNC matches, and clean lead rates</CardDescription>
              </CardHeader>
              <CardContent>
                <QualityMetricsChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Lead progression through sales stages</CardDescription>
              </CardHeader>
              <CardContent>
                <ConversionFunnelChart />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Cost Analysis & Trends */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cost Analysis</CardTitle>
                <CardDescription>Cost per lead trends and efficiency metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <CostAnalysisChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trend Analysis</CardTitle>
                <CardDescription>Month-over-month growth and performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendAnalysisChart />
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Processing Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.3 min</div>
                <p className="text-xs text-muted-foreground">Per batch upload</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.5%</div>
                <p className="text-xs text-muted-foreground">Upload success rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87%</div>
                <p className="text-xs text-muted-foreground">Overall lead quality</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">245%</div>
                <p className="text-xs text-muted-foreground">Return on investment</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Generate and download detailed reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Report generation functionality coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
