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
import { Bar } from 'react-chartjs-2'

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

interface ConversionData {
  date: string
  totalLeads: number
  soldLeads: number
  conversionRate: number
  revenue: number
  cost: number
  profit: number
}

interface LeadConversionOverviewProps {
  dateRange: { from: Date; to: Date }
}

export function LeadConversionOverview({ dateRange }: LeadConversionOverviewProps) {
  const [data, setData] = useState<ConversionData[]>([])
  const [totals, setTotals] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/roi/conversion-overview?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}&_t=${Date.now()}`)
        if (response.ok) {
          const result = await response.json()
          setData(result.data || [])
          setTotals(result.totals || null)
        }
      } catch (error) {
        console.error("Error fetching conversion data:", error)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading conversion data...</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">No conversion data available for the selected period</p>
      </div>
    )
  }

  // Prepare chart data
  const chartData = {
    labels: data.map(item => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Total Leads',
        data: data.map(item => item.totalLeads || 0),
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
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
            const dataIndex = context.dataIndex;
            const conversionRate = data[dataIndex]?.conversionRate || 0;

            if (label === 'Total Leads') {
              return [`${label}: ${value.toLocaleString()}`, `Conversion Rate: ${conversionRate.toFixed(1)}%`];
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
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-blue-600">Total Leads</p>
          <p className="text-2xl font-bold text-blue-900">
            {totals ? totals.totalLeads.toLocaleString() : '0'}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-green-600">Sold Leads</p>
          <p className="text-2xl font-bold text-green-900">
            {totals ? totals.totalSoldLeads.toLocaleString() : '0'}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-purple-600">Avg Conversion Rate</p>
          <p className="text-2xl font-bold text-purple-900">
            {totals ? totals.totalConversionRate.toFixed(1) : '0.0'}%
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-orange-600">Total Profit</p>
          <p className="text-2xl font-bold text-orange-900">
            ${totals ? totals.totalProfit.toLocaleString() : '0'}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[400px]">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  )
}
