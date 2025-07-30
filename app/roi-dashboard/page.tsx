"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { RoiMetricsCards } from "@/components/roi/roi-metrics-cards"
import { SupplierPerformance } from "@/components/roi/supplier-performance"
import { LeadConversionOverview } from "@/components/roi/lead-conversion-overview"
import { SoldVsBoughtLeads } from "@/components/roi/sold-vs-bought-leads"
import { SupplierDuplicateAnalysis } from "@/components/roi/supplier-duplicate-analysis"
import { DailyBusinessMetrics } from "@/components/roi/daily-business-metrics"

export default function RoiDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  })

  useEffect(() => {
    const fetchRoiData = async () => {
      try {
        setLoading(true)
        // Fetch real ROI metrics from the database
        const response = await fetch('/api/roi/metrics')
        if (response.ok) {
          const result = await response.json()
          // Extract the data from the API response structure
          if (result.success && result.data) {
            setMetrics(result.data)
          } else {
            console.error("API returned unsuccessful response:", result)
            setMetrics(null)
          }
        } else {
          console.error("Failed to fetch ROI metrics:", response.status, response.statusText)
          setMetrics(null)
        }
      } catch (error) {
        console.error("Error fetching ROI metrics:", error)
        setMetrics(null)
      } finally {
        setLoading(false)
      }
    }

    fetchRoiData()
  }, [dateRange])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">ROI Dashboard</h1>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range) => range && setDateRange(range)}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading ROI metrics...</p>
        </div>
      ) : (
        <>
          <RoiMetricsCards metrics={metrics} />

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="suppliers">Supplier Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Lead Conversion Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Lead Conversion Analysis</CardTitle>
                  <CardDescription>Comprehensive view of lead conversion rates and performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <LeadConversionOverview dateRange={dateRange} />
                </CardContent>
              </Card>

              {/* Sold vs Bought Leads */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Sold vs Bought Leads</CardTitle>
                    <CardDescription>Revenue and cost analysis over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SoldVsBoughtLeads dateRange={dateRange} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Supplier Duplicate Analysis</CardTitle>
                    <CardDescription>Quality metrics and duplicate rates by supplier</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SupplierDuplicateAnalysis dateRange={dateRange} />
                  </CardContent>
                </Card>
              </div>

              {/* Daily Business Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Business Metrics</CardTitle>
                  <CardDescription>Key performance indicators for daily operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <DailyBusinessMetrics dateRange={dateRange} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suppliers" className="space-y-6">
              <SupplierPerformance dateRange={dateRange} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
