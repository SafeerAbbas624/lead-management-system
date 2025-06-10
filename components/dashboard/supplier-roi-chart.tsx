"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
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

  // Format data for the chart
  const chartData = data.map(supplier => ({
    ...supplier,
    roi: parseFloat(supplier.roi.toFixed(2)),
    profit: parseFloat(supplier.profit.toFixed(2))
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier ROI</CardTitle>
        <CardDescription>Return on investment by supplier</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="supplier" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'roi') return [`${value}%`, 'ROI'];
                  if (name === 'profit') return [`$${value.toLocaleString()}`, 'Profit'];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="roi"
                name="ROI (%)"
                fill="#8884d8"
              />
              <Bar
                yAxisId="right"
                dataKey="profit"
                name="Profit ($)"
                fill="#82ca9d"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
