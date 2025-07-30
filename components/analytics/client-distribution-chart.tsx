"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface ClientData {
  name: string
  leadsReceived: number
  totalRevenue: number
  percentage: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C']

export function ClientDistributionChart() {
  const [data, setData] = useState<ClientData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/analytics/client-distribution')
        if (!response.ok) throw new Error('Failed to fetch data')
        
        const result = await response.json()
        if (result.success) {
          setData(result.data)
        }
      } catch (error) {
        console.error("Error fetching client distribution data:", error)
        
        // Demo data for development
        const clients = [
          'Visha Abbas', 'Safeer Abbas Inc', 'Meesum LLC', 
          'Yasha LLC', 'Zulkifal Abbas LLC', 'Premium Sources'
        ]
        
        let totalLeads = 0
        const clientData = clients.map(name => {
          const leadsReceived = Math.floor(Math.random() * 500) + 100
          const totalRevenue = leadsReceived * (Math.random() * 10 + 5)
          totalLeads += leadsReceived
          
          return {
            name,
            leadsReceived,
            totalRevenue,
            percentage: 0 // Will calculate after
          }
        })
        
        // Calculate percentages
        const dataWithPercentages = clientData.map(client => ({
          ...client,
          percentage: (client.leadsReceived / totalLeads) * 100
        }))
        
        setData(dataWithPercentages.sort((a, b) => b.leadsReceived - a.leadsReceived))
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-blue-600">
            Leads: {data.leadsReceived.toLocaleString()} ({data.percentage.toFixed(1)}%)
          </p>
          <p className="text-sm text-green-600">
            Revenue: ${data.totalRevenue.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }

  const total = data.reduce((sum, item) => sum + item.leadsReceived, 0)
  const totalRevenue = data.reduce((sum, item) => sum + item.totalRevenue, 0)

  return (
    <>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="leadsReceived"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color }}>
                  {value} ({entry.payload.percentage.toFixed(1)}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-medium">Total Distributed Leads</p>
          <p className="text-2xl font-bold">{total.toLocaleString()}</p>
        </div>
        <div>
          <p className="font-medium">Total Revenue Generated</p>
          <p className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="text-sm font-medium">Top Clients:</div>
        <div className="space-y-1">
          {data.slice(0, 3).map((client, index) => (
            <div key={client.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="font-medium">{client.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {client.leadsReceived.toLocaleString()} leads
                </span>
                <span className="font-medium text-green-600">
                  ${client.totalRevenue.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
