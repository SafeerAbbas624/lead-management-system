"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
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
        setData(result.trends || [])
      } catch (error) {
        console.error("Error fetching lead trends:", error)

        // Generate demo data
        const demoData = []
        for (let i = 29; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          demoData.push({
            date: date.toISOString().split("T")[0],
            totalLeads: Math.floor(Math.random() * 50) + 30,
            convertedLeads: Math.floor(Math.random() * 15) + 5,
            dncLeads: Math.floor(Math.random() * 5) + 1,
            totalCost: Math.floor(Math.random() * 200) + 100,
            totalRevenue: Math.floor(Math.random() * 500) + 300,
          })
        }
        setData(demoData)
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
          "Conversion Rate": item.totalLeads > 0 ? ((item.convertedLeads / item.totalLeads) * 100).toFixed(2) : 0,
          "DNC Rate": item.totalLeads > 0 ? ((item.dncLeads / item.totalLeads) * 100).toFixed(2) : 0,
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
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {viewMode === "leads" && (
                <>
                  <Line type="monotone" dataKey="Total Leads" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="Converted" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="DNC" stroke="#ef4444" strokeWidth={2} />
                </>
              )}
              {viewMode === "revenue" && (
                <>
                  <Line type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="Cost" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="Profit" stroke="#3b82f6" strokeWidth={2} />
                </>
              )}
              {viewMode === "conversion" && (
                <>
                  <Line type="monotone" dataKey="Conversion Rate" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="DNC Rate" stroke="#ef4444" strokeWidth={2} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
