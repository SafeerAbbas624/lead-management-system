"use client"

import { useEffect, useState } from "react"
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface TrendData {
  month: string
  leadsGrowth: number
  revenueGrowth: number
  qualityImprovement: number
  costReduction: number
  overallScore: number
}

export function TrendAnalysisChart() {
  const [data, setData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/trend-analysis')
        if (!response.ok) throw new Error('Failed to fetch data')
        
        const result = await response.json()
        if (result.success) {
          setData(result.data)
        }
      } catch (error) {
        console.error("Error fetching trend analysis data:", error)
        
        // Demo data for development
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        
        const demoData: TrendData[] = months.map((month, index) => {
          const leadsGrowth = (Math.random() - 0.3) * 30 + 5 // -5% to +25%
          const revenueGrowth = (Math.random() - 0.2) * 40 + 8 // -2% to +30%
          const qualityImprovement = (Math.random() - 0.4) * 20 + 2 // -6% to +10%
          const costReduction = (Math.random() - 0.5) * 15 // -7.5% to +7.5%
          
          // Overall score based on weighted metrics
          const overallScore = (
            leadsGrowth * 0.3 + 
            revenueGrowth * 0.4 + 
            qualityImprovement * 0.2 + 
            costReduction * 0.1
          )
          
          return {
            month,
            leadsGrowth: Math.round(leadsGrowth * 10) / 10,
            revenueGrowth: Math.round(revenueGrowth * 10) / 10,
            qualityImprovement: Math.round(qualityImprovement * 10) / 10,
            costReduction: Math.round(costReduction * 10) / 10,
            overallScore: Math.round(overallScore * 10) / 10
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

  const avgOverallScore = data.length > 0 
    ? data.reduce((sum, item) => sum + item.overallScore, 0) / data.length 
    : 0

  const latestTrend = data.length > 0 ? data[data.length - 1] : null

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
                `${value > 0 ? '+' : ''}${value.toFixed(1)}%`,
                name === 'leadsGrowth' ? 'Leads Growth' :
                name === 'revenueGrowth' ? 'Revenue Growth' :
                name === 'qualityImprovement' ? 'Quality Improvement' :
                name === 'costReduction' ? 'Cost Reduction' : 'Overall Score'
              ]}
            />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="leadsGrowth" 
              fill="#3b82f6" 
              name="Leads Growth"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              yAxisId="left"
              dataKey="revenueGrowth" 
              fill="#10b981" 
              name="Revenue Growth"
              radius={[2, 2, 0, 0]}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="overallScore" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
              name="Overall Score"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium">Avg Performance Score</p>
          <p className="text-2xl font-bold text-purple-600">
            {avgOverallScore > 0 ? '+' : ''}{avgOverallScore.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="font-medium">Latest Month Trend</p>
          <p className="text-2xl font-bold text-blue-600">
            {latestTrend && latestTrend.overallScore > 0 ? '+' : ''}{latestTrend?.overallScore.toFixed(1) || '0'}%
          </p>
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="text-sm font-medium">Latest Performance Metrics:</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Leads Growth:</span>
            <span className={`font-medium ${latestTrend && latestTrend.leadsGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {latestTrend && latestTrend.leadsGrowth > 0 ? '+' : ''}{latestTrend?.leadsGrowth.toFixed(1) || '0'}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Revenue Growth:</span>
            <span className={`font-medium ${latestTrend && latestTrend.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {latestTrend && latestTrend.revenueGrowth > 0 ? '+' : ''}{latestTrend?.revenueGrowth.toFixed(1) || '0'}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quality Improvement:</span>
            <span className={`font-medium ${latestTrend && latestTrend.qualityImprovement > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {latestTrend && latestTrend.qualityImprovement > 0 ? '+' : ''}{latestTrend?.qualityImprovement.toFixed(1) || '0'}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cost Efficiency:</span>
            <span className={`font-medium ${latestTrend && latestTrend.costReduction > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {latestTrend && latestTrend.costReduction > 0 ? '+' : ''}{latestTrend?.costReduction.toFixed(1) || '0'}%
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
