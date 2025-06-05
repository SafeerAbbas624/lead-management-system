"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { roiApi } from "@/lib/mock-api"

interface RoiTrendsProps {
  period: "daily" | "weekly" | "monthly"
  height?: number
}

export function RoiTrends({ period, height = 300 }: RoiTrendsProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true)
        const trendsData = await roiApi.getTrends(period)
        setData(trendsData)
      } catch (error) {
        console.error("Error fetching ROI trends:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrends()
  }, [period])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <p className="text-muted-foreground">Loading trend data...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 border rounded-md">
        <p className="text-muted-foreground">No trend data available</p>
      </div>
    )
  }

  return (
    <div style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
          <Area type="monotone" dataKey="cost" name="Cost" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
          <Area type="monotone" dataKey="leads" name="Leads" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
