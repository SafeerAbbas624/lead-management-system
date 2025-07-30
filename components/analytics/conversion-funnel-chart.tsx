"use client"

import { useEffect, useState } from "react"
import { FunnelChart, Funnel, Cell, ResponsiveContainer, Tooltip, LabelList } from "recharts"

interface FunnelData {
  name: string
  value: number
  fill: string
}

export function ConversionFunnelChart() {
  const [data, setData] = useState<FunnelData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/conversion-funnel')
        if (!response.ok) throw new Error('Failed to fetch data')
        
        const result = await response.json()
        if (result.success) {
          setData(result.data)
        }
      } catch (error) {
        console.error("Error fetching conversion funnel data:", error)
        
        // Demo data for development
        const totalUploaded = 10000
        const cleanLeads = Math.floor(totalUploaded * 0.85)
        const distributed = Math.floor(cleanLeads * 0.75)
        const contacted = Math.floor(distributed * 0.60)
        const qualified = Math.floor(contacted * 0.40)
        const converted = Math.floor(qualified * 0.25)
        
        const demoData: FunnelData[] = [
          { name: 'Total Uploaded', value: totalUploaded, fill: '#8884d8' },
          { name: 'Clean Leads', value: cleanLeads, fill: '#82ca9d' },
          { name: 'Distributed', value: distributed, fill: '#ffc658' },
          { name: 'Contacted', value: contacted, fill: '#ff7c7c' },
          { name: 'Qualified', value: qualified, fill: '#8dd1e1' },
          { name: 'Converted', value: converted, fill: '#d084d0' }
        ]
        
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = data.value && data.name !== 'Total Uploaded' 
        ? ((data.value / (payload[0].payload.value || 1)) * 100).toFixed(1)
        : '100'
      
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-blue-600">
            Count: {data.value.toLocaleString()}
          </p>
          <p className="text-sm text-green-600">
            Rate: {percentage}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <Tooltip content={<CustomTooltip />} />
            <Funnel
              dataKey="value"
              data={data}
              isAnimationActive
            >
              <LabelList position="center" fill="#fff" stroke="none" />
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="text-sm font-medium">Conversion Rates:</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {data.slice(1).map((stage, index) => {
            const previousStage = data[index]
            const conversionRate = previousStage ? (stage.value / previousStage.value) * 100 : 0
            
            return (
              <div key={stage.name} className="flex justify-between">
                <span className="text-muted-foreground">{stage.name}:</span>
                <span className="font-medium">{conversionRate.toFixed(1)}%</span>
              </div>
            )
          })}
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium">Overall Conversion</p>
          <p className="text-2xl font-bold text-purple-600">
            {data.length > 0 ? ((data[data.length - 1].value / data[0].value) * 100).toFixed(1) : '0'}%
          </p>
        </div>
        <div>
          <p className="font-medium">Total Converted</p>
          <p className="text-2xl font-bold text-green-600">
            {data.length > 0 ? data[data.length - 1].value.toLocaleString() : '0'}
          </p>
        </div>
      </div>
    </>
  )
}
