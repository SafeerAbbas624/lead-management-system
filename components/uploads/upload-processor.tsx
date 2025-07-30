"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, AlertCircle, Clock, Upload, Database, FileText, Settings, Tag, Eye, DollarSign } from "lucide-react"

interface UploadStep {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  message?: string
  data?: any
}

interface Supplier {
  id: number
  name: string
  lead_cost: number
}

interface UploadProcessorProps {
  file: File | null
  onComplete?: (results: any) => void
  onSessionStart?: (sessionId: string, headers: string[], autoMapping: Record<string, string>) => void
  manualMapping?: Record<string, string>
  cleaningConfig?: any[]
  normalizationConfig?: any[]
  taggingConfig?: any[]
  autoStartProcessing?: boolean
  sessionId?: string
  sessionCreated?: boolean
  processedData?: any
}

export function UploadProcessor({
  file,
  onComplete,
  onSessionStart,
  manualMapping = {},
  cleaningConfig = [],
  normalizationConfig = [],
  taggingConfig = [],
  autoStartProcessing = false,
  sessionId: propSessionId = "",
  sessionCreated: propSessionCreated = false,
  processedData: propProcessedData = null
}: UploadProcessorProps) {
  const [steps, setSteps] = useState<UploadStep[]>([
    { id: 'field-mapping', name: 'Check Manual Field Mapping', status: 'pending' },
    { id: 'data-cleaning', name: 'Apply Data Cleaning Rules', status: 'pending' },
    { id: 'data-normalization', name: 'Normalize Data Format', status: 'pending' },
    { id: 'lead-tagging', name: 'Apply Lead Tags', status: 'pending' },
    { id: 'auto-mapping', name: 'Auto Field Mapping', status: 'pending' },
    { id: 'duplicate-check', name: 'Check for Duplicates', status: 'pending' },
    { id: 'preview', name: 'Preview Processed Data', status: 'pending' },
    { id: 'supplier-selection', name: 'Select Supplier & Cost', status: 'pending' },
    { id: 'dnc-check', name: 'Check DNC Lists', status: 'pending' },
    { id: 'upload', name: 'Upload to Database', status: 'pending' },
  ])

  const [currentStep, setCurrentStep] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  // Use props for session data (managed by parent)
  const sessionId = propSessionId
  const sessionCreated = propSessionCreated
  const processedData = propProcessedData
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null)
  const [totalSheetCost, setTotalSheetCost] = useState<number>(0)
  const [costMode, setCostMode] = useState<'per_lead' | 'total_sheet'>('total_sheet')
  const [previewData, setPreviewData] = useState<any[]>([])
  const [duplicateStats, setDuplicateStats] = useState<any>(null)
  const [dncStats, setDncStats] = useState<any>(null)

  const { toast } = useToast()

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data)
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    }
  }

  const updateStepStatus = (stepId: string, status: UploadStep['status'], message?: string, data?: any) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, message, data }
        : step
    ))
  }

  const processStep = async (stepIndex: number) => {
    const step = steps[stepIndex]
    updateStepStatus(step.id, 'processing')

    try {
      switch (step.id) {
        case 'field-mapping':
          await checkManualFieldMapping()
          break
        case 'data-cleaning':
          await applyDataCleaning()
          break
        case 'data-normalization':
          await normalizeData()
          break
        case 'lead-tagging':
          await applyLeadTagging()
          break
        case 'auto-mapping':
          await performAutoMapping()
          break
        case 'duplicate-check':
          await checkDuplicates()
          break
        case 'preview':
          await generatePreview()
          break
        case 'supplier-selection':
          await handleSupplierSelection()
          break
        case 'dnc-check':
          await checkDNC()
          break
        case 'upload':
          await uploadToDatabase()
          break
      }
      
      updateStepStatus(step.id, 'completed', 'Step completed successfully')
      
      if (stepIndex < steps.length - 1) {
        setCurrentStep(stepIndex + 1)
        setTimeout(() => processStep(stepIndex + 1), 1000)
      } else {
        setIsProcessing(false)
        toast({
          title: "Upload Complete",
          description: "All leads have been processed and uploaded successfully.",
        })
        onComplete?.(processedData)
      }
    } catch (error) {
      updateStepStatus(step.id, 'error', error instanceof Error ? error.message : 'Step failed')
      setIsProcessing(false)
      toast({
        title: "Processing Error",
        description: `Failed at step: ${step.name}`,
        variant: "destructive",
      })
    }
  }

  const sendConfigurationToBackend = async () => {
    if (!sessionId) return

    console.log('sendConfigurationToBackend called with:', {
      sessionId,
      manualMapping: Object.keys(manualMapping).length,
      cleaningConfig: cleaningConfig.length,
      normalizationConfig: normalizationConfig.length,
      taggingConfig: taggingConfig.length,
      taggingConfigData: taggingConfig
    })

    try {
      // Send manual field mapping
      if (Object.keys(manualMapping).length > 0) {
        await fetch('/api/hybrid/update-processing-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            config_type: 'manual_field_mapping',
            config_data: manualMapping
          })
        })
      }

      // Send data cleaning config
      if (cleaningConfig.length > 0) {
        await fetch('/api/hybrid/update-processing-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            config_type: 'data_cleaning_rules',
            config_data: cleaningConfig
          })
        })
      }

      // Send normalization config
      if (normalizationConfig.length > 0) {
        await fetch('/api/hybrid/update-processing-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            config_type: 'data_normalization_rules',
            config_data: normalizationConfig
          })
        })
      }

      // Send tagging config
      if (taggingConfig.length > 0) {
        console.log('Sending tagging config to backend:', taggingConfig)
        await fetch('/api/hybrid/update-processing-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            config_type: 'lead_tagging_rules',
            config_data: taggingConfig
          })
        })
      } else {
        console.log('No tagging config to send')
      }

      console.log('Configuration sent to backend successfully')
    } catch (error) {
      console.error('Error sending configuration to backend:', error)
    }
  }



  const startActualProcessing = async () => {
    if (!sessionId) {
      toast({
        title: "No Session",
        description: "Please analyze the file first.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    // Send configuration to backend first
    await sendConfigurationToBackend()

    // Then start processing
    await processAllSteps(sessionId)
  }

  const startProcessing = async () => {
    // For backward compatibility, just call analyzeFile
    await analyzeFile()
  }

  // Hybrid processing functions
  const processAllSteps = async (sessionId: string) => {
    try {
      // Process steps automatically until supplier selection
      const stepsToProcess = [
        'field-mapping',
        'data-cleaning',
        'data-normalization',
        'lead-tagging',
        'auto-mapping',
        'duplicate-check',
        'preview'
      ]

      for (let i = 0; i < stepsToProcess.length; i++) {
        const stepId = stepsToProcess[i]
        setCurrentStep(i)
        updateStepStatus(stepId, 'processing')

        try {
          const response = await fetch('/api/hybrid/process-step', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionId,
              step: stepId
            })
          })

          if (!response.ok) {
            throw new Error(`Failed to process step ${stepId}`)
          }

          const result = await response.json()

          if (result.success) {
            updateStepStatus(stepId, 'completed', result.message, result.data)

            // Special handling for specific steps
            if (stepId === 'duplicate-check') {
              setDuplicateStats(result.data?.duplicate_stats)
            } else if (stepId === 'preview') {
              setPreviewData(result.data?.preview || [])
            }
          } else {
            throw new Error(result.message || `Step ${stepId} failed`)
          }

        } catch (error) {
          updateStepStatus(stepId, 'error', error instanceof Error ? error.message : 'Step failed')
          throw error
        }

        // Small delay between steps
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Now wait for supplier selection
      updateStepStatus('supplier-selection', 'processing', 'Waiting for supplier selection...')
      setCurrentStep(7) // Supplier selection step

    } catch (error) {
      console.error('Error in automatic processing:', error)
      setIsProcessing(false)
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : 'Processing failed',
        variant: "destructive",
      })
    }
  }

  const continueAfterSupplierSelection = async () => {
    if (!processedData?.sessionId || !selectedSupplier || !totalSheetCost) {
      toast({
        title: "Missing Information",
        description: "Please select a supplier and set the total sheet cost.",
        variant: "destructive",
      })
      return
    }

    try {
      // Update supplier information in backend
      console.log('Sending to backend:', {
        session_id: processedData.sessionId,
        supplier_id: selectedSupplier,
        total_sheet_cost: totalSheetCost,
        cost_mode: costMode
      })

      const updateResponse = await fetch('/api/hybrid/update-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: processedData.sessionId,
          supplier_id: selectedSupplier,
          total_sheet_cost: totalSheetCost,
          cost_mode: costMode
        })
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to update supplier information')
      }

      // Continue with remaining steps
      const remainingSteps = ['dnc-check', 'upload']

      for (let i = 0; i < remainingSteps.length; i++) {
        const stepId = remainingSteps[i]
        const stepIndex = 8 + i // DNC check is step 8, upload is step 9
        setCurrentStep(stepIndex)
        updateStepStatus(stepId, 'processing')

        try {
          const response = await fetch('/api/hybrid/process-step', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: processedData.sessionId,
              step: stepId
            })
          })

          if (!response.ok) {
            throw new Error(`Failed to process step ${stepId}`)
          }

          const result = await response.json()

          if (result.success) {
            updateStepStatus(stepId, 'completed', result.message, result.data)

            if (stepId === 'dnc-check') {
              setDncStats(result.data?.dnc_stats)
            }
          } else {
            throw new Error(result.message || `Step ${stepId} failed`)
          }

        } catch (error) {
          updateStepStatus(stepId, 'error', error instanceof Error ? error.message : 'Step failed')
          throw error
        }

        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Processing complete
      setIsProcessing(false)
      toast({
        title: "Upload Complete",
        description: "All leads have been processed and uploaded successfully.",
      })
      onComplete?.(processedData)

    } catch (error) {
      console.error('Error in final processing steps:', error)
      setIsProcessing(false)
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : 'Final processing failed',
        variant: "destructive",
      })
    }
  }

  // Legacy step implementation functions (kept for fallback)
  const checkManualFieldMapping = async () => {
    const response = await fetch('/api/field-mapping/rules')
    const mappingRules = await response.json()
    updateStepStatus('field-mapping', 'processing', 'Checking manual field mapping rules...', mappingRules)
  }

  const applyDataCleaning = async () => {
    // Apply data cleaning rules
    const response = await fetch('/api/data-cleaning/rules')
    const cleaningRules = await response.json()
    updateStepStatus('data-cleaning', 'processing', 'Applying data cleaning rules...', cleaningRules)
  }

  const normalizeData = async () => {
    // Apply data normalization
    const response = await fetch('/api/data-normalization/rules')
    const normalizationRules = await response.json()
    updateStepStatus('data-normalization', 'processing', 'Normalizing data format...', normalizationRules)
  }

  const applyLeadTagging = async () => {
    // Apply lead tagging rules
    const response = await fetch('/api/lead-tagging/rules')
    const taggingRules = await response.json()
    updateStepStatus('lead-tagging', 'processing', 'Applying lead tags...', taggingRules)
  }

  const performAutoMapping = async () => {
    // Perform auto field mapping
    const formData = new FormData()
    formData.append('file', file!)
    
    const response = await fetch('/api/auto-mapping', {
      method: 'POST',
      body: formData,
    })
    
    const mappingResult = await response.json()
    setProcessedData(mappingResult)
    updateStepStatus('auto-mapping', 'processing', 'Auto-mapping completed', mappingResult)
  }

  const checkDuplicates = async () => {
    // Check for duplicates
    const response = await fetch('/api/check-duplicates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: processedData }),
    })
    
    const duplicateResult = await response.json()
    setDuplicateStats(duplicateResult)
    updateStepStatus('duplicate-check', 'processing', `Found ${duplicateResult.duplicateCount} duplicates`, duplicateResult)
  }

  const generatePreview = async () => {
    // Generate preview of processed data
    if (processedData && processedData.data) {
      const preview = processedData.data.slice(0, 10) // Show first 10 rows
      setPreviewData(preview)
      updateStepStatus('preview', 'processing', `Preview ready (${processedData.data.length} total rows)`, preview)
    }
  }

  const handleSupplierSelection = async () => {
    // This step requires user interaction
    updateStepStatus('supplier-selection', 'processing', 'Waiting for supplier selection...')
    // This will be handled by user interaction
  }

  const checkDNC = async () => {
    // Check against DNC lists
    const response = await fetch('/api/dnc/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: processedData }),
    })
    
    const dncResult = await response.json()
    setDncStats(dncResult)
    updateStepStatus('dnc-check', 'processing', `Found ${dncResult.dncMatches} DNC matches`, dncResult)
  }

  const uploadToDatabase = async () => {
    // Final upload to database
    const uploadData = {
      ...processedData,
      supplierId: selectedSupplier,
      totalSheetCost: totalSheetCost,
      duplicateStats,
      dncStats,
    }

    const response = await fetch('/api/upload/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(uploadData),
    })
    
    const result = await response.json()
    updateStepStatus('upload', 'processing', 'Upload completed successfully', result)
  }

  const getStepIcon = (status: UploadStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  const getStepBadge = (status: UploadStep['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>
      case 'processing':
        return <Badge variant="default" className="bg-blue-500">Processing</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* File Info */}
      {file && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              File Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <Label>File Name</Label>
                <p className="font-medium">{file.name}</p>
              </div>
              <div>
                <Label>File Size</Label>
                <p className="font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <div>
                <Label>File Type</Label>
                <p className="font-medium">{file.type || 'Unknown'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Steps</CardTitle>
          <CardDescription>
            Follow the progress of your lead upload and processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4 p-3 rounded-lg border">
                <div className="flex-shrink-0">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{step.name}</h4>
                    {getStepBadge(step.status)}
                  </div>
                  {step.message && (
                    <p className="text-sm text-muted-foreground mt-1">{step.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Supplier Selection */}
      {steps.find(s => s.id === 'supplier-selection')?.status === 'processing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Supplier & Cost Configuration
            </CardTitle>
            <CardDescription>
              Select the supplier and set the cost per lead for this upload
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier">Select Supplier</Label>
                <Select value={selectedSupplier?.toString()} onValueChange={(value) => setSelectedSupplier(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name} (Default: ${supplier.lead_cost})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cost">
                  {costMode === 'per_lead' ? 'Cost per Lead ($)' : 'Total Sheet Cost ($)'}
                </Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={totalSheetCost}
                  onChange={(e) => setTotalSheetCost(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {costMode === 'per_lead'
                    ? 'File contains cost data - this will be used as fallback for missing values'
                    : `Will be divided among ${processedData?.data_preview?.row_count || 0} leads (≈$${processedData?.data_preview?.row_count ? (totalSheetCost / processedData.data_preview.row_count).toFixed(4) : '0.0000'} per lead)`
                  }
                </p>
              </div>
            </div>

            {/* Cost Mode Override */}
            <div className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
              <Label className="text-sm font-medium">Cost Mode:</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="total_sheet"
                  name="costMode"
                  checked={costMode === 'total_sheet'}
                  onChange={() => setCostMode('total_sheet')}
                />
                <Label htmlFor="total_sheet" className="text-sm">Divide total cost among all leads</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="per_lead"
                  name="costMode"
                  checked={costMode === 'per_lead'}
                  onChange={() => setCostMode('per_lead')}
                />
                <Label htmlFor="per_lead" className="text-sm">Use file costs (fallback to entered cost)</Label>
              </div>
            </div>
            <Button
              onClick={() => {
                if (selectedSupplier && totalSheetCost > 0) {
                  const costDescription = costMode === 'per_lead'
                    ? `Cost: $${totalSheetCost} (fallback for missing file costs)`
                    : `Total Cost: $${totalSheetCost} (≈$${(totalSheetCost / (processedData?.data_preview?.row_count || 1)).toFixed(4)} per lead)`

                  updateStepStatus('supplier-selection', 'completed', `Supplier selected: ${suppliers.find(s => s.id === selectedSupplier)?.name}, ${costDescription}`)
                  continueAfterSupplierSelection()
                } else {
                  toast({
                    title: "Missing Information",
                    description: "Please select a supplier and set the total sheet cost.",
                    variant: "destructive",
                  })
                }
              }}
              disabled={!selectedSupplier || totalSheetCost <= 0}
            >
              Continue Processing
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview Data */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Data Preview
            </CardTitle>
            <CardDescription>
              Preview of the first 10 rows after processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {previewData[0] && Object.keys(previewData[0]).map((key) => (
                      <th key={key} className="text-left p-2 font-medium">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index} className="border-b">
                      {Object.values(row).map((value: any, cellIndex) => (
                        <td key={cellIndex} className="p-2">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Control Buttons */}
      <div className="flex gap-4">
        {!sessionCreated ? (
          <div className="p-4 text-center text-muted-foreground">
            <p>Please analyze the file first in the Upload Files tab.</p>
          </div>
        ) : !isProcessing ? (
          <Button
            onClick={startActualProcessing}
            disabled={!sessionId}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Start Processing
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              setIsProcessing(false)
              toast({
                title: "Processing Stopped",
                description: "Upload processing has been cancelled.",
              })
            }}
          >
            Cancel Processing
          </Button>
        )}

        {sessionCreated && !isProcessing && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            Ready to process - All configurations will be applied
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processing Progress</span>
            <span>{Math.round((currentStep / steps.length) * 100)}%</span>
          </div>
          <Progress value={(currentStep / steps.length) * 100} />
        </div>
      )}
    </div>
  )
}
