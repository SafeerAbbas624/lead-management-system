"use client"

import { useEffect, useState } from "react"
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface RevenueData {
  month: string
  totalCost: number
  totalRevenue: number
  profit: number
  profitMargin: number
}

export function RevenueAnalysisChart() {
  const [data, setData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/revenue-analysis')
        if (!response.ok) throw new Error('Failed to fetch data')
        
        const result = await response.json()
        if (result.success) {
          setData(result.data)
        }
      } catch (error) {
        console.error("Error fetching revenue analysis data:", error)
        
        // Demo data for development
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        const demoData: RevenueData[] = months.map(month => {
          const totalCost = Math.floor(Math.random() * 5000) + 2000
          const totalRevenue = totalCost + Math.floor(Math.random() * 8000) + 1000
          const profit = totalRevenue - totalCost
          const profitMargin = (profit / totalRevenue) * 100

          return {
            month,
            totalCost: isNaN(totalCost) ? 0 : totalCost,
            totalRevenue: isNaN(totalRevenue) ? 0 : totalRevenue,
            profit: isNaN(profit) ? 0 : profit,
            profitMargin: isNaN(profitMargin) ? 0 : profitMargin
          }
        })
        
        setData(demoData)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading chart...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value: number, name: string) => [
                name === 'profitMargin' ? `${value.toFixed(1)}%` : `$${value.toLocaleString()}`,
                name === 'totalCost' ? 'Total Cost' :
                name === 'totalRevenue' ? 'Total Revenue' :
                name === 'profit' ? 'Profit' : 'Profit Margin'
              ]}
            />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="totalCost" 
              fill="#ef4444" 
              name="Total Cost"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              yAxisId="left"
              dataKey="totalRevenue" 
              fill="#22c55e" 
              name="Total Revenue"
              radius={[2, 2, 0, 0]}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="profitMargin" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
              name="Profit Margin (%)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium">Average Profit Margin</p>
          <p className="text-2xl font-bold text-purple-600">
            {data.length > 0 ? (data.reduce((sum, item) => sum + item.profitMargin, 0) / data.length).toFixed(1) : '0'}%
          </p>
        </div>
        <div>
          <p className="font-medium">Total Profit (6 months)</p>
          <p className="text-2xl font-bold text-green-600">
            ${data.reduce((sum, item) => sum + item.profit, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </>
  )
}
