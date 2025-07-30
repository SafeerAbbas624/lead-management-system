"use client"

import { useEffect, useState } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface QualityData {
  date: string
  cleanRate: number
  duplicateRate: number
  dncRate: number
  qualityScore: number
}

export function QualityMetricsChart() {
  const [data, setData] = useState<QualityData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/quality-metrics')
        if (!response.ok) throw new Error('Failed to fetch data')
        
        const result = await response.json()
        if (result.success) {
          setData(result.data)
        }
      } catch (error) {
        console.error("Error fetching quality metrics data:", error)
        
        // Demo data for development
        const demoData: QualityData[] = []
        const today = new Date()
        
        for (let i = 13; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          
          const duplicateRate = Math.random() * 15 + 5 // 5-20%
          const dncRate = Math.random() * 8 + 2 // 2-10%
          const cleanRate = 100 - duplicateRate - dncRate
          const qualityScore = cleanRate + (Math.random() * 10 - 5) // Add some variance
          
          demoData.push({
            date: date.toISOString().split('T')[0],
            cleanRate: Math.max(0, Math.min(100, cleanRate)),
            duplicateRate: Math.max(0, Math.min(100, duplicateRate)),
            dncRate: Math.max(0, Math.min(100, dncRate)),
            qualityScore: Math.max(0, Math.min(100, qualityScore))
          })
        }
        
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

  const avgQualityScore = data.length > 0 
    ? data.reduce((sum, item) => sum + item.qualityScore, 0) / data.length 
    : 0

  const avgCleanRate = data.length > 0 
    ? data.reduce((sum, item) => sum + item.cleanRate, 0) / data.length 
    : 0

  return (
    <>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis domain={[0, 100]} />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)}%`,
                name === 'cleanRate' ? 'Clean Rate' :
                name === 'duplicateRate' ? 'Duplicate Rate' :
                name === 'dncRate' ? 'DNC Rate' : 'Quality Score'
              ]}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="cleanRate"
              stackId="1"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.6}
              name="Clean Rate"
            />
            <Area
              type="monotone"
              dataKey="duplicateRate"
              stackId="1"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.6}
              name="Duplicate Rate"
            />
            <Area
              type="monotone"
              dataKey="dncRate"
              stackId="1"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.6}
              name="DNC Rate"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="font-medium">Avg Quality Score</p>
          <p className="text-2xl font-bold text-blue-600">{avgQualityScore.toFixed(1)}%</p>
        </div>
        <div>
          <p className="font-medium">Avg Clean Rate</p>
          <p className="text-2xl font-bold text-green-600">{avgCleanRate.toFixed(1)}%</p>
        </div>
        <div>
          <p className="font-medium">Data Quality Trend</p>
          <p className="text-2xl font-bold text-purple-600">
            {data.length >= 2 && data[data.length - 1].qualityScore > data[data.length - 2].qualityScore ? '↗' : '↘'} 
            {data.length >= 2 ? Math.abs(data[data.length - 1].qualityScore - data[data.length - 2].qualityScore).toFixed(1) : '0'}%
          </p>
        </div>
      </div>
    </>
  )
}
