"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

interface SourcePerformanceData {
  source: string
  totalLeads: number
  conversionRate: number
  costPerLead: number
  totalCost: number
  revenue: number
  roi: number
  last30Days: {
    leads: number
    converted: number
    revenue: number
    conversionRate: number
  }
  statusSummary: {
    new: number
    contacted: number
    qualified: number
    converted: number
    closedLost: number
  }
}

export function SourcePerformanceChart() {
  const { data, isLoading, error } = useQuery<SourcePerformanceData[]>({
    queryKey: ['source-performance'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/source-performance')
      if (!response.ok) {
        throw new Error('Failed to fetch source performance data')
      }
      const result = await response.json()
      console.log('Source Performance API Response:', result)
      return result.data || []
    },
    retry: 3,
    refetchOnWindowFocus: false
  })

  console.log('Source Performance Data:', data)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Source Performance</CardTitle>
          <CardDescription>Loading performance metrics by lead source</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Source Performance</CardTitle>
          <CardDescription>Performance metrics by lead source</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">
            {error ? `Error loading source performance data: ${error}` : 'No data available'}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Filter out sources with no data and ensure we have valid numbers and strings
  const validData = data.filter(item =>
    item.source &&
    typeof item.source === 'string' &&
    item.source.trim() !== '' &&
    (item.totalLeads > 0 || item.conversionRate > 0 || item.roi !== 0)
  ).map(item => {
    // Ensure all numeric values are finite numbers
    const cleanItem = {
      ...item,
      source: String(item.source || 'Unknown').trim(),
      conversionRate: isNaN(Number(item.conversionRate)) || !isFinite(Number(item.conversionRate)) ? 0 : Number(item.conversionRate),
      roi: isNaN(Number(item.roi)) || !isFinite(Number(item.roi)) ? 0 : Number(item.roi),
      totalLeads: isNaN(Number(item.totalLeads)) || !isFinite(Number(item.totalLeads)) ? 0 : Number(item.totalLeads),
      costPerLead: isNaN(Number(item.costPerLead)) || !isFinite(Number(item.costPerLead)) ? 0 : Number(item.costPerLead),
      totalCost: isNaN(Number(item.totalCost)) || !isFinite(Number(item.totalCost)) ? 0 : Number(item.totalCost),
      revenue: isNaN(Number(item.revenue)) || !isFinite(Number(item.revenue)) ? 0 : Number(item.revenue)
    }

    // Double-check that no values are NaN or Infinity
    Object.keys(cleanItem).forEach(key => {
      if (typeof cleanItem[key] === 'number' && (!isFinite(cleanItem[key]) || isNaN(cleanItem[key]))) {
        cleanItem[key] = 0
      }
    })

    return cleanItem
  })

  console.log('Filtered Source Performance Data:', validData)

  if (validData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Source Performance</CardTitle>
          <CardDescription>Performance metrics by lead source</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">No valid performance data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Source Performance</CardTitle>
        <CardDescription>Performance metrics by lead source</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={validData}
              margin={{
                top: 20,
                right: 40,
                left: 40,
                bottom: 80,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="source"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="#8884d8"
                label={{ value: 'Conversion Rate (%)', angle: -90, position: 'insideLeft' }}
                width={60}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#82ca9d"
                label={{ value: 'ROI (%)', angle: 90, position: 'insideRight' }}
                width={60}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value.toFixed(2)}${name.includes('Rate') || name.includes('ROI') ? '%' : ''}`,
                  name
                ]}
                labelFormatter={(label) => `Source: ${label}`}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="conversionRate"
                name="Conv. Rate (%)"
                stroke="#8884d8"
                strokeWidth={3}
                dot={{ fill: "#8884d8", strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: "#8884d8", strokeWidth: 2 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="roi"
                name="ROI (%)"
                stroke="#82ca9d"
                strokeWidth={3}
                dot={{ fill: "#82ca9d", strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: "#82ca9d", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
