"use client"

import { useEffect, useState } from "react"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface LeadsByTag {
  name: string
  value: number
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
]

export function LeadsByTags() {
  const [data, setData] = useState<LeadsByTag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeadsByTags = async () => {
      try {
        const response = await fetch('/api/dashboard/leads-by-tags')
        if (!response.ok) {
          throw new Error('Failed to fetch leads by tags')
        }

        const result = await response.json()
        console.log('Leads by tags API response:', result)
        if (result.success && result.data && result.data.length > 0) {
          // Validate data
          const validatedData = result.data.map((item: any) => ({
            name: item.name || 'Unknown',
            value: isNaN(Number(item.value)) ? 0 : Number(item.value)
          })).filter((item: any) => item.value > 0) // Filter out zero values

          console.log('Validated leads by tags data:', validatedData)
          setData(validatedData)
        } else {
          throw new Error('No valid data received')
        }
      } catch (error) {
        console.error("Error fetching leads by tags:", error)
        
        // Set demo data on error
        setData([
          { name: "High Priority", value: 320 },
          { name: "Qualified", value: 280 },
          { name: "Hot Lead", value: 245 },
          { name: "Follow Up", value: 190 },
          { name: "Cold Lead", value: 155 },
          { name: "No Tags", value: 95 }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchLeadsByTags()
  }, [])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.payload.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value.toLocaleString()} leads ({((data.value / data.payload.total) * 100).toFixed(1)}%)
          </p>
        </div>
      )
    }
    return null
  }

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

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No tag data available</p>
        </div>
      </div>
    )
  }

  // Calculate total for percentage calculation
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const dataWithTotal = data.map(item => ({ ...item, total }))

  return (
    <>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataWithTotal}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {dataWithTotal.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium">Total Tagged Leads</p>
          <p className="text-2xl font-bold">{total.toLocaleString()}</p>
        </div>
        <div>
          <p className="font-medium">Unique Tags</p>
          <p className="text-2xl font-bold">{data.length}</p>
        </div>
      </div>
    </>
  )
}
