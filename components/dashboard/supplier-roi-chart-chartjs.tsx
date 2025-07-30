"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
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

interface SupplierROIData {
  supplier: string
  roi: number
  profit: number
  totalRevenue: number
  totalCost: number
}

export function SupplierROIChartJS() {
  const { data, isLoading, error } = useQuery<SupplierROIData[]>({
    queryKey: ['supplier-roi'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/supplier-roi')
      if (!response.ok) {
        throw new Error('Failed to fetch supplier ROI data')
      }
      const result = await response.json()
      return result.data
    }
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Supplier ROI</CardTitle>
          <CardDescription>Return on investment by supplier</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[450px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Supplier ROI</CardTitle>
          <CardDescription>Return on investment by supplier</CardDescription>
        </CardHeader>
        <CardContent className="h-[450px] flex items-center justify-center">
          <p className="text-muted-foreground">
            {error ? 'Error loading supplier ROI data' : 'No data available'}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Format data for Chart.js with NaN validation
  const chartData = {
    labels: data.map(supplier => supplier.supplier),
    datasets: [
      {
        label: 'ROI (%)',
        data: data.map(supplier => isNaN(Number(supplier.roi)) ? 0 : Number(supplier.roi)),
        backgroundColor: data.map(supplier => {
          const roi = isNaN(Number(supplier.roi)) ? 0 : Number(supplier.roi)
          return roi >= 0 ? 'rgba(167, 139, 250, 0.8)' : 'rgba(248, 113, 113, 0.8)'
        }),
        borderColor: data.map(supplier => {
          const roi = isNaN(Number(supplier.roi)) ? 0 : Number(supplier.roi)
          return roi >= 0 ? 'rgba(167, 139, 250, 1)' : 'rgba(248, 113, 113, 1)'
        }),
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: 'Profit ($)',
        data: data.map(supplier => isNaN(Number(supplier.profit)) ? 0 : Number(supplier.profit)),
        backgroundColor: data.map(supplier => {
          const profit = isNaN(Number(supplier.profit)) ? 0 : Number(supplier.profit)
          return profit >= 0 ? 'rgba(96, 165, 250, 0.8)' : 'rgba(251, 191, 36, 0.8)'
        }),
        borderColor: data.map(supplier => {
          const profit = isNaN(Number(supplier.profit)) ? 0 : Number(supplier.profit)
          return profit >= 0 ? 'rgba(96, 165, 250, 1)' : 'rgba(251, 191, 36, 1)'
        }),
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label.includes('ROI')) {
              return `${label}: ${value}%`;
            } else if (label.includes('Profit')) {
              return `${label}: $${value.toLocaleString()}`;
            }
            return `${label}: ${value}`;
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
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'ROI (%)'
        },
        grid: {
          drawOnChartArea: true,
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Profit ($)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier ROI</CardTitle>
        <CardDescription>Return on investment by supplier</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[450px]">
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}
