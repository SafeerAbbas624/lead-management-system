"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react"

interface ManualFieldMappingProps {
  sessionId: string
  headers: string[]
  autoMapping: Record<string, string>
  onMappingUpdate: (mapping: Record<string, string>) => void
}

const DATABASE_FIELDS = [
  { value: 'email', label: 'Email', required: true },
  { value: 'firstname', label: 'First Name', required: true },
  { value: 'lastname', label: 'Last Name', required: true },
  { value: 'phone', label: 'Phone', required: true },
  { value: 'companyname', label: 'Company Name', required: false },
  { value: 'address', label: 'Address', required: false },
  { value: 'city', label: 'City', required: false },
  { value: 'state', label: 'State', required: false },
  { value: 'zipcode', label: 'Zip Code', required: false },
  { value: 'country', label: 'Country', required: false },
  { value: 'taxid', label: 'Tax ID / EIN', required: false },
  { value: 'leadcost', label: 'Lead Cost', required: false },
  { value: 'leadscore', label: 'Lead Score', required: false },
  { value: 'exclusivity', label: 'Exclusivity', required: false },
  { value: 'exclusivitynotes', label: 'Exclusivity Notes', required: false },
  { value: 'revenue', label: 'Revenue', required: false },
]

export function ManualFieldMapping({
  sessionId,
  headers,
  autoMapping,
  onMappingUpdate
}: ManualFieldMappingProps) {
  const [manualMapping, setManualMapping] = useState<Record<string, string>>({})
  const [finalMapping, setFinalMapping] = useState<Record<string, string>>({})

  useEffect(() => {
    console.log('ManualFieldMapping received props:', { sessionId, headers, autoMapping })
    // Initialize with auto mapping
    setFinalMapping({ ...autoMapping })
  }, [autoMapping])

  const handleManualMapping = (dbField: string, csvHeader: string) => {
    const newManualMapping = { ...manualMapping }
    const newFinalMapping = { ...finalMapping }

    if (csvHeader === 'none') {
      // Remove mapping
      delete newManualMapping[dbField]
      delete newFinalMapping[dbField]
    } else {
      // Add/update mapping
      newManualMapping[dbField] = csvHeader
      newFinalMapping[dbField] = csvHeader
    }

    setManualMapping(newManualMapping)
    setFinalMapping(newFinalMapping)
    onMappingUpdate(newFinalMapping)
  }

  const getMappingStatus = (dbField: string) => {
    if (manualMapping[dbField]) {
      return { type: 'manual', status: 'success' }
    } else if (autoMapping[dbField]) {
      return { type: 'auto', status: 'success' }
    } else {
      const field = DATABASE_FIELDS.find(f => f.value === dbField)
      return { type: 'none', status: field?.required ? 'error' : 'warning' }
    }
  }

  const getAvailableHeaders = (currentDbField: string) => {
    const usedHeaders = new Set(Object.values(finalMapping))
    const currentHeader = finalMapping[currentDbField]
    
    return headers.filter(header => 
      !usedHeaders.has(header) || header === currentHeader
    )
  }

  const requiredFieldsMapped = DATABASE_FIELDS
    .filter(field => field.required)
    .every(field => finalMapping[field.value])

  const mappedCount = Object.keys(finalMapping).length
  const totalFields = DATABASE_FIELDS.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Manual Field Mapping
          {requiredFieldsMapped ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
        </CardTitle>
        <CardDescription>
          Review and adjust field mappings. Auto-mapped fields are shown in blue, manual mappings in green.
          <div className="mt-2">
            <Badge variant="outline">
              {mappedCount} of {totalFields} fields mapped
            </Badge>
            {!requiredFieldsMapped && (
              <Badge variant="destructive" className="ml-2">
                Required fields missing
              </Badge>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {DATABASE_FIELDS.map((field) => {
            const status = getMappingStatus(field.value)
            const currentMapping = finalMapping[field.value]
            
            return (
              <div key={field.value} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{field.label}</span>
                    {field.required && (
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    )}
                    {status.type === 'manual' && (
                      <Badge variant="default" className="text-xs">Manual</Badge>
                    )}
                    {status.type === 'auto' && (
                      <Badge variant="secondary" className="text-xs">Auto</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Database field: <code>{field.value}</code>
                  </div>
                </div>
                
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                
                <div className="flex-1">
                  <Select
                    value={currentMapping || 'none'}
                    onValueChange={(value) => handleManualMapping(field.value, value)}
                  >
                    <SelectTrigger className={`w-full ${
                      status.status === 'error' ? 'border-red-500' : 
                      status.status === 'warning' ? 'border-yellow-500' : 
                      'border-green-500'
                    }`}>
                      <SelectValue placeholder="Select CSV header" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">No mapping</span>
                      </SelectItem>
                      {getAvailableHeaders(field.value).map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentMapping && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Mapped to: <code>{currentMapping}</code>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Unmapped CSV Headers</h4>
          <div className="flex flex-wrap gap-2">
            {headers
              .filter(header => !Object.values(finalMapping).includes(header))
              .map(header => (
                <Badge key={header} variant="outline">
                  {header}
                </Badge>
              ))}
          </div>
          {headers.filter(header => !Object.values(finalMapping).includes(header)).length === 0 && (
            <p className="text-sm text-muted-foreground">All headers are mapped!</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
