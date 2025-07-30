"use client"

import { useEffect, useState } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface LeadSource {
  name: string
  value: number
}

export function LeadsBySourceChartJS() {
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

  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        label: 'Leads',
        data: data.map(item => item.value),
        backgroundColor: 'rgba(136, 132, 216, 0.8)',
        borderColor: 'rgba(136, 132, 216, 1)',
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y} leads`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 12
          }
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 12
          }
        }
      },
    },
  }

  return (
    <>
      {/* Debug info */}
      <div className="mb-2 text-xs text-gray-500">
        Data loaded: {data.length} sources
      </div>
      
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
    </>
  )
}
