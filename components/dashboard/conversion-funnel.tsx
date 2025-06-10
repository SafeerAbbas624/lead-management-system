"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { FunnelChart, Funnel, Tooltip, LabelList, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

type FunnelData = {
  name: string
  value: number
  percentage: string
}

export function ConversionFunnel() {
  const { data, isLoading, error } = useQuery<FunnelData[]>({
    queryKey: ['conversion-funnel'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/conversion-funnel')
      if (!response.ok) {
        throw new Error('Failed to fetch conversion funnel data')
      }
      const result = await response.json()
      return result.data
    }
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>Lead conversion stages and drop-off rates</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error || !data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>Lead conversion stages and drop-off rates</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">
            {error ? 'Error loading conversion funnel' : 'No data available'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <CardDescription>Lead conversion stages and drop-off rates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip 
                formatter={(value: number, name: string, props: any) => {
                  return [value, props.payload.name]
                }}
                labelFormatter={() => ''}
              />
              <Funnel
                dataKey="value"
                data={data}
                isAnimationActive={true}
                label={{
                  position: 'right',
                  formatter: (value: any) => value.name,
                }}
              >
                <LabelList
                  position="right"
                  fill="#000"
                  stroke="none"
                  dataKey="percentage"
                  formatter={(value: string) => `${value}%`}
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
