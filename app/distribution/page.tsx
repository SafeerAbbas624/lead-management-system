"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Download, Users, FileSpreadsheet, DollarSign, Shuffle, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

// Types
interface Batch {
  id: number
  filename: string
  source_name: string
  supplier_name: string
  total_leads: number
  cleaned_leads: number
  created_at: string
  completed_at: string
}

interface Client {
  id: number
  name: string
  email: string
  contactperson: string
  deliveryformat: string
}

interface BatchSelection {
  batch_id: number
  percentage: number
  source_name: string
  filename: string
  total_leads: number
  selected_leads: number
}

interface DistributionHistory {
  id: number
  distribution_name: string
  total_leads: number
  total_cost: number  // Keep for backward compatibility
  selling_price_per_sheet: number
  price_per_lead: number
  blend_enabled: boolean
  client_names: string[]
  batch_details: any[]
  created_at: string
  exported_at: string
}

export default function DistributionPage() {
  const { toast } = useToast()

  // State
  const [batches, setBatches] = useState<Batch[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedBatches, setSelectedBatches] = useState<BatchSelection[]>([])
  const [selectedClients, setSelectedClients] = useState<number[]>([])
  const [sellingPricePerSheet, setSellingPricePerSheet] = useState<number>(0)
  const [blendEnabled, setBlendEnabled] = useState<boolean>(false)
  const [distributionName, setDistributionName] = useState<string>("")
  const [distributionHistory, setDistributionHistory] = useState<DistributionHistory[]>([])
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [distributing, setDistributing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data fetching
  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [batchesRes, clientsRes, historyRes] = await Promise.all([
        fetch('/api/distribution/batches'),
        fetch('/api/distribution/clients'),
        fetch('/api/distribution/history')
      ])

      if (!batchesRes.ok || !clientsRes.ok || !historyRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [batchesData, clientsData, historyData] = await Promise.all([
        batchesRes.json(),
        clientsRes.json(),
        historyRes.json()
      ])

      if (batchesData.success) {
        setBatches(batchesData.batches || [])
      }
      if (clientsData.success) {
        setClients(clientsData.clients || [])
      }
      if (historyData.success) {
        setDistributionHistory(historyData.distributions || [])
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data. Please try again.')
      toast({
        title: "Error",
        description: "Failed to load distribution data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Batch selection functions
  const addBatchSelection = () => {
    setSelectedBatches([...selectedBatches, {
      batch_id: 0,
      percentage: 0,
      source_name: '',
      filename: '',
      total_leads: 0,
      selected_leads: 0
    }])
  }

  const updateBatchSelection = (index: number, field: keyof BatchSelection, value: any) => {
    const updated = [...selectedBatches]
    updated[index] = { ...updated[index], [field]: value }
    
    // If batch_id changed, update related fields
    if (field === 'batch_id') {
      const batch = batches.find(b => b.id === value)
      if (batch) {
        updated[index].source_name = batch.source_name
        updated[index].filename = batch.filename
        updated[index].total_leads = batch.total_leads
      }
    }
    
    // Calculate selected leads when percentage changes
    if (field === 'percentage' || field === 'batch_id') {
      updated[index].selected_leads = Math.floor(updated[index].total_leads * (updated[index].percentage / 100))
    }
    
    setSelectedBatches(updated)
  }

  const removeBatchSelection = (index: number) => {
    setSelectedBatches(selectedBatches.filter((_, i) => i !== index))
  }

  // Client selection functions
  const toggleClientSelection = (clientId: number) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    )
  }

  // Distribution function
  const handleDistribution = async () => {
    try {
      // Validation
      if (selectedBatches.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one batch",
          variant: "destructive",
        })
        return
      }

      if (selectedClients.length === 0) {
        toast({
          title: "Error", 
          description: "Please select at least one client",
          variant: "destructive",
        })
        return
      }

      if (sellingPricePerSheet <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid selling price per sheet",
          variant: "destructive",
        })
        return
      }

      // Check if all batches have valid percentages
      const invalidBatches = selectedBatches.filter(b => b.batch_id === 0 || b.percentage <= 0)
      if (invalidBatches.length > 0) {
        toast({
          title: "Error",
          description: "Please select valid batches and percentages",
          variant: "destructive",
        })
        return
      }

      setDistributing(true)

      const distributionRequest = {
        batches: selectedBatches.map(b => ({
          batch_id: b.batch_id,
          percentage: b.percentage,
          source_name: b.source_name
        })),
        client_ids: selectedClients,
        selling_price_per_sheet: sellingPricePerSheet,
        blend_enabled: blendEnabled,
        distribution_name: distributionName || `Distribution ${new Date().toISOString().split('T')[0]}`
      }

      const response = await fetch('/api/distribution/distribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(distributionRequest),
      })

      if (!response.ok) {
        throw new Error('Distribution failed')
      }

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success",
          description: `Successfully distributed ${result.total_leads_distributed} leads`,
        })

        // Download CSV
        const csvResponse = await fetch(`/api/distribution/export/${result.distribution_id}`)
        if (csvResponse.ok) {
          const blob = await csvResponse.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = result.csv_filename
          document.body.appendChild(a)
          a.click()
          a.remove()
          window.URL.revokeObjectURL(url)
        }

        // Reset form
        setSelectedBatches([])
        setSelectedClients([])
        setSellingPricePerSheet(0)
        setBlendEnabled(false)
        setDistributionName("")

        // Refresh history
        fetchInitialData()
      } else {
        throw new Error(result.message || 'Distribution failed')
      }

    } catch (error) {
      console.error('Distribution error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Distribution failed',
        variant: "destructive",
      })
    } finally {
      setDistributing(false)
    }
  }

  // Calculate totals
  const totalSelectedLeads = selectedBatches.reduce((sum, batch) => sum + batch.selected_leads, 0)
  const totalCost = sellingPricePerSheet
  const pricePerLead = totalSelectedLeads > 0 ? sellingPricePerSheet / totalSelectedLeads : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading distribution data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Lead Distribution</h1>
      </div>

      <Tabs defaultValue="distribute" className="space-y-4">
        <TabsList>
          <TabsTrigger value="distribute">Distribute Leads</TabsTrigger>
          <TabsTrigger value="history">Distribution History</TabsTrigger>
        </TabsList>

        <TabsContent value="distribute" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Select Batches & Percentages
              </CardTitle>
              <CardDescription>
                Choose upload batches and specify what percentage of leads to distribute from each.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedBatches.map((selection, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label>Batch</Label>
                    <Select
                      value={selection.batch_id.toString()}
                      onValueChange={(value) => updateBatchSelection(index, 'batch_id', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select batch" />
                      </SelectTrigger>
                      <SelectContent>
                        {batches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id.toString()}>
                            <div className="flex flex-col">
                              <span>{batch.filename}</span>
                              <span className="text-xs text-muted-foreground">
                                {batch.source_name} • {batch.total_leads} leads
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-24">
                    <Label>Percentage</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={selection.percentage}
                      onChange={(e) => updateBatchSelection(index, 'percentage', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="w-24">
                    <Label>Selected</Label>
                    <div className="text-sm font-medium text-center py-2">
                      {selection.selected_leads}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeBatchSelection(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button onClick={addBatchSelection} variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Batch
              </Button>
              
              {selectedBatches.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span>Total Selected Leads:</span>
                    <span className="font-medium">{totalSelectedLeads}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Select Clients
              </CardTitle>
              <CardDescription>
                Choose which clients will receive the distributed leads.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedClients.includes(client.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleClientSelection(client.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedClients.includes(client.id)}
                        onChange={() => {}} // Handled by parent onClick
                      />
                      <div className="flex-1">
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground">{client.email}</div>
                        {client.contactperson && (
                          <div className="text-xs text-muted-foreground">
                            Contact: {client.contactperson}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedClients.length > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span>Selected Clients:</span>
                    <span className="font-medium">{selectedClients.length}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Distribution Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Distribution Settings
              </CardTitle>
              <CardDescription>
                Configure pricing and blending options. Enter the total sheet price - it will be automatically divided by the number of leads.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="distributionName">Distribution Name (Optional)</Label>
                  <Input
                    id="distributionName"
                    value={distributionName}
                    onChange={(e) => setDistributionName(e.target.value)}
                    placeholder="e.g., Q1 2024 Distribution"
                  />
                </div>

                <div>
                  <Label htmlFor="sellingPricePerSheet">Selling Price per Sheet ($)</Label>
                  <Input
                    id="sellingPricePerSheet"
                    type="number"
                    min="0"
                    step="0.01"
                    value={sellingPricePerSheet}
                    onChange={(e) => setSellingPricePerSheet(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="blendEnabled"
                  checked={blendEnabled}
                  onCheckedChange={setBlendEnabled}
                />
                <Label htmlFor="blendEnabled" className="flex items-center gap-2">
                  <Shuffle className="h-4 w-4" />
                  Blend leads from different batches together
                </Label>
              </div>

              {totalSelectedLeads > 0 && sellingPricePerSheet > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Leads:</span>
                      <span className="font-medium">{totalSelectedLeads}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sheet Price:</span>
                      <span className="font-medium">${sellingPricePerSheet.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price per Lead:</span>
                      <span className="font-medium">${pricePerLead.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total Cost:</span>
                      <span>${totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handleDistribution}
                disabled={distributing || selectedBatches.length === 0 || selectedClients.length === 0 || sellingPricePerSheet <= 0}
                className="w-full"
                size="lg"
              >
                {distributing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing Distribution...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export & Download CSV
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribution History</CardTitle>
              <CardDescription>
                View all previous lead distributions with detailed analytics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {distributionHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No distributions found. Create your first distribution to see history here.
                </div>
              ) : (
                <div className="space-y-4">
                  {distributionHistory.map((distribution) => (
                    <div key={distribution.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{distribution.distribution_name}</h4>
                        <Badge variant={distribution.blend_enabled ? "default" : "outline"}>
                          {distribution.blend_enabled ? "Blended" : "Separate"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Leads:</span>
                          <div className="font-medium">{distribution.total_leads}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sheet Price:</span>
                          <div className="font-medium">${(distribution.selling_price_per_sheet || distribution.total_cost)?.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Price/Lead:</span>
                          <div className="font-medium">${distribution.price_per_lead?.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Clients:</span>
                          <div className="font-medium">{distribution.client_names?.join(', ')}</div>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground">
                        Created: {format(new Date(distribution.created_at), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
