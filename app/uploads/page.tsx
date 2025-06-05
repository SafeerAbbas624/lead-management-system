import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUploader } from "@/components/uploads/file-uploader"
import { UploadHistory } from "@/components/uploads/upload-history"
import { CsvMapper } from "@/components/data-processing/csv-mapper"
import { DataCleaning } from "@/components/data-processing/data-cleaning"
import { DataNormalization } from "@/components/data-processing/data-normalization"
import { LeadTagging } from "@/components/leads/lead-tagging"

export const metadata: Metadata = {
  title: "Upload Leads | Lead Management System",
  description: "Upload and process lead files",
}

export default function UploadsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Upload & Process Leads</h1>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
          <TabsTrigger value="cleaning">Data Cleaning</TabsTrigger>
          <TabsTrigger value="normalization">Data Normalization</TabsTrigger>
          <TabsTrigger value="tagging">Lead Tagging</TabsTrigger>
          <TabsTrigger value="history">Upload History</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Lead Files</CardTitle>
              <CardDescription>Upload CSV, XLSX, or JSON files containing lead data</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Field Mapping</CardTitle>
              <CardDescription>Map your file fields to system fields using automatic NLP mapping</CardDescription>
            </CardHeader>
            <CardContent>
              <CsvMapper />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleaning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Cleaning</CardTitle>
              <CardDescription>Configure data cleaning and validation settings</CardDescription>
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
              <CardDescription>Configure data normalization and formatting settings</CardDescription>
            </CardHeader>
            <CardContent>
              <DataNormalization />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tagging" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lead Tagging</CardTitle>
              <CardDescription>Apply tags to categorize and organize your leads</CardDescription>
            </CardHeader>
            <CardContent>
              <LeadTagging />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload History</CardTitle>
              <CardDescription>View and manage your previous file uploads</CardDescription>
            </CardHeader>
            <CardContent>
              <UploadHistory />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
