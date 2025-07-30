"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

import { SimpleFileUploader } from "@/components/uploads/simple-file-uploader"
import { UploadHistory } from "@/components/uploads/upload-history"
import { ManualFieldMapping } from "@/components/uploads/manual-field-mapping"
import { DataCleaningConfig } from "@/components/uploads/data-cleaning-config"
import { DataNormalizationConfig } from "@/components/uploads/data-normalization-config"
import { LeadTaggingConfig } from "@/components/uploads/lead-tagging-config"
import { UploadProcessor } from "@/components/uploads/upload-processor"
import { RoleGuard } from "@/components/auth/role-guard"
import { Upload, Settings, Database, FileText, Tag, History, CheckCircle } from "lucide-react"

export default function UploadsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState("upload")

  // Configuration states
  const [sessionId, setSessionId] = useState<string>("")
  const [fileHeaders, setFileHeaders] = useState<string[]>([])
  const [autoMapping, setAutoMapping] = useState<Record<string, string>>({})
  const [manualMapping, setManualMapping] = useState<Record<string, string>>({})
  const [cleaningConfig, setCleaningConfig] = useState<any[]>([])
  const [normalizationConfig, setNormalizationConfig] = useState<any[]>([])
  const [taggingConfig, setTaggingConfig] = useState<string[]>([])

  // Session management states
  const [sessionCreated, setSessionCreated] = useState<boolean>(false)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [processedData, setProcessedData] = useState<any>(null)

  // Configuration update handlers
  const handleMappingUpdate = (mapping: Record<string, string>) => {
    setManualMapping(mapping)
  }

  const handleCleaningUpdate = (config: any[]) => {
    setCleaningConfig(config)
  }

  const handleNormalizationUpdate = (config: any[]) => {
    setNormalizationConfig(config)
  }

  const handleTaggingUpdate = (tags: string[]) => {
    console.log('handleTaggingUpdate called with tags:', tags)
    setTaggingConfig(tags)
  }

  const analyzeFile = async () => {
    if (!selectedFile) {
      return
    }

    // Don't create new session if one already exists
    if (sessionCreated && sessionId) {
      return
    }

    setIsAnalyzing(true)

    try {
      // Start processing session with Python backend via frontend API
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/hybrid/start-processing', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to start processing session')
      }

      const result = await response.json()

      if (result.success) {
        // Store session data
        const newSessionId = result.session_id
        setSessionId(newSessionId)
        setSessionCreated(true)
        setProcessedData({ sessionId: newSessionId, ...result })

        // Update headers and mapping
        const headers = result.data_preview?.headers || []
        const fieldMapping = result.field_mapping || {}
        setFileHeaders(headers)
        setAutoMapping(fieldMapping)

        console.log('File analyzed successfully:', { sessionId: newSessionId, headers, fieldMapping })
      } else {
        throw new Error(result.message || 'Failed to start processing')
      }

    } catch (error) {
      console.error('Error analyzing file:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    // Don't auto-switch tabs - let user stay on upload tab
  }

  const handleSessionStart = (sessionId: string, headers: string[], autoMapping: Record<string, string>) => {
    // Only update if we don't already have a session (prevent overrides)
    if (!sessionCreated) {
      console.log('handleSessionStart called with:', { sessionId, headers, autoMapping })
      setSessionId(sessionId)
      setFileHeaders(headers)
      setAutoMapping(autoMapping)
      setSessionCreated(true)
    }
  }

  const handleProcessingComplete = (results: any) => {
    console.log('Processing complete:', results)
    setActiveTab("history")
    setSelectedFile(null)
    // Reset session data
    setSessionId("")
    setFileHeaders([])
    setAutoMapping({})
    setManualMapping({})
    setSessionCreated(false)
    setProcessedData(null)
  }

  return (
    <RoleGuard requiredPermissions={["canUploadLeads", "canEditLeads"]} requireAll={false}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Upload & Process Leads</h1>
            <p className="text-muted-foreground">
              Upload lead files and process them through automated cleaning, mapping, and validation
            </p>
          </div>
          {selectedFile && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFile(null)
                  setSessionCreated(false)
                  setSessionId("")
                  setProcessedData(null)
                  setActiveTab("upload")
                }}
              >
                Clear File
              </Button>
            </div>
          )}
        </div>



        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Files
            </TabsTrigger>
            <TabsTrigger value="mapping" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Field Mapping
            </TabsTrigger>
            <TabsTrigger value="cleaning" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Data Cleaning
            </TabsTrigger>
            <TabsTrigger value="normalization" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Normalization
            </TabsTrigger>
            <TabsTrigger value="tagging" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Lead Tagging
            </TabsTrigger>
            <TabsTrigger value="process" disabled={!selectedFile} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Process Upload
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Lead Files</CardTitle>
              <CardDescription>
                Upload CSV or Excel files containing lead data. After uploading, analyze the file to extract headers and configure processing options.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleFileUploader onFileSelect={handleFileSelect} selectedFile={selectedFile} />

              {/* Analyze File Button */}
              {selectedFile && !sessionCreated && (
                <div className="mt-4">
                  <Button
                    onClick={analyzeFile}
                    disabled={isAnalyzing}
                    className="w-full"
                  >
                    {isAnalyzing ? 'Analyzing File...' : 'Analyze File'}
                  </Button>
                </div>
              )}

              {/* Session Status */}
              {sessionCreated && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">File Analyzed Successfully</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Configure the tabs below and then go to Process Upload to start processing.
                  </p>
                </div>
              )}

              {/* Simple Instructions */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Next Steps:</h4>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. <strong>Upload File</strong> - Select your CSV or Excel file</li>
                  <li>2. <strong>Analyze File</strong> - Click "Analyze File" to process headers</li>
                  <li>3. <strong>Configure Tabs</strong> - Set up field mapping, cleaning, etc.</li>
                  <li>4. <strong>Process Upload</strong> - Go to Process Upload tab to start</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping" className="space-y-6">
          {sessionId && fileHeaders.length > 0 ? (
            <ManualFieldMapping
              sessionId={sessionId}
              headers={fileHeaders}
              autoMapping={autoMapping}
              onMappingUpdate={handleMappingUpdate}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Manual Field Mapping</CardTitle>
                <CardDescription>
                  {sessionId ?
                    `Session ID: ${sessionId} - Headers: ${fileHeaders.length}` :
                    "Upload a file first to configure field mappings"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    {sessionId ?
                      `Session active but no headers found. Headers: ${JSON.stringify(fileHeaders)}` :
                      "Please upload a file in the Upload Files tab to see available headers for mapping."
                    }
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Debug: sessionId={sessionId}, headers={fileHeaders.length}, autoMapping keys={Object.keys(autoMapping).length}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cleaning" className="space-y-6">
          <DataCleaningConfig
            sessionId={sessionId}
            onConfigUpdate={handleCleaningUpdate}
          />
        </TabsContent>

        <TabsContent value="normalization" className="space-y-6">
          <DataNormalizationConfig
            sessionId={sessionId}
            onConfigUpdate={handleNormalizationUpdate}
          />
        </TabsContent>

        <TabsContent value="tagging" className="space-y-6">
          <LeadTaggingConfig
            sessionId={sessionId}
            onConfigUpdate={handleTaggingUpdate}
          />
        </TabsContent>

        <TabsContent value="process" className="space-y-6">
          {selectedFile ? (
            <>
              {/* Debug info */}
              <div className="text-xs text-muted-foreground p-2 bg-gray-100 rounded">
                Debug: taggingConfig = {JSON.stringify(taggingConfig)}
              </div>
              <UploadProcessor
                file={selectedFile}
                onComplete={handleProcessingComplete}
                onSessionStart={handleSessionStart}
                manualMapping={manualMapping}
                cleaningConfig={cleaningConfig}
                normalizationConfig={normalizationConfig}
                taggingConfig={taggingConfig}
                autoStartProcessing={false}
                sessionId={sessionId}
                sessionCreated={sessionCreated}
                processedData={processedData}
              />
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No File Selected</CardTitle>
                <CardDescription>Please select a file from the Upload Files tab to begin processing</CardDescription>
              </CardHeader>
            </Card>
          )}
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
    </RoleGuard>
  )
}
