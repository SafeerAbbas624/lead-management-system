"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check, Send } from "lucide-react"
// import { uploadBatchesApi, clientsApi, distributionApi } from "@/lib/mock-api"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

export default function DistributionPage() {
  const { toast } = useToast()
  interface Batch {
    id: number;
    filename: string;  // Changed from fileName to match database schema
    cleanedleads: number;  // Changed from cleanedLeads to match database schema
    status: string;
    // Other fields from upload_batches table
  }

  interface Client {
    id: string | number;
    name: string;
    email: string;
    percentAllocation?: number;
    fixedAllocation?: number;
  }

  const [batches, setBatches] = useState<Batch[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [distributions, setDistributions] = useState<any[]>([])
  const [selectedBatch, setSelectedBatch] = useState<string>("")
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [distributing, setDistributing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching data...');
        const [batchesResponse, clientsResponse, historyResponse] = await Promise.all([
          fetch('/api/distribution/batches').then(async res => {
            const data = await res.json();
            console.log('Batches API response:', data);
            return data;
          }),
          fetch('/api/distribution/clients').then(res => res.json()),
          fetch('/api/distribution/history').then(res => res.json()),
        ]);
        
        console.log('Raw batches response:', batchesResponse);
        
        // Ensure we're setting arrays even if the response is malformed
        const batchesData = Array.isArray(batchesResponse) ? batchesResponse : [];
        const clientsData = Array.isArray(clientsResponse) ? clientsResponse : [];
        const distributionsData = Array.isArray(historyResponse) ? historyResponse : [];
        
        console.log('Processed batches data:', batchesData);
        
        setBatches(batchesData);
        setClients(clientsData);
        setDistributions(distributionsData);
      } catch (error) {
        console.error("Error fetching distribution data:", error);
        setError("Failed to load data. Please try again.");
        // Reset to empty arrays on error
        setBatches([]);
        setClients([]);
        setDistributions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [])

  const handleClientSelection = (clientId: string) => {
    setSelectedClients((prev) => {
      if (prev.includes(clientId)) {
        return prev.filter((id) => id !== clientId)
      } else {
        return [...prev, clientId]
      }
    })
  }

  const handleDistribute = async () => {
    if (!selectedBatch) {
      setError("Please select a batch to distribute")
      return
    }

    if (selectedClients.length === 0) {
      setError("Please select at least one client")
      return
    }

    setError(null)
    setDistributing(true)

    try {
      const response = await fetch('/api/distribution/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: Number.parseInt(selectedBatch),
          clientIds: selectedClients.map((id) => Number.parseInt(id)),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Distribution failed');
      toast({
        title: "Leads distributed successfully",
        description: `Distributed ${result.totalLeads} leads to ${result.distributions.length} clients`,
      });
      // Refresh distributions
      const updatedDistributions = await fetch('/api/distribution/history').then(res => res.json());
      setDistributions(updatedDistributions);
      // Reset selection
      setSelectedBatch("");
      setSelectedClients([]);
    } catch (err: any) {
      setError(err.message || "Failed to distribute leads")
    } finally {
      setDistributing(false)
    }
  }

  const getClientName = (clientId: number) => {
    const client = clients.find((c) => c.id === clientId)
    return client ? client.name : "Unknown Client"
  }

  const getBatchName = (batchId: number) => {
    const batch = batches.find((b) => b.id === batchId)
    return batch ? batch.filename : "Unknown Batch"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Lead Distribution</h1>
      </div>

      <Tabs defaultValue="distribute" className="space-y-6">
        <TabsList>
          <TabsTrigger value="distribute">Distribute Leads</TabsTrigger>
          <TabsTrigger value="history">Distribution History</TabsTrigger>
        </TabsList>

        <TabsContent value="distribute" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribute Leads to Clients</CardTitle>
              <CardDescription>Select a batch and clients to distribute leads</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="batch">Select Batch</Label>
                  <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                    <SelectTrigger id="batch">
                      <SelectValue placeholder="Select a batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No completed batches found
                        </div>
                      ) : (
                        batches.map((batch) => (
                          <SelectItem key={batch.id} value={batch.id.toString()}>
                            {batch.filename} ({batch.cleanedleads} leads)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Select Clients</Label>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className={`p-4 border rounded-md cursor-pointer ${
                          selectedClients.includes(client.id.toString())
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleClientSelection(client.id.toString())}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{client.name}</div>
                          {selectedClients.includes(client.id.toString()) && (
                            <Check className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{client.email}</div>
                        <div className="text-sm mt-2">
                          {client.percentAllocation ? (
                            <Badge variant="outline">{client.percentAllocation}% Allocation</Badge>
                          ) : (
                            <Badge variant="outline">{client.fixedAllocation} Fixed Leads</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleDistribute}
                  disabled={distributing || !selectedBatch || selectedClients.length === 0}
                  className="w-full"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {distributing ? "Distributing..." : "Distribute Leads"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribution History</CardTitle>
              <CardDescription>View past lead distributions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <p className="text-muted-foreground">Loading distribution history...</p>
                </div>
              ) : distributions.length === 0 ? (
                <div className="flex items-center justify-center h-96 border rounded-md">
                  <p className="text-muted-foreground">No distributions found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Leads Allocated</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Delivery Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributions.length > 0 ? (
                      distributions.map((dist) => (
                        <TableRow key={dist.id}>
                          <TableCell>{getBatchName(dist.batchId)}</TableCell>
                          <TableCell>{getClientName(dist.clientId)}</TableCell>
                          <TableCell>{dist.leadsAllocated}</TableCell>
                          <TableCell>
                            <DeliveryStatusBadge status={dist.deliveryStatus} />
                          </TableCell>
                          <TableCell>
                            {dist.deliveryDate ? format(new Date(dist.deliveryDate), "MMM d, yyyy h:mm a") : "Pending"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          No distribution history found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DeliveryStatusBadge({ status }: { status: string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline"
  let className = ""

  switch (status) {
    case "Delivered":
      variant = "default"
      className = "bg-green-100 text-green-800 border-green-200"
      break
    case "Pending":
      variant = "secondary"
      className = "bg-yellow-100 text-yellow-800 border-yellow-200"
      break
    case "Failed":
      variant = "destructive"
      break
    default:
      variant = "outline"
  }

  return (
    <Badge variant="outline" className={className}>
      {status}
    </Badge>
  )
}
