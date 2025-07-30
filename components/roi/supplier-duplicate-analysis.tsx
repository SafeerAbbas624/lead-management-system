"use client"

import { useEffect, useState, useRef } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface SupplierDuplicateData {
  supplierName: string
  totalLeads: number
  cleanLeads: number
  duplicateLeads: number
  duplicateRate: number
  qualityScore: number
}

interface SupplierDuplicateAnalysisProps {
  dateRange: { from: Date; to: Date }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function SupplierDuplicateAnalysis({ dateRange }: SupplierDuplicateAnalysisProps) {
  const [data, setData] = useState<SupplierDuplicateData[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'chart' | 'pie'>('chart')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/roi/supplier-duplicates?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`)
        if (response.ok) {
          const result = await response.json()
          setData(result.data || [])
        }
      } catch (error) {
        console.error("Error fetching supplier duplicate data:", error)
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
          <p className="text-sm text-muted-foreground mt-2">Loading supplier data...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">No supplier data available for the selected period</p>
      </div>
    )
  }

  // Prepare chart data
  const chartData = {
    labels: data.map(item => item.supplierName.length > 12 ? item.supplierName.substring(0, 12) + '...' : item.supplierName),
    datasets: [
      {
        label: 'Quality Score %',
        data: data.map(item => item.qualityScore || 0),
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 1,
      },
      {
        label: 'Duplicate Rate %',
        data: data.map(item => item.duplicateRate || 0),
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        borderWidth: 1,
      }
    ]
  }

  // Prepare pie chart data
  const pieData = {
    labels: data.map(item => item.supplierName.length > 12 ? item.supplierName.substring(0, 12) + '...' : item.supplierName),
    datasets: [
      {
        data: data.map(item => item.duplicateLeads || 0),
        backgroundColor: COLORS,
        borderColor: COLORS.map(color => color + '80'),
        borderWidth: 1,
      }
    ]
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
            return `${label}: ${value.toFixed(1)}%`;
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
            return value + '%';
          }
        }
      }
    }
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
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
          onClick={() => setViewMode('chart')}
          className={`px-3 py-1 text-sm rounded ${
            viewMode === 'chart'
              ? 'bg-blue-100 text-blue-700 border border-blue-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Quality Chart
        </button>
        <button
          onClick={() => setViewMode('pie')}
          className={`px-3 py-1 text-sm rounded ${
            viewMode === 'pie'
              ? 'bg-purple-100 text-purple-700 border border-purple-300'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Duplicate Distribution
        </button>
      </div>

      {/* Chart */}
      <div className="h-[250px]">
        {viewMode === 'chart' ? (
          <Bar data={chartData} options={chartOptions} />
        ) : (
          <Doughnut data={pieData} options={pieOptions} />
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Avg Quality Score</p>
          <p className="font-semibold text-green-600">
            {data.length > 0 ? (data.reduce((sum, item) => sum + (item.qualityScore || 0), 0) / data.length).toFixed(1) : 0}%
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Total Duplicates</p>
          <p className="font-semibold text-red-600">
            {data.reduce((sum, item) => sum + (item.duplicateLeads || 0), 0).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Best Supplier</p>
          <p className="font-semibold text-blue-600">
            {data.length > 0 ? data.reduce((best, current) =>
              (current.qualityScore || 0) > (best.qualityScore || 0) ? current : best
            ).supplierName.substring(0, 15) : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  )
}
