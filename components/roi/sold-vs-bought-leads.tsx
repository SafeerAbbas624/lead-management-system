"use client"

import { useEffect, useState } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

interface SoldBoughtData {
  date: string
  boughtLeads: number
  soldLeads: number
  totalCost: number
  totalRevenue: number
  profit: number
  roi: number
}

interface SoldVsBoughtLeadsProps {
  dateRange: { from: Date; to: Date }
}

export function SoldVsBoughtLeads({ dateRange }: SoldVsBoughtLeadsProps) {
  const [data, setData] = useState<SoldBoughtData[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'leads' | 'financial'>('leads')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/roi/sold-vs-bought?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`)
        if (response.ok) {
          const result = await response.json()
          setData(result.data || [])
        }
      } catch (error) {
        console.error("Error fetching sold vs bought data:", error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading data...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">No data available for the selected period</p>
      </div>
    )
  }

  // Prepare chart data
  const leadsChartData = {
    labels: data.map(item => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Bought Leads',
        data: data.map(item => item.boughtLeads || 0),
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        borderWidth: 1,
      },
      {
        label: 'Sold Leads',
        data: data.map(item => item.soldLeads || 0),
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 1,
      }
    ]
  }

  const financialChartData = {
    labels: data.map(item => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Total Cost',
        data: data.map(item => item.totalCost || 0),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: false,
      },
      {
        label: 'Total Revenue',
        data: data.map(item => item.totalRevenue || 0),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: false,
      },
      {
        label: 'Profit',
        data: data.map(item => item.profit || 0),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: false,
      }
    ]
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true
      }
    }
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: $${value.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Toggle Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => setViewMode('leads')}
          className={`px-3 py-1 text-sm rounded ${
            viewMode === 'leads' 
              ? 'bg-blue-100 text-blue-700 border border-blue-300' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Lead Volume
        </button>
        <button
          onClick={() => setViewMode('financial')}
          className={`px-3 py-1 text-sm rounded ${
            viewMode === 'financial' 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Financial
        </button>
      </div>

      {/* Chart */}
      <div className="h-[300px]">
        {viewMode === 'leads' ? (
          <Bar data={leadsChartData} options={barOptions} />
        ) : (
          <Line data={financialChartData} options={lineOptions} />
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Total Bought</p>
          <p className="font-semibold">{data.reduce((sum, item) => sum + item.boughtLeads, 0).toLocaleString()} leads</p>
        </div>
        <div>
          <p className="text-muted-foreground">Total Sold</p>
          <p className="font-semibold">{data.reduce((sum, item) => sum + item.soldLeads, 0).toLocaleString()} leads</p>
        </div>
      </div>
    </div>
  )
}
