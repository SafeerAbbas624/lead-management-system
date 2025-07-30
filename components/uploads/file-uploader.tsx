"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, FileSpreadsheet, Upload, CheckCircle, XCircle, RefreshCw, Eye, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

interface FileData {
  name: string
  size: number
  type: string
  content: any[]
  headers: string[]
}

interface MappingRule {
  sourceField: string
  targetField: string
  confidence: number
  isRequired: boolean
}

interface DuplicateCheck {
  field: string
  duplicateCount: number
  totalChecked: number
}

interface ProcessingStep {
  id: string
  name: string
  status: "pending" | "processing" | "completed" | "error"
  message?: string
}

interface ProcessingResult {
  success: boolean
  message: string
  stats: {
    total: number
    cleaned: number
    duplicates: number
    dnc: number
    inserted: number
  }
  batch_id: string
}

const SYSTEM_FIELDS = [
  { value: "email", label: "Email", required: true, description: "Email address of the lead" },
  { value: "firstname", label: "First Name", required: true, description: "First name of the contact" },
  { value: "lastname", label: "Last Name", required: true, description: "Last name of the contact" },
  { value: "phone", label: "Phone", required: false, description: "Phone number or mobile number" },
  { value: "companyname", label: "Company Name", required: false, description: "Company or business name" },
  { value: "address", label: "Address", required: false, description: "Address or street address" },
  { value: "city", label: "City", required: false, description: "City" },
  { value: "state", label: "State", required: false, description: "State or province" },
  { value: "zipcode", label: "Zip Code", required: false, description: "Zip code or postal code" },
  { value: "country", label: "Country", required: false, description: "Country" },
  { value: "taxid", label: "Tax ID", required: false, description: "Tax ID or EIN number" },
  { value: "loanamount", label: "Loan Amount", required: false, description: "Loan amount or requested amount" },
  { value: "revenue", label: "Revenue", required: false, description: "Annual revenue or sales" },
  { value: "dnc", label: "Do Not Call Status", required: false, description: "Do not call status or flag" },
]

// DNC patterns for auto-detection
const DNC_PATTERNS = [
  "dnc",
  "is_dnc",
  "do_not_call",
  "dnc_flag",
  "do not call",
  "dnc status",
  "call status",
  "contact status"
]

// Valid DNC values
const DNC_VALUES = new Set(["yes", "y", "true", "1", "do not call", "dnc"])

const BACKEND_URL = "http://localhost:8000"

interface FileUploaderProps {
  onFileSelect?: (file: File) => void
}

