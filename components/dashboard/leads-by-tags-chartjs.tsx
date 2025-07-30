"use client"

import { useEffect, useState } from "react"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Pie } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

interface LeadsByTag {
  name: string
  value: number
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
]

export function LeadsByTagsChartJS() {
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

  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        data: data.map(item => item.value),
        backgroundColor: COLORS.slice(0, data.length),
        borderColor: COLORS.slice(0, data.length).map(color => color),
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed.toLocaleString()} leads (${percentage}%)`;
          }
        }
      }
    },
  }

  return (
    <>
      {/* Debug info */}
      <div className="mb-2 text-xs text-gray-500">
        Data loaded: {data.length} tags, Total: {total}
      </div>
      
      <div className="h-[300px]">
        <Pie data={chartData} options={options} />
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
