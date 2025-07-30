"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TopClient {
  name: string
  count: number
}

export function TopClients() {
  const [clients, setClients] = useState<TopClient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopClients = async () => {
      try {
        const response = await fetch('/api/dashboard/top-clients')
        if (!response.ok) {
          throw new Error('Failed to fetch top clients')
        }

        const result = await response.json()
        if (result.success) {
          setClients(result.data)
        }
      } catch (error) {
        console.error("Error fetching top clients:", error)
        
        // Set demo data on error
        setClients([
          { name: "Enterprise Corp", count: 320 },
          { name: "Marketing Solutions", count: 280 },
          { name: "Sales Pro Inc", count: 245 },
          { name: "Business Growth Co", count: 190 },
          { name: "Lead Buyers Ltd", count: 155 }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchTopClients()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Clients</CardTitle>
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
        <CardTitle className="text-sm font-medium">Top Clients</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {clients.length > 0 ? (
            clients.slice(0, 4).map((client, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium">{client.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{client.count}</span>
                  <span className="text-xs text-muted-foreground">
                    ({clients.length > 0 ? ((client.count / clients.reduce((sum, c) => sum + c.count, 0)) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No clients found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
