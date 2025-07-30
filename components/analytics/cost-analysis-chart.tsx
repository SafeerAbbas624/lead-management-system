"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface CostData {
  month: string
  avgCostPerLead: number
  totalSpent: number
  efficiency: number
  targetCost: number
}

export function CostAnalysisChart() {
  const [data, setData] = useState<CostData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/cost-analysis')
        if (!response.ok) throw new Error('Failed to fetch data')
        
        const result = await response.json()
        if (result.success) {
          setData(result.data)
        }
      } catch (error) {
        console.error("Error fetching cost analysis data:", error)
        
        // Demo data for development
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        const targetCost = 2.50
        
        const demoData: CostData[] = months.map(month => {
          const avgCostPerLead = targetCost + (Math.random() - 0.5) * 1.0
          const totalSpent = Math.floor(Math.random() * 5000) + 2000
          const efficiency = (targetCost / avgCostPerLead) * 100
          
          return {
            month,
            avgCostPerLead: Math.max(1.0, avgCostPerLead),
            totalSpent,
            efficiency: Math.max(50, Math.min(150, efficiency)),
            targetCost
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

  const avgCost = data.length > 0 
    ? data.reduce((sum, item) => sum + item.avgCostPerLead, 0) / data.length 
    : 0

  const totalSpent = data.reduce((sum, item) => sum + item.totalSpent, 0)

  return (
    <>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value: number, name: string) => [
                name === 'efficiency' ? `${value.toFixed(1)}%` : 
                name === 'totalSpent' ? `$${value.toLocaleString()}` : `$${value.toFixed(2)}`,
                name === 'avgCostPerLead' ? 'Avg Cost/Lead' :
                name === 'totalSpent' ? 'Total Spent' :
                name === 'efficiency' ? 'Cost Efficiency' : 'Target Cost'
              ]}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="avgCostPerLead" 
              stroke="#ef4444" 
              strokeWidth={3}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 5 }}
              name="Avg Cost/Lead"
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="targetCost" 
              stroke="#94a3b8" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#94a3b8', strokeWidth: 2, r: 4 }}
              name="Target Cost"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="efficiency" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
              name="Cost Efficiency (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="font-medium">Avg Cost/Lead</p>
          <p className="text-2xl font-bold text-red-600">${avgCost.toFixed(2)}</p>
        </div>
        <div>
          <p className="font-medium">Total Spent (6 months)</p>
          <p className="text-2xl font-bold text-blue-600">${totalSpent.toLocaleString()}</p>
        </div>
        <div>
          <p className="font-medium">Cost Efficiency</p>
          <p className="text-2xl font-bold text-purple-600">
            {data.length > 0 ? data[data.length - 1].efficiency.toFixed(1) : '0'}%
          </p>
        </div>
      </div>
    </>
  )
}
