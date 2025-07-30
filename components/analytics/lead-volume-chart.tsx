"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface LeadVolumeData {
  date: string
  totalLeads: number
  cleanLeads: number
  duplicates: number
  dncMatches: number
}

export function LeadVolumeChart() {
  const [data, setData] = useState<LeadVolumeData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/lead-volume')
        if (!response.ok) throw new Error('Failed to fetch data')
        
        const result = await response.json()
        if (result.success) {
          setData(result.data)
        }
      } catch (error) {
        console.error("Error fetching lead volume data:", error)
        
        // Demo data for development
        const demoData: LeadVolumeData[] = []
        const today = new Date()
        
        for (let i = 29; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          
          const totalLeads = Math.floor(Math.random() * 200) + 50
          const duplicates = Math.floor(totalLeads * 0.15)
          const dncMatches = Math.floor(totalLeads * 0.05)
          const cleanLeads = totalLeads - duplicates - dncMatches
          
          demoData.push({
            date: date.toISOString().split('T')[0],
            totalLeads,
            cleanLeads,
            duplicates,
            dncMatches
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

  return (
    <>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
                name === 'totalLeads' ? 'Total Leads' :
                name === 'cleanLeads' ? 'Clean Leads' :
                name === 'duplicates' ? 'Duplicates' : 'DNC Matches'
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="totalLeads" 
              stroke="#2563eb" 
              strokeWidth={2}
              dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="cleanLeads" 
              stroke="#16a34a" 
              strokeWidth={2}
              dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="duplicates" 
              stroke="#ea580c" 
              strokeWidth={2}
              dot={{ fill: '#ea580c', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="dncMatches" 
              stroke="#dc2626" 
              strokeWidth={2}
              dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
          <span className="text-muted-foreground">Total Leads</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-600 rounded-full"></div>
          <span className="text-muted-foreground">Clean Leads</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
          <span className="text-muted-foreground">Duplicates</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-600 rounded-full"></div>
          <span className="text-muted-foreground">DNC Matches</span>
        </div>
      </div>
    </>
  )
}
