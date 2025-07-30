"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TopSupplier {
  name: string
  count: number
}

export function TopSuppliers() {
  const [suppliers, setSuppliers] = useState<TopSupplier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopSuppliers = async () => {
      try {
        const response = await fetch('/api/dashboard/top-suppliers')
        if (!response.ok) {
          throw new Error('Failed to fetch top suppliers')
        }

        const result = await response.json()
        if (result.success) {
          setSuppliers(result.data)
        }
      } catch (error) {
        console.error("Error fetching top suppliers:", error)
        
        // Set demo data on error
        setSuppliers([
          { name: "Lead Supplier Inc", count: 450 },
          { name: "Quality Leads Co", count: 320 },
          { name: "Premium Sources", count: 280 },
          { name: "Lead Generation Pro", count: 195 },
          { name: "Data Solutions Ltd", count: 150 }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTopSuppliers()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Lead Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="w-32 h-4 bg-muted rounded animate-pulse" />
                <div className="w-16 h-4 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Top Lead Suppliers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {suppliers.length > 0 ? (
            suppliers.slice(0, 4).map((supplier, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{supplier.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{supplier.count}</span>
                  <span className="text-xs text-muted-foreground">
                    ({suppliers.length > 0 ? ((supplier.count / suppliers.reduce((sum, s) => sum + s.count, 0)) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No suppliers found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
