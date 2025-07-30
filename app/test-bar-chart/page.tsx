"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from "recharts"

const testData = [
  { name: "Supplier A", roi: 50, profit: 300 },
  { name: "Supplier B", roi: -25, profit: -150 },
  { name: "Supplier C", roi: 75, profit: 500 },
  { name: "Supplier D", roi: -10, profit: -50 },
  { name: "Supplier E", roi: 30, profit: 200 }
]

export default function TestBarChartPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Test Bar Chart - Positive/Negative Values</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Test ROI Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={testData}
                margin={{
                  top: 20,
                  right: 40,
                  left: 40,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  domain={['dataMin', 'dataMax']}
                  allowDataOverflow={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={['dataMin', 'dataMax']}
                  allowDataOverflow={false}
                />
                <Tooltip />
                <Legend />
                <ReferenceLine yAxisId="left" y={0} stroke="#666" strokeDasharray="2 2" />
                <ReferenceLine yAxisId="right" y={0} stroke="#666" strokeDasharray="2 2" />
                <Bar yAxisId="left" dataKey="roi" name="ROI (%)" fill="#a78bfa">
                  {testData.map((entry, index) => (
                    <Cell key={`roi-cell-${index}`} fill={entry.roi >= 0 ? "#a78bfa" : "#f87171"} />
                  ))}
                </Bar>
                <Bar yAxisId="right" dataKey="profit" name="Profit ($)" fill="#60a5fa">
                  {testData.map((entry, index) => (
                    <Cell key={`profit-cell-${index}`} fill={entry.profit >= 0 ? "#60a5fa" : "#fbbf24"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
