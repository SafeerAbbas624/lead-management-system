"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { supabase } from "@/lib/supabase/client"

interface TrendData {
  date: string
  totalLeads: number
  convertedLeads: number
  dncLeads: number
  totalCost: number
  totalRevenue: number
}

export function LeadTrendsChart() {
  const [data, setData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("daily")
  const [viewMode, setViewMode] = useState("leads")

  useEffect(() => {
    const fetchTrends = async () => {
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

        const response = await fetch(`/api/dashboard/lead-trends?period=${period}`, {
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

        const result = await response.json()
        setData(result.data?.trends || [])
      } catch (error) {
        console.error("Error fetching lead trends:", error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchTrends()
  }, [period])

  const getChartData = () => {
    switch (viewMode) {
      case "revenue":
        return data.map((item) => ({
          date: item.date,
          Revenue: item.totalRevenue,
          Cost: item.totalCost,
          Profit: item.totalRevenue - item.totalCost,
        }))
      case "conversion":
        return data.map((item) => ({
          date: item.date,
          "Conversion Rate": item.totalLeads > 0 ? parseFloat(((item.convertedLeads / item.totalLeads) * 100).toFixed(2)) : 0,
          "DNC Rate": item.totalLeads > 0 ? parseFloat(((item.dncLeads / item.totalLeads) * 100).toFixed(2)) : 0,
        }))
      default:
        return data.map((item) => ({
          date: item.date,
          "Total Leads": item.totalLeads,
          Converted: item.convertedLeads,
          DNC: item.dncLeads,
        }))
    }
  }

  const chartData = getChartData()

  // Debug logging
  console.log("Chart component state:", {
    dataLength: data.length,
    chartDataLength: chartData.length,
    period,
    viewMode,
    sampleData: data.slice(0, 2),
    sampleChartData: chartData.slice(0, 2)
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Lead Trends</CardTitle>
            <CardDescription>Track lead performance over time</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leads">Leads</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="conversion">Conversion</SelectItem>
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading trends...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground">No data available</p>
          </div>
        ) : (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
                <Legend />

                {viewMode === "leads" && (
                  <>
                    <Bar
                      dataKey="Total Leads"
                      fill="#3b82f6"
                      name="Total Leads"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="Converted"
                      fill="#10b981"
                      name="Converted"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="DNC"
                      fill="#ef4444"
                      name="DNC"
                      radius={[2, 2, 0, 0]}
                    />
                  </>
                )}

                {viewMode === "revenue" && (
                  <>
                    <Bar
                      dataKey="Revenue"
                      fill="#10b981"
                      name="Revenue"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="Cost"
                      fill="#ef4444"
                      name="Cost"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="Profit"
                      fill="#3b82f6"
                      name="Profit"
                      radius={[2, 2, 0, 0]}
                    />
                  </>
                )}

                {viewMode === "conversion" && (
                  <>
                    <Bar
                      dataKey="Conversion Rate"
                      fill="#10b981"
                      name="Conversion Rate (%)"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="DNC Rate"
                      fill="#ef4444"
                      name="DNC Rate (%)"
                      radius={[2, 2, 0, 0]}
                    />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
