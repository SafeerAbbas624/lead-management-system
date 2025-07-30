"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface LeadSource {
  name: string
  value: number
}

export function LeadsBySource() {
  const [data, setData] = useState<LeadSource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeadsBySource = async () => {
      try {
        const response = await fetch('/api/dashboard/leads-by-source')
        if (!response.ok) {
          throw new Error('Failed to fetch leads by source')
        }

        const result = await response.json()
        if (result.success && result.data && result.data.length > 0) {
          // Validate data
          const validatedData = result.data.map((item: any) => ({
            name: item.name || 'Unknown',
            value: isNaN(Number(item.value)) ? 0 : Number(item.value)
          })).filter((item: any) => item.value > 0) // Filter out zero values

          setData(validatedData)
        } else {
          throw new Error(result.error || 'No valid data received')
        }
      } catch (error) {
        console.error("Error fetching leads by source:", error)
        // Fallback to sample data
        setData([
          { name: "SafeerLLC", value: 944 },
          { name: "Zulkifal Abbas LLC", value: 35 },
          { name: "Yasha LLC", value: 12 },
          { name: "Menzies RAS", value: 5 },
          { name: "Meesum LLC", value: 4 }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchLeadsBySource()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <p className="text-muted-foreground">Loading chart data...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 border rounded-md">
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  return (
    <>
      {/* Debug info */}
      <div className="mb-2 text-xs text-gray-500">
        Data loaded: {data.length} sources
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis />
            <Tooltip
              formatter={(value) => [`${value} leads`, "Count"]}
              labelFormatter={(label) => `Source: ${label}`}
            />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}

// Sample data for fallback or development
function getSampleData(): LeadSource[] {
  return [
    { name: "Website", value: 400 },
    { name: "Social Media", value: 300 },
    { name: "Email Campaign", value: 200 },
    { name: "Referral", value: 150 },
    { name: "Direct", value: 100 },
  ]
}
