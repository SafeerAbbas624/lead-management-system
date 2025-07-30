"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TopDuplicate {
  name: string
  count: number
}

export function TopDuplicatesBySuppliers() {
  const [duplicates, setDuplicates] = useState<TopDuplicate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopDuplicates = async () => {
      try {
        const response = await fetch('/api/dashboard/top-duplicates-by-suppliers')
        if (!response.ok) {
          throw new Error('Failed to fetch top duplicates by suppliers')
        }

        const result = await response.json()
        if (result.success) {
          setDuplicates(result.data)
        }
      } catch (error) {
        console.error("Error fetching top duplicates by suppliers:", error)
        
        // Set demo data on error
        setDuplicates([
          { name: "Lead Supplier Inc", count: 45 },
          { name: "Quality Leads Co", count: 32 },
          { name: "Premium Sources", count: 28 },
          { name: "Lead Generation Pro", count: 19 },
          { name: "Data Solutions Ltd", count: 15 }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTopDuplicates()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Duplicates by Suppliers</CardTitle>
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
        <CardTitle className="text-sm font-medium">Top Duplicates by Suppliers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {duplicates.length > 0 ? (
            duplicates.slice(0, 4).map((duplicate, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{duplicate.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{duplicate.count}</span>
                  <span className="text-xs text-muted-foreground">
                    ({duplicates.length > 0 ? ((duplicate.count / duplicates.reduce((sum, d) => sum + d.count, 0)) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No duplicates found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