export function FileUploader({ onFileSelect }: FileUploaderProps) {
  const router = useRouter()
  const { toast } = useToast()

  // File upload state
  const [file, setFile] = useState<File | null>(null)
  const [fileData, setFileData] = useState<FileData | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Processing workflow state
  const [currentStep, setCurrentStep] = useState<"upload" | "duplicate-check" | "mapping" | "preview" | "processing">(
    "upload",
  )
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: "parse", name: "Parse File", status: "pending" },
    { id: "duplicate", name: "Check Duplicates", status: "pending" },
    { id: "mapping", name: "Auto Field Mapping", status: "pending" },
    { id: "cleaning", name: "Data Cleaning", status: "pending" },
    { id: "normalization", name: "Data Normalization", status: "pending" },
    { id: "tagging", name: "Lead Tagging", status: "pending" },
    { id: "upload", name: "Upload to Database", status: "pending" },
  ])

  // Duplicate check state
  const [duplicateChecks, setDuplicateChecks] = useState<DuplicateCheck[]>([])
  const [duplicateCheckLoading, setDuplicateCheckLoading] = useState(false)

  // Mapping state
  const [mappingRules, setMappingRules] = useState<MappingRule[]>([])
  const [mappingLoading, setMappingLoading] = useState(false)

  // Preview state
  const [previewData, setPreviewData] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)

  // Settings state
  const [cleaningSettings, setCleaningSettings] = useState({
    trimWhitespace: true,
    normalizeCase: true,
    removeDuplicates: true,
    validateEmail: true,
    validatePhone: true,
    correctCommonTypos: true,
    flagMissingFields: true,
  })

  const [normalizationSettings, setNormalizationSettings] = useState({
    nameFormat: "proper",
    phoneFormat: "standard",
    emailFormat: "lowercase",
    dedupeStrategy: "email_phone",
  })

  const [taggingSettings, setTaggingSettings] = useState({
    defaultTags: [] as string[],
    autoTagRules: [] as any[],
  })

  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null)
  const [showDuplicates, setShowDuplicates] = useState(false)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const selectedFile = e.target.files?.[0] || null
      console.log("File selected:", selectedFile ? {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type
      } : "No file selected");

      if (!selectedFile) {
        console.warn("No file was selected");
        return;
      }

      // Validate file type
      const validTypes = ['.csv', '.xlsx', '.json'];
      const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
      if (!validTypes.includes(fileExtension)) {
        console.error("Invalid file type:", fileExtension);
        setError(`Invalid file type. Please upload a ${validTypes.join(' or ')} file.`);
        return;
      }

      setFile(selectedFile)
      setFileData(null)
      setError(null)
      setCurrentStep("upload")

      // Call the onFileSelect callback if provided
      if (onFileSelect) {
        onFileSelect(selectedFile)
      }

      // Reset all states
      setDuplicateChecks([])
      setMappingRules([])
      setPreviewData([])
      setShowPreview(false)
    } catch (error: any) {
      console.error("Error in handleFileChange:", error);
      setError("Failed to process selected file");
    }
  }, [])

  const parseFile = async (file: File): Promise<FileData> => {
    return new Promise((resolve, reject) => {
      try {
        console.log("Starting file parse for:", file.name);
        const reader = new FileReader()

        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string | ArrayBuffer
            if (!content) {
              throw new Error("No content read from file");
            }

            console.log("File content read successfully");
            let parsedData: any[] = []
            let headers: string[] = []

            console.log("File parsing started:", {
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type
            });

            if (file.name.endsWith(".csv")) {
              const textContent = content as string;
              console.log("Content length:", textContent.length);
              const lines = textContent.split("\n").filter((line) => line.trim())
              console.log("CSV parsing:", {
                totalLines: lines.length,
                firstLine: lines[0],
                secondLine: lines[1]
              });

              if (lines.length === 0) {
                throw new Error("CSV file is empty");
              }

              if (lines.length === 1) {
                throw new Error("CSV file has no data rows");
              }

              headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
              console.log("CSV headers:", headers);

              if (headers.length === 0) {
                throw new Error("No headers found in CSV file");
              }

              parsedData = lines.slice(1).map((line) => {
                const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
                const row: any = {}
                headers.forEach((header, index) => {
                  row[header] = values[index] || ""
                })
                return row
              })
              console.log("CSV parsing results:", {
                totalRows: parsedData.length,
                firstRow: parsedData[0],
                headersFound: headers.length
              });
            } else if (file.name.endsWith(".xlsx")) {
              try {
                const workbook = XLSX.read(content, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
                console.log("XLSX parsing:", {
                  sheets: workbook.SheetNames,
                  selectedSheet: firstSheetName,
                  rowCount: jsonData.length
                });

                if (jsonData.length === 0) {
                  throw new Error("Excel file is empty");
                }

                headers = Object.keys(jsonData[0]);
                console.log("XLSX headers:", headers);

                if (headers.length === 0) {
                  throw new Error("No headers found in Excel file");
                }

                parsedData = jsonData;
                console.log("XLSX parsing results:", {
                  totalRows: parsedData.length,
                  firstRow: parsedData[0],
                  headersFound: headers.length
                });
              } catch (error: any) {
                console.error("XLSX parsing error:", error);
                throw new Error(`Failed to parse Excel file: ${error.message}`);
              }
            } else if (file.name.endsWith(".json")) {
              const textContent = content as string;
              const jsonData = JSON.parse(textContent)
              console.log("JSON parsing:", {
                dataType: typeof jsonData,
                isArray: Array.isArray(jsonData),
                length: Array.isArray(jsonData) ? jsonData.length : 0
              });

              if (!Array.isArray(jsonData) || jsonData.length === 0) {
                throw new Error("JSON file must contain an array of objects");
              }

              headers = Object.keys(jsonData[0])
              console.log("JSON headers:", headers);
              parsedData = jsonData
              console.log("JSON parsing results:", {
                totalRows: parsedData.length,
                firstRow: parsedData[0],
                headersFound: headers.length
              });
            } else {
              throw new Error("Unsupported file type");
            }

            const result = {
              name: file.name,
              size: file.size,
              type: file.type,
              content: parsedData,
              headers: headers,
            };
            console.log("Final parsed result:", {
              fileName: result.name,
              totalRows: result.content.length,
              headers: result.headers
            });

            resolve(result)
          } catch (error: any) {
            console.error("Parse error:", error)
            reject(new Error(`Failed to parse file: ${error.message}`))
          }
        }

        reader.onerror = () => {
          console.error("FileReader error");
          reject(new Error("Failed to read file"))
        }

        // For XLSX files, we need to read as ArrayBuffer
        if (file.name.endsWith(".xlsx")) {
          reader.readAsArrayBuffer(file)
        } else {
          reader.readAsText(file)
        }
      } catch (error: any) {
        console.error("Error in parseFile:", error);
        reject(new Error(`Failed to process file: ${error.message}`))
      }
    })
  }

  const updateProcessingStep = (stepId: string, status: ProcessingStep["status"], message?: string) => {
    setProcessingSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, status, message } : step)))
  }

  const handleFileUpload = async () => {
    if (!file) {
      setError("Please select a file to upload")
      return
    }

    console.log("Starting file upload process for:", {
      name: file.name,
      size: file.size,
      type: file.type
    });

    setUploading(true)
    setProgress(10)
    setError(null)

    try {
      // Step 1: Parse file
      updateProcessingStep("parse", "processing")
      setProgress(20)

      console.log("About to parse file...");
      const parsedData = await parseFile(file)
      console.log("File parsed successfully:", {
        headers: parsedData.headers,
        rowCount: parsedData.content.length
      });

      setFileData(parsedData)
      updateProcessingStep("parse", "completed", `Parsed ${parsedData.content.length} rows`)

      setProgress(30)
      setCurrentStep("duplicate-check")

      // Step 2: Check duplicates
      await checkDuplicates(parsedData)
    } catch (err: any) {
      console.error("File upload error:", err);
      setError(err.message || "Failed to process file")
      updateProcessingStep("parse", "error", err.message)
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const checkDuplicates = async (data: FileData) => {
    setDuplicateCheckLoading(true)
    updateProcessingStep("duplicate", "processing")

    try {
      const response = await fetch(`${BACKEND_URL}/check-duplicates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer dev_token",
          "X-API-Key": "test_key"
        },
        body: JSON.stringify({
          data: data.content,
          checkFields: ["email", "phone", "firstName", "lastName"],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to check duplicates")
      }

      const result = await response.json()
      setDuplicateChecks(result.duplicateChecks)
      updateProcessingStep("duplicate", "completed", `Found ${result.totalDuplicates} potential duplicates`)

      setProgress(50)

      // Auto proceed to mapping
      await performAutoMapping(data)
    } catch (error: any) {
      updateProcessingStep("duplicate", "error", error.message)
      setError(error.message)
    } finally {
      setDuplicateCheckLoading(false)
    }
  }

  const performAutoMapping = async (data: FileData) => {
    setMappingLoading(true)
    updateProcessingStep("mapping", "processing")
    setCurrentStep("mapping")

    try {
      console.log("File data for auto mapping:", {
        headers: data.headers,
        sampleData: data.content.slice(0, 5),
        totalRows: data.content.length
      });

      // Check for DNC columns
      const dncColumns = data.headers.filter(header => 
        DNC_PATTERNS.some(pattern => 
          header.toLowerCase().includes(pattern.toLowerCase())
        )
      );
      
      console.log("Detected DNC columns:", dncColumns);

      // Ensure headers is an array of strings
      const headers = Array.isArray(data.headers) ? data.headers : [];
      
      // Ensure sampleData is an array of objects
      const sampleData = Array.isArray(data.content) ? data.content.slice(0, 5) : [];

      const requestBody = {
        headers: headers,
        sampleData: sampleData,
        dncColumns: dncColumns // Add DNC columns to the request
      };
      console.log("Request body:", JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${BACKEND_URL}/auto-mapping`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer dev_token",
          "X-API-Key": "test_key"
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Auto mapping failed:", {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error("Failed to perform auto mapping")
      }

      const result = await response.json()
      console.log("Auto mapping result:", result);
      
      // Add DNC mapping if detected
      if (dncColumns.length > 0) {
        const dncMapping = {
          sourceField: dncColumns[0],
          targetField: "dnc",
          confidence: 1.0,
          isRequired: false
        };
        result.mappings.push(dncMapping);
      }
      
      setMappingRules(result.mappings)
      updateProcessingStep("mapping", "completed", `Mapped ${result.mappings.length} fields`)

      setProgress(70)
      setCurrentStep("preview")

      // Generate preview
      generatePreview(data, result.mappings)
    } catch (error: any) {
      console.error("Auto mapping error:", error);
      updateProcessingStep("mapping", "error", error.message)
      setError(error.message)
    } finally {
      setMappingLoading(false)
    }
  }

  const generatePreview = (data: FileData, mappings: MappingRule[]) => {
    // Create a map to store the best mapping for each target field based on confidence
    const bestMappings = new Map<string, MappingRule>();

    mappings.forEach((mapping) => {
      if (mapping.targetField) {
        const existingMapping = bestMappings.get(mapping.targetField);
        // If no mapping exists for this target field, or if the current mapping has higher confidence
        if (!existingMapping || mapping.confidence > existingMapping.confidence) {
          bestMappings.set(mapping.targetField, mapping);
        }
      }
    });

    const mappedData = data.content.slice(0, 10).map((row) => {
      const mappedRow: any = {}
      
      // Iterate through the SYSTEM_FIELDS to ensure consistent column order
      SYSTEM_FIELDS.forEach((systemField) => {
        const mapping = bestMappings.get(systemField.value);
        
        if (mapping && mapping.sourceField) {
          let value = row[mapping.sourceField] || "";
          
          // Apply specific handling based on the target field
          if (mapping.targetField === "dnc") {
            // Use the DNC_VALUES set to check if the source value indicates DNC
            value = DNC_VALUES.has(String(value).toLowerCase().trim()) ? "Yes" : "No";
          } else if (mapping.targetField === "phone") {
             // For phone, display numeric-like values, otherwise empty
             const stringValue = String(value).trim();
             // Basic check for digits and common phone number characters
             if (/^[\d\s\-\(\).+]+$/.test(stringValue)) {
                 value = stringValue;
             } else {
                 value = ""; // Display empty for non-phone-like data
             }
          } else {
            // For all other fields, use the value directly
            value = String(value); // Ensure value is a string
          }
          
          mappedRow[mapping.targetField] = value;
        } else {
           // If no mapping exists for this system field, set the value to empty
           mappedRow[systemField.value] = "";
        }
      })
      return mappedRow
    })

    setPreviewData(mappedData)
    setShowPreview(true)
  }

  const updateMapping = (index: number, targetField: string) => {
    setMappingRules((prev) => prev.map((rule, i) => (i === index ? { ...rule, targetField } : rule)))
  }

  const processAndUpload = async () => {
    try {
    setUploading(true)
      setProgress(0)
      setError(null)

      if (!fileData) {
        throw new Error("No file data available")
      }

      // Update processing steps
      updateProcessingStep("parse", "completed")
      updateProcessingStep("duplicate", "completed")
      updateProcessingStep("mapping", "completed")
      updateProcessingStep("cleaning", "processing")

      // Prepare the request data
      const requestData = {
        data: fileData.content,
        mappings: mappingRules,
        filename: file?.name || "uploaded_file",
        cleaning_settings: cleaningSettings,
        normalization_settings: normalizationSettings,
        tagging_settings: {
          ...taggingSettings,
          fileName: file?.name || "uploaded_file",
          fileType: file?.name?.split(".").pop() || "csv"
        },
        source: "manual_upload",  // Default source
        supplier_id: null,  // Will be set by backend if needed
        user_id: null  // Will be set by backend if needed
      }

      // Send the request
      const response = await fetch(`${BACKEND_URL}/api/process-leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      setProcessingResult(result)

      // Update processing steps
      updateProcessingStep("cleaning", "completed")
      updateProcessingStep("normalization", "completed")
      updateProcessingStep("tagging", "completed")
      updateProcessingStep("upload", "completed")

      // Show success message
      toast({
        title: "Upload Complete",
        description: `Successfully processed ${result.stats.inserted} leads. ${result.stats.duplicates} duplicates found.`,
      })

      // Reset file state but don't reset step
        setFile(null)
        setFileData(null)

    } catch (error: any) {
      console.error("Error in processAndUpload:", error)
      setError(error.message || "Failed to process and upload file")
      updateProcessingStep("upload", "error", error.message)
    } finally {
      setUploading(false)
      setProgress(100)
    }
  }

  const getStepIcon = (status: ProcessingStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "processing":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}



      {/* File Upload */}
      {currentStep === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="file"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {file ? (
                    <>
                      <FileSpreadsheet className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">{file.name}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">CSV, XLSX, or JSON (MAX. 10MB)</p>
                    </>
                  )}
                </div>
                <Input id="file" type="file" accept=".csv,.xlsx,.json" className="hidden" onChange={handleFileChange} />
              </label>
            </div>


          </CardContent>
        </Card>
      )}

      {/* Duplicate Check Results */}
      {currentStep === "duplicate-check" && duplicateChecks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Duplicate Check Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {duplicateChecks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <span className="font-medium">{check.field}</span>
                    <p className="text-sm text-muted-foreground">
                      {check.duplicateCount} duplicates found out of {check.totalChecked} records
                    </p>
                  </div>
                  <Badge variant={check.duplicateCount > 0 ? "destructive" : "default"}>
                    {check.duplicateCount > 0 ? "Duplicates Found" : "Clean"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Field Mapping */}
      {currentStep === "mapping" && mappingRules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Field Mapping</CardTitle>
            <p className="text-sm text-muted-foreground">
              Review and adjust the automatic field mapping. Required fields are marked with an asterisk (*).
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source Field</TableHead>
                    <TableHead>Target Field</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Sample Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappingRules.map((rule: MappingRule, index: number) => {
                    // Get sample value for this field
                    const sampleValue = fileData?.content[0]?.[rule.sourceField] || "-"
                    
                    return (
                    <TableRow key={index}>
                        <TableCell className="font-medium">{rule.sourceField}</TableCell>
                      <TableCell>
                          <Select 
                            value={rule.targetField} 
                            onValueChange={(value) => updateMapping(index, value)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select field..." />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="">-- Select Field --</SelectItem>
                            {SYSTEM_FIELDS.map((field) => (
                                <SelectItem 
                                  key={field.value} 
                                  value={field.value}
                                  className="flex items-center gap-2"
                                >
                                  <div>
                                    <div className="font-medium">
                                {field.label}
                                      {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {field.description}
                                    </div>
                                  </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                              rule.confidence > 0.8 ? "default" : 
                              rule.confidence > 0.5 ? "secondary" : 
                              "destructive"
                          }
                        >
                          {Math.round(rule.confidence * 100)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Checkbox checked={rule.isRequired} disabled />
                      </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={sampleValue}>
                          {sampleValue}
                        </TableCell>
                    </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {mappingRules.filter((r: MappingRule) => r.isRequired && !r.targetField).length > 0 && (
                    <p className="text-red-500">
                      Please map all required fields before proceeding.
                    </p>
                  )}
                </div>
                <Button 
                  onClick={() => generatePreview(fileData!, mappingRules)} 
                  className="w-full"
                  disabled={mappingRules.filter((r: MappingRule) => r.isRequired && !r.targetField).length > 0}
                >
                <Eye className="mr-2 h-4 w-4" />
                Generate Preview
              </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {currentStep === "preview" && showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
            <p className="text-sm text-muted-foreground">Preview of first 10 mapped records</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {SYSTEM_FIELDS.filter((field) =>
                        mappingRules.some((rule) => rule.targetField === field.value),
                      ).map((field) => (
                        <TableHead key={field.value}>{field.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, index) => (
                      <TableRow key={index}>
                        {SYSTEM_FIELDS.filter((field) =>
                          mappingRules.some((rule) => rule.targetField === field.value),
                        ).map((field) => (
                          <TableCell key={field.value}>{row[field.value] || "-"}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Button onClick={processAndUpload} disabled={uploading} className="w-full">
                <ArrowRight className="mr-2 h-4 w-4" />
                Process & Upload to Database
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {processingResult && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Total Leads</p>
                  <p className="text-2xl font-bold">{processingResult.stats.total}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Successfully Uploaded to Database</p>
                  <p className="text-2xl font-bold text-green-600">{processingResult.stats.inserted}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Duplicates Found</p>
                  <p className="text-2xl font-bold text-yellow-600">{processingResult.stats.duplicates}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">DNC Leads</p>
                  <p className="text-2xl font-bold text-red-600">{processingResult.stats.dnc}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


