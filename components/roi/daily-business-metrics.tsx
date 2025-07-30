"use client"

import { useEffect, useState } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
)

interface DailyMetrics {
  date: string
  leadsProcessed: number
  leadsSold: number
  revenue: number
  cost: number
  profit: number
  profitMargin: number
  activeSuppliers: number
  activeClients: number
}

interface DailyBusinessMetricsProps {
  dateRange: { from: Date; to: Date }
}

export function DailyBusinessMetrics({ dateRange }: DailyBusinessMetricsProps) {
  const [data, setData] = useState<DailyMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['profit', 'revenue', 'cost'])

  const availableMetrics = [
    { key: 'leadsProcessed', label: 'Leads Processed', color: '#3b82f6' },
    { key: 'leadsSold', label: 'Leads Sold', color: '#10b981' },
    { key: 'revenue', label: 'Revenue', color: '#059669' },
    { key: 'cost', label: 'Cost', color: '#dc2626' },
    { key: 'profit', label: 'Profit', color: '#7c3aed' },
    { key: 'profitMargin', label: 'Profit Margin %', color: '#ea580c' },
    { key: 'activeSuppliers', label: 'Active Suppliers', color: '#0891b2' },
    { key: 'activeClients', label: 'Active Clients', color: '#be185d' }
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/roi/daily-metrics?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`)
        if (response.ok) {
          const result = await response.json()
          setData(result.data || [])
        }
      } catch (error) {
        console.error("Error fetching daily metrics:", error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  const toggleMetric = (metricKey: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricKey) 
        ? prev.filter(m => m !== metricKey)
        : [...prev, metricKey]
    )
  }

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading daily metrics...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">No daily metrics available for the selected period</p>
      </div>
    )
  }

  // Calculate summary statistics
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0)
  const totalCost = data.reduce((sum, item) => sum + item.cost, 0)
  const totalProfit = totalRevenue - totalCost
  const avgProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  // Prepare chart data
  const chartData = {
    labels: data.map(item => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: selectedMetrics.map(metricKey => {
      const metric = availableMetrics.find(m => m.key === metricKey)
      if (!metric) return null

      return {
        label: metric.label,
        data: data.map(item => (item as any)[metricKey] || 0),
        borderColor: metric.color,
        backgroundColor: metric.color + '20',
        borderWidth: 2,
        fill: false,
      }
    }).filter(Boolean)
  }

  const chartOptions = {
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
            const metricKey = selectedMetrics[context.datasetIndex];

            if (metricKey === 'profitMargin') {
              return `${label}: ${value.toFixed(1)}%`;
            } else if (metricKey?.includes('revenue') || metricKey?.includes('cost') || metricKey?.includes('profit')) {
              return `${label}: $${value.toLocaleString()}`;
            }
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

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-green-600">Total Revenue</p>
          <p className="text-2xl font-bold text-green-900">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-red-600">Total Cost</p>
          <p className="text-2xl font-bold text-red-900">${totalCost.toLocaleString()}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-purple-600">Total Profit</p>
          <p className="text-2xl font-bold text-purple-900">${totalProfit.toLocaleString()}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-orange-600">Avg Profit Margin</p>
          <p className="text-2xl font-bold text-orange-900">{avgProfitMargin.toFixed(1)}%</p>
        </div>
      </div>

      {/* Metric Selection */}
      <div className="flex flex-wrap gap-2">
        {availableMetrics.map(metric => (
          <button
            key={metric.key}
            onClick={() => toggleMetric(metric.key)}
            className={`px-3 py-1 text-sm rounded border ${
              selectedMetrics.includes(metric.key)
                ? 'border-blue-300 bg-blue-100 text-blue-700'
                : 'border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={{
              borderColor: selectedMetrics.includes(metric.key) ? metric.color : undefined,
              backgroundColor: selectedMetrics.includes(metric.key) ? `${metric.color}20` : undefined,
              color: selectedMetrics.includes(metric.key) ? metric.color : undefined
            }}
          >
            {metric.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[350px]">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  )
}
