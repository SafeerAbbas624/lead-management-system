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
import { Chart } from 'react-chartjs-2'

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

interface RevenueData {
  month: string
  totalCost: number
  totalRevenue: number
  profit: number
  profitMargin: number
}

export function RevenueAnalysisChartJS() {
  const [data, setData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/revenue-analysis')
        if (!response.ok) throw new Error('Failed to fetch data')
        
        const result = await response.json()
        if (result.success) {
          setData(result.data)
        }
      } catch (error) {
        console.error("Error fetching revenue analysis data:", error)
        
        // Demo data for development
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        const demoData: RevenueData[] = months.map(month => {
          const totalCost = Math.floor(Math.random() * 5000) + 2000
          const totalRevenue = totalCost + Math.floor(Math.random() * 8000) + 1000
          const profit = totalRevenue - totalCost
          const profitMargin = (profit / totalRevenue) * 100

          return {
            month,
            totalCost: isNaN(totalCost) ? 0 : totalCost,
            totalRevenue: isNaN(totalRevenue) ? 0 : totalRevenue,
            profit: isNaN(profit) ? 0 : profit,
            profitMargin: isNaN(profitMargin) ? 0 : profitMargin
          }
        })
        
        setData(demoData)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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

  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Total Cost',
        data: data.map(item => item.totalCost),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        type: 'bar' as const,
        label: 'Total Revenue',
        data: data.map(item => item.totalRevenue),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: 'Profit Margin (%)',
        data: data.map(item => item.profitMargin),
        borderColor: 'rgba(139, 92, 246, 1)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgba(139, 92, 246, 1)',
        pointBorderColor: 'rgba(139, 92, 246, 1)',
        pointRadius: 5,
        pointHoverRadius: 7,
        yAxisID: 'y1',
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            
            if (label === 'Profit Margin (%)') {
              return `${label}: ${value.toFixed(1)}%`;
            } else {
              return `${label}: $${value.toLocaleString()}`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Month'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Amount ($)'
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Profit Margin (%)'
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value: any) {
            return value.toFixed(1) + '%';
          }
        }
      },
    },
  }

  return (
    <>
      {/* Debug info */}
      <div className="mb-2 text-xs text-gray-500">
        Data loaded: {data.length} months
      </div>
      
      <div className="h-[300px]">
        <Chart type="bar" data={chartData} options={options} />
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium">Average Profit Margin</p>
          <p className="text-2xl font-bold text-purple-600">
            {data.length > 0 ? (data.reduce((sum, item) => sum + item.profitMargin, 0) / data.length).toFixed(1) : '0'}%
          </p>
        </div>
        <div>
          <p className="font-medium">Total Profit (6 months)</p>
          <p className="text-2xl font-bold text-green-600">
            ${data.reduce((sum, item) => sum + item.profit, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </>
  )
}
