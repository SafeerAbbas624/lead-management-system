"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

interface TrendData {
  date: string
  totalLeads: number
  convertedLeads: number
  dncLeads: number
  totalRevenue: number
  totalCost: number
}

type ViewMode = "leads" | "revenue" | "conversion"
type Period = "daily" | "weekly" | "monthly"

export function LeadTrendsChartV2() {
  const [data, setData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("leads")
  const [period, setPeriod] = useState<Period>("daily")

  const fetchTrends = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/lead-trends?period=${period}`)
      if (!response.ok) throw new Error('Failed to fetch trends')
      
      const result = await response.json()
      setData(result.data?.trends || [])
    } catch (error) {
      console.error('Error fetching trends:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrends()
  }, [period])

  const getChartData = () => {
    const labels = data.map(item => item.date)
    
    switch (viewMode) {
      case "revenue":
        return {
          labels,
          datasets: [
            {
              label: 'Revenue',
              data: data.map(item => item.totalRevenue),
              backgroundColor: 'rgba(16, 185, 129, 0.8)',
              borderColor: 'rgba(16, 185, 129, 1)',
              borderWidth: 1,
            },
            {
              label: 'Cost',
              data: data.map(item => item.totalCost),
              backgroundColor: 'rgba(239, 68, 68, 0.8)',
              borderColor: 'rgba(239, 68, 68, 1)',
              borderWidth: 1,
            },
            {
              label: 'Profit',
              data: data.map(item => item.totalRevenue - item.totalCost),
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1,
            },
          ],
        }
      case "conversion":
        return {
          labels,
          datasets: [
            {
              label: 'Conversion Rate (%)',
              data: data.map(item => 
                item.totalLeads > 0 ? ((item.convertedLeads / item.totalLeads) * 100) : 0
              ),
              backgroundColor: 'rgba(16, 185, 129, 0.8)',
              borderColor: 'rgba(16, 185, 129, 1)',
              borderWidth: 1,
            },
            {
              label: 'DNC Rate (%)',
              data: data.map(item => 
                item.totalLeads > 0 ? ((item.dncLeads / item.totalLeads) * 100) : 0
              ),
              backgroundColor: 'rgba(239, 68, 68, 0.8)',
              borderColor: 'rgba(239, 68, 68, 1)',
              borderWidth: 1,
            },
          ],
        }
      default:
        return {
          labels,
          datasets: [
            {
              label: 'Total Leads',
              data: data.map(item => item.totalLeads),
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1,
            },
            {
              label: 'Converted',
              data: data.map(item => item.convertedLeads),
              backgroundColor: 'rgba(16, 185, 129, 0.8)',
              borderColor: 'rgba(16, 185, 129, 1)',
              borderWidth: 1,
            },
            {
              label: 'DNC',
              data: data.map(item => item.dncLeads),
              backgroundColor: 'rgba(239, 68, 68, 0.8)',
              borderColor: 'rgba(239, 68, 68, 1)',
              borderWidth: 1,
            },
          ],
        }
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Lead Trends</CardTitle>
          <div className="flex space-x-2">
            <div className="flex space-x-1">
              {(["leads", "revenue", "conversion"] as ViewMode[]).map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode(mode)}
                  className="capitalize"
                >
                  {mode}
                </Button>
              ))}
            </div>
            <div className="flex space-x-1">
              {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod(p)}
                  className="capitalize"
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Track lead performance over time
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-muted-foreground">Loading chart data...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-muted-foreground">No data available for the selected period</div>
          </div>
        ) : (
          <div className="h-[400px]">
            <Bar data={getChartData()} options={chartOptions} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
