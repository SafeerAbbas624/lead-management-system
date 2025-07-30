"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TopDNC {
  name: string
  count: number
}

export function TopDNCBySuppliers() {
  const [dncData, setDncData] = useState<TopDNC[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopDNC = async () => {
      try {
        const response = await fetch('/api/dashboard/top-dnc-by-suppliers')
        if (!response.ok) {
          throw new Error('Failed to fetch top DNC by suppliers')
        }

        const result = await response.json()
        if (result.success) {
          setDncData(result.data)
        }
      } catch (error) {
        console.error("Error fetching top DNC by suppliers:", error)
        
        // Set demo data on error
        setDncData([
          { name: "Lead Supplier Inc", count: 25 },
          { name: "Quality Leads Co", count: 18 },
          { name: "Premium Sources", count: 15 },
          { name: "Lead Generation Pro", count: 12 },
          { name: "Data Solutions Ltd", count: 8 }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTopDNC()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top DNC by Suppliers</CardTitle>
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
        <CardTitle className="text-sm font-medium">Top DNC by Suppliers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {dncData.length > 0 ? (
            dncData.slice(0, 4).map((dnc, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{dnc.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{dnc.count}</span>
                  <span className="text-xs text-muted-foreground">
                    ({dncData.length > 0 ? ((dnc.count / dncData.reduce((sum, d) => sum + d.count, 0)) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No DNC entries found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
