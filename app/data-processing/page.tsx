import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CsvMapper } from "@/components/data-processing/csv-mapper"
import { DataCleaning } from "@/components/data-processing/data-cleaning"
import { DataNormalization } from "@/components/data-processing/data-normalization"

export const metadata: Metadata = {
  title: "Data Processing | Lead Management System",
  description: "Configure data processing settings for lead management",
}

export default function DataProcessingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Data Processing</h1>
      </div>

      <Tabs defaultValue="mapping" className="space-y-6">
        <TabsList>
          <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
          <TabsTrigger value="cleaning">Data Cleaning</TabsTrigger>
          <TabsTrigger value="normalization">Normalization</TabsTrigger>
        </TabsList>

        <TabsContent value="mapping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CSV Field Mapping</CardTitle>
              <CardDescription>Configure how fields from uploaded files map to system fields</CardDescription>
            </CardHeader>
            <CardContent>
              <CsvMapper />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleaning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Cleaning Rules</CardTitle>
              <CardDescription>Configure rules for cleaning and validating lead data</CardDescription>
            </CardHeader>
            <CardContent>
              <DataCleaning />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="normalization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Normalization</CardTitle>
              <CardDescription>Configure how lead data is normalized and standardized</CardDescription>
            </CardHeader>
            <CardContent>
              <DataNormalization />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
