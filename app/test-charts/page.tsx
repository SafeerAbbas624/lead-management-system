"use client"

import { LeadTrendsChart } from "@/components/dashboard/lead-trends-chart"
import { SourcePerformanceChart } from "@/components/dashboard/source-performance-chart"
import { SupplierROIChart } from "@/components/dashboard/supplier-roi-chart"
import { SupplierROIChartJS } from "@/components/dashboard/supplier-roi-chart-chartjs"

export default function TestChartsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Test Charts Page</h1>
      <p className="text-muted-foreground">Testing the three dashboard components that were showing errors</p>
      
      <div className="space-y-6">
        <LeadTrendsChart />
        
        <div className="grid gap-6 md:grid-cols-2">
          <SourcePerformanceChart />
          <SupplierROIChart />
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Chart.js Version (Should Fix Negative Values)</h2>
          <SupplierROIChartJS />
        </div>
      </div>
    </div>
  )
}
