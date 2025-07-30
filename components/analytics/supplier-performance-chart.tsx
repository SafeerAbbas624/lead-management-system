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

interface SupplierData {
  name: string
  totalLeads: number
  cleanLeads: number
  duplicates: number
  dncMatches: number
  qualityScore: number
  avgCost: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function SupplierPerformanceChart() {
  const [data, setData] = useState<SupplierData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/supplier-performance')
        if (!response.ok) throw new Error('Failed to fetch data')
        
        const result = await response.json()
        if (result.success) {
          console.log('Supplier performance data:', result)

          // Combine topSuppliers and bottomSuppliers into a single array
          const allSuppliers = [
            ...(result.topSuppliers || []),
            ...(result.bottomSuppliers || [])
          ]

          // Ensure all values are valid numbers and strings
          const validatedData = allSuppliers
            .filter((item: any) => item && item.name && typeof item.name === 'string' && item.name.trim() !== '')
            .map((item: any) => {
              // Helper function to safely convert to number
              const safeNumber = (value: any, defaultValue: number = 0): number => {
                const num = Number(value)
                return isNaN(num) || !isFinite(num) ? defaultValue : num
              }

              // Map the API response fields to the expected component fields
              const cleanItem = {
                name: String(item.name || 'Unknown').trim(),
                totalLeads: safeNumber(item.leads, 0),
                cleanLeads: safeNumber(item.soldLeads, 0), // Use soldLeads as clean leads
                duplicates: 0, // Not provided in current API
                dncMatches: 0, // Not provided in current API
                qualityScore: Math.max(0, Math.min(100, safeNumber(item.qualityScore, 0))), // Use qualityScore if available
                avgCost: safeNumber(item.cost, 0)
              }

              // Double-check that no values are NaN or Infinity
              Object.keys(cleanItem).forEach(key => {
                if (typeof cleanItem[key] === 'number' && (!isFinite(cleanItem[key]) || isNaN(cleanItem[key]))) {
                  cleanItem[key] = 0
                }
              })

              return cleanItem
            })
          setData(validatedData)
        }
      } catch (error) {
        console.error("Error fetching supplier performance data:", error)
        setData([])
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

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No supplier performance data available</p>
          <p className="text-sm text-muted-foreground mt-1">Upload some leads to see supplier performance</p>
        </div>
      </div>
    )
  }

  // Debug: Log the data to see what we're working with
  console.log('Chart data:', data)
  console.log('Quality scores:', data.map(d => ({ name: d.name, score: d.qualityScore, type: typeof d.qualityScore })))
  console.log('Raw data before validation:', data)

  // Final safety check - ensure no NaN values make it to the chart
  const chartData = data.filter(item => item && item.name).map(item => {
    const safeNumber = (value: any, defaultValue: number = 0): number => {
      const num = Number(value);
      return Number.isFinite(num) && !isNaN(num) ? num : defaultValue;
    };

    const name = String(item.name || 'Unknown').trim();
    // Truncate long names to prevent display issues
    const displayName = name.length > 15 ? name.substring(0, 12) + '...' : name;

    return {
      name: displayName,
      fullName: name, // Keep full name for tooltip
      totalLeads: safeNumber(item.totalLeads),
      cleanLeads: safeNumber(item.cleanLeads),
      duplicates: safeNumber(item.duplicates),
      dncMatches: safeNumber(item.dncMatches),
      qualityScore: Math.max(0, Math.min(100, safeNumber(item.qualityScore))),
      avgCost: safeNumber(item.avgCost)
    };
  })

  console.log('Final chart data:', chartData)

  // Prepare Chart.js data
  const chartJsData = {
    labels: chartData.map(item => item.name),
    datasets: [
      {
        label: 'Total Leads',
        data: chartData.map(item => item.totalLeads),
        backgroundColor: '#8884d8',
        borderColor: '#6366f1',
        borderWidth: 1,
      },
      {
        label: 'Clean Leads',
        data: chartData.map(item => item.cleanLeads),
        backgroundColor: '#82ca9d',
        borderColor: '#10b981',
        borderWidth: 1,
      },
      {
        label: 'Quality Score %',
        data: chartData.map(item => item.qualityScore),
        backgroundColor: '#ffc658',
        borderColor: '#f59e0b',
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
          title: function(context: any) {
            const index = context[0]?.dataIndex
            return chartData[index]?.fullName || context[0]?.label || 'Unknown'
          },
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;

            if (label === 'Quality Score %') {
              return `${label}: ${value.toFixed(1)}%`;
            } else if (label === 'Avg Cost') {
              return `${label}: $${value.toFixed(2)}`;
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
    <>
      <div className="h-[300px]">
        <Bar data={chartJsData} options={chartOptions} />
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="text-sm font-medium">Top Performers by Quality Score:</div>
        <div className="space-y-1">
          {chartData.slice(0, 3).map((supplier, index) => (
            <div key={supplier.fullName || supplier.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="font-medium" title={supplier.fullName || supplier.name}>{supplier.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {supplier.totalLeads.toLocaleString()} leads
                </span>
                <span className="font-medium text-green-600">
                  {supplier.qualityScore.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
