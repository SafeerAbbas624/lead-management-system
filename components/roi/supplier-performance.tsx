"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { roiApi } from "@/lib/mock-api"

export function SupplierPerformance() {
  const [performance, setPerformance] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSupplierPerformance = async () => {
      try {
        setLoading(true)
        const data = await roiApi.getSupplierPerformance()
        setPerformance(data)
      } catch (error) {
        console.error("Error fetching supplier performance:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSupplierPerformance()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading supplier performance data...</p>
      </div>
    )
  }

  if (!performance) {
    return (
      <div className="flex items-center justify-center h-96 border rounded-md">
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  const chartData = [...performance.topSuppliers, ...performance.bottomSuppliers].map((supplier) => ({
    name: supplier.name,
    leads: supplier.leads,
    revenue: supplier.revenue,
    roi: supplier.roi,
  }))

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
                {performance.topSuppliers.map((supplier: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.leads}</TableCell>
                    <TableCell>${supplier.revenue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        {supplier.roi}%
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
                {performance.bottomSuppliers.map((supplier: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.leads}</TableCell>
                    <TableCell>${supplier.revenue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                        {supplier.roi}%
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} interval={0} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="leads" name="Leads" fill="#8884d8" />
                <Bar dataKey="revenue" name="Revenue ($)" fill="#82ca9d" />
                <Bar dataKey="roi" name="ROI (%)" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
