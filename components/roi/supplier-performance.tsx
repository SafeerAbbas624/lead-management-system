"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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
interface SupplierPerformanceProps {
  dateRange: { from: Date; to: Date }
}

export function SupplierPerformance({ dateRange }: SupplierPerformanceProps) {
  const [performance, setPerformance] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSupplierPerformance = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/analytics/supplier-performance?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`)
        if (response.ok) {
          const result = await response.json()
          setPerformance(result)
        }
      } catch (error) {
        console.error("Error fetching supplier performance:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSupplierPerformance()
  }, [dateRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading supplier performance data...</p>
      </div>
    )
  }

  if (!performance || (!performance.topSuppliers && !performance.bottomSuppliers)) {
    return (
      <div className="flex items-center justify-center h-96 border rounded-md">
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  // Safely handle the data structure
  const topSuppliers = performance.topSuppliers || []
  const bottomSuppliers = performance.bottomSuppliers || []
  const allSuppliers = [...topSuppliers, ...bottomSuppliers]

  const chartData = {
    labels: allSuppliers.map(supplier => supplier.name?.length > 10 ? supplier.name.substring(0, 10) + '...' : supplier.name || 'Unknown'),
    datasets: [
      {
        label: 'Leads',
        data: allSuppliers.map(supplier => supplier.leads || 0),
        backgroundColor: '#8884d8',
        borderColor: '#6366f1',
        borderWidth: 1,
      },
      {
        label: 'Revenue ($)',
        data: allSuppliers.map(supplier => supplier.revenue || 0),
        backgroundColor: '#82ca9d',
        borderColor: '#10b981',
        borderWidth: 1,
      },
      {
        label: 'ROI (%)',
        data: allSuppliers.map(supplier => supplier.roi || 0),
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
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label === 'Revenue ($)') {
              return `${label}: $${value.toLocaleString()}`;
            } else if (label === 'ROI (%)') {
              return `${label}: ${value.toFixed(1)}%`;
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
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Suppliers</CardTitle>
            <CardDescription>Suppliers with the highest ROI</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSuppliers.map((supplier: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{supplier.name || 'Unknown'}</TableCell>
                    <TableCell>{(supplier.leads || 0).toLocaleString()}</TableCell>
                    <TableCell>${(supplier.revenue || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        {(supplier.roi || 0).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Underperforming Suppliers</CardTitle>
            <CardDescription>Suppliers with the lowest ROI</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>ROI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bottomSuppliers.map((supplier: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{supplier.name || 'Unknown'}</TableCell>
                    <TableCell>{(supplier.leads || 0).toLocaleString()}</TableCell>
                    <TableCell>${(supplier.revenue || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                        {(supplier.roi || 0).toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Performance Comparison</CardTitle>
          <CardDescription>Visual comparison of supplier performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
