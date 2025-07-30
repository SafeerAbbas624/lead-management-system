"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

interface SupplierROIData {
  supplier: string
  roi: number
  profit: number
  totalRevenue: number
  totalCost: number
}

export function SupplierROIChart() {
  const { data, isLoading, error } = useQuery<SupplierROIData[]>({
    queryKey: ['supplier-roi'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/supplier-roi')
      if (!response.ok) {
        throw new Error('Failed to fetch supplier ROI data')
      }
      const result = await response.json()
      return result.data
    }
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Supplier ROI</CardTitle>
          <CardDescription>Return on investment by supplier</CardDescription>
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
          <CardTitle>Supplier ROI</CardTitle>
          <CardDescription>Return on investment by supplier</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">
            {error ? 'Error loading supplier ROI data' : 'No data available'}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Format data for the chart - simple approach that works with Recharts
  const chartData = data.map(supplier => ({
    ...supplier,
    roi: parseFloat(supplier.roi.toFixed(2)),
    profit: parseFloat(supplier.profit.toFixed(2))
  }))

  console.log('Supplier ROI Chart Data:', chartData)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier ROI</CardTitle>
        <CardDescription>Return on investment by supplier</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 40,
                left: 40,
                bottom: 80,
              }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="supplier"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="#a78bfa"
                label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft' }}
                width={60}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#60a5fa"
                label={{ value: 'Profit ($)', angle: 90, position: 'insideRight' }}
                width={60}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'ROI (%)') return [`${value}%`, 'ROI'];
                  if (name === 'Profit ($)') return [`$${value.toLocaleString()}`, 'Profit'];
                  return [value, name];
                }}
                labelFormatter={(label) => `Supplier: ${label}`}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="rect"
              />
              <ReferenceLine yAxisId="left" y={0} stroke="#666" strokeDasharray="2 2" />
              <ReferenceLine yAxisId="right" y={0} stroke="#666" strokeDasharray="2 2" />
              <Bar
                yAxisId="left"
                dataKey="roi"
                name="ROI (%)"
                fill="#a78bfa"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`roi-cell-${index}`} fill={entry.roi >= 0 ? "#a78bfa" : "#f87171"} />
                ))}
              </Bar>
              <Bar
                yAxisId="right"
                dataKey="profit"
                name="Profit ($)"
                fill="#60a5fa"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`profit-cell-${index}`} fill={entry.profit >= 0 ? "#60a5fa" : "#fbbf24"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
