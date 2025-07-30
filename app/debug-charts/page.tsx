"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugChartsPage() {
  const [sourceData, setSourceData] = useState(null)
  const [roiData, setRoiData] = useState(null)
  const [sourceError, setSourceError] = useState(null)
  const [roiError, setRoiError] = useState(null)

  useEffect(() => {
    // Test Source Performance API
    fetch('/api/dashboard/source-performance')
      .then(res => res.json())
      .then(data => {
        console.log('Source Performance Data:', data)
        setSourceData(data)
      })
      .catch(err => {
        console.error('Source Performance Error:', err)
        setSourceError(err.message)
      })

    // Test Supplier ROI API
    fetch('/api/dashboard/supplier-roi')
      .then(res => res.json())
      .then(data => {
        console.log('Supplier ROI Data:', data)
        setRoiData(data)
      })
      .catch(err => {
        console.error('Supplier ROI Error:', err)
        setRoiError(err.message)
      })
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Debug Charts Data</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Source Performance API Response</CardTitle>
            <CardDescription>Raw data from /api/dashboard/source-performance</CardDescription>
          </CardHeader>
          <CardContent>
            {sourceError && (
              <div className="text-red-500 mb-4">Error: {sourceError}</div>
            )}
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(sourceData, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supplier ROI API Response</CardTitle>
            <CardDescription>Raw data from /api/dashboard/supplier-roi</CardDescription>
          </CardHeader>
          <CardContent>
            {roiError && (
              <div className="text-red-500 mb-4">Error: {roiError}</div>
            )}
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(roiData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
