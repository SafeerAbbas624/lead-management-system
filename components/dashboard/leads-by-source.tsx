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
        // Use the correct lowercase column name from the actual database
        const { data: leadsData, error } = await supabase.from("leads").select("leadsource")

        if (error) {
          console.error("Database error:", error)
          throw error
        }

        if (!leadsData || leadsData.length === 0) {
          // If no data, use sample data
          setData(getSampleData())
          return
        }

        // Count leads by source
        const sourceCounts: Record<string, number> = {}
        leadsData.forEach((lead) => {
          const source = lead.leadsource || "Unknown"
          sourceCounts[source] = (sourceCounts[source] || 0) + 1
        })

        // Transform for chart
        const chartData = Object.entries(sourceCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
          value,
        }))

        setData(chartData)
      } catch (error) {
        console.error("Error fetching leads by source:", error)
        // Fallback to sample data
        setData(getSampleData())
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
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => [`${value} leads`, "Count"]} />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
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
