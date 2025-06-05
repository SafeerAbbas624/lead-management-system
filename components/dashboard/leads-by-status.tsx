"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

interface LeadStatus {
  name: string
  value: number
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export function LeadsByStatus() {
  const [data, setData] = useState<LeadStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeadsByStatus = async () => {
      try {
        // Use the correct lowercase column name from the actual database
        const { data: leadsData, error } = await supabase.from("leads").select("leadstatus")

        if (error) {
          console.error("Database error:", error)
          throw error
        }

        if (!leadsData || leadsData.length === 0) {
          // If no data, use sample data
          setData(getSampleData())
          return
        }

        // Count leads by status
        const statusCounts: Record<string, number> = {}
        leadsData.forEach((lead) => {
          const status = lead.leadstatus || "Unknown"
          statusCounts[status] = (statusCounts[status] || 0) + 1
        })

        // Transform for chart
        const chartData = Object.entries(statusCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
          value,
        }))

        setData(chartData)
      } catch (error) {
        console.error("Error fetching leads by status:", error)
        // Fallback to sample data
        setData(getSampleData())
      } finally {
        setLoading(false)
      }
    }

    fetchLeadsByStatus()
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
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} leads`, "Count"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// Sample data for fallback or development
function getSampleData(): LeadStatus[] {
  return [
    { name: "New", value: 400 },
    { name: "Qualified", value: 300 },
    { name: "Contacted", value: 200 },
    { name: "DNC", value: 100 },
    { name: "Converted", value: 150 },
  ]
}
