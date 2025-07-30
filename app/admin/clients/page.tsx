"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Building2, Users, DollarSign, TrendingUp, Upload } from "lucide-react"
import { Client } from "@/types/client"
import { ClientDialog } from "@/app/components/clients/client-dialog"
import { ClientCard } from "@/app/components/clients/client-card"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { RoleGuard } from "@/components/auth/role-guard"

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState('form');
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/clients')
      if (!response.ok) {
        throw new Error('Failed to fetch clients')
      }
      const data = await response.json()
      console.log('Fetched clients:', data) // Debug log
      setClients(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast({
        title: "Error",
        description: "Failed to load clients. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  type ClientFormData = {
    name: string;
    email: string;
    phone?: string | null;
    contactperson?: string | null;
    deliveryformat?: string | null;
    deliveryschedule?: string | null;
    percentallocation?: number | null;
    fixedallocation?: number | null;
    exclusivitysettings?: Record<string, any> | null;
    isactive: boolean;
  };
  
  const mapClientToFormData = (client: Client | null): ClientFormData => ({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || null,
    contactperson: client?.contactperson || null,
    deliveryformat: client?.deliveryformat || null,
    deliveryschedule: client?.deliveryschedule || null,
    percentallocation: client?.percentallocation || null,
    fixedallocation: client?.fixedallocation || null,
    exclusivitysettings: client?.exclusivitysettings || null,
    isactive: client?.isactive ?? true,
  });

  // Function to create a new client
  const createClient = async (clientData: Omit<Client, 'id' | 'createdat'>) => {
    const dataWithTimestamp = {
      ...clientData,
      createdat: new Date().toISOString(), // Add current timestamp
    };

    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataWithTimestamp),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.message || 'Failed to create client');
    }

    return response.json();
  };

  // Function to update an existing client
  const updateClient = async (id: number, data: Partial<Client>) => {
    try {
      const response = await fetch(`/api/clients?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to update client');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  };

  const handleSaveClient = async (formData: ClientFormData) => {
    try {
      // Convert form data to Client type
      const clientData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        contactperson: formData.contactperson?.trim() || null,
        deliveryformat: formData.deliveryformat?.trim() || null,
        deliveryschedule: formData.deliveryschedule?.trim() || null,
        percentallocation: formData.percentallocation ? Number(formData.percentallocation) : null,
        fixedallocation: formData.fixedallocation ? Number(formData.fixedallocation) : null,
        exclusivitysettings: formData.exclusivitysettings || null,
        isactive: formData.isactive,
      };

      if (selectedClient && selectedClient.id) {
        // Update existing client
        await updateClient(selectedClient.id, clientData);
        toast({
          title: 'Success',
          description: 'Client updated successfully',
        });
      } else {
        // Create new client
        await createClient(clientData);
        toast({
          title: 'Success',
          description: 'Client created successfully',
        });
      }
      
      // Close the dialog and refresh the clients list
      setIsDialogOpen(false);
      await fetchClients();
      setSelectedClient(null);
    } catch (error) {
      console.error(`Error ${selectedClient ? 'updating' : 'creating'} client:`, error)
      toast({
        title: "Error",
        description: `Failed to ${selectedClient ? 'update' : 'create'} client. Please try again.`,
        variant: "destructive",
      })
    }
  }

  const handleCSVUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/clients/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload CSV');
      }

      const result = await response.json();
      
      // Show success message
      toast({
        title: 'Success',
        description: `Successfully imported ${result.count || 0} clients`,
      });

      // Refresh the clients list
      await fetchClients();
    } catch (error) {
      console.error('Error uploading CSV:', error);
      throw error; // Re-throw to be handled by the dialog
    }
  }

  const handleDelete = async (clientId: number) => {
    if (!confirm('Are you sure you want to delete this client?')) return
    
    try {
      const response = await fetch(`/api/clients?id=${clientId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to delete client');
      }

      await fetchClients()
      toast({
        title: "Success",
        description: "Client deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting client:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete client. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      (client.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (client.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (client.contactperson?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  const activeClients = clients.filter(client => client.isactive).length
  const totalRevenue = clients.reduce((sum, client) => sum + (client.fixedallocation || 0), 0)

  if (loading && clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <RoleGuard requiredPermission="canManageClients">
      <div className="space-y-6">
        <Toaster />
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Client Management</h1>
          <p className="text-muted-foreground">Manage your clients and their information</p>
        </div>
        <div className="flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search clients..."
              className="w-full bg-background pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                setSelectedClient(null);
                setActiveTab('csv');
                setIsDialogOpen(true);
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <ClientDialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                if (!open) {
                  setSelectedClient(null);
                  setActiveTab('form');
                }
                setIsDialogOpen(open);
              }}
              client={selectedClient ? mapClientToFormData(selectedClient) : undefined}
              onSave={handleSaveClient}
              onCSVUpload={handleCSVUpload}
              defaultTab={activeTab}
            />
            <Button 
              onClick={() => {
                setSelectedClient(null)
                setIsDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeClients} active, {clients.length - activeClients} inactive
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClients}</div>
            <p className="text-xs text-muted-foreground">
              {clients.length > 0 ? Math.round((activeClients / clients.length) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Allocation</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total fixed allocation across all clients
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Client Directory</CardTitle>
              <CardDescription>View and manage all your clients</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No clients found</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {searchTerm ? 'No clients match your search. Try a different term.' : 'Get started by adding a new client.'}
              </p>
              {!searchTerm && (
                <Button 
                  className="mt-4" 
                  onClick={() => {
                    setSelectedClient(null)
                    setIsDialogOpen(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Client
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredClients.map((client) => {
                if (!client.id) return null; // Skip clients without an ID
                
                // Ensure all required fields have default values
                const clientData = {
                  id: client.id,
                  name: client.name || 'Unnamed Client',
                  email: client.email || '',
                  phone: client.phone || null,
                  contactperson: client.contactperson || null,
                  deliveryformat: client.deliveryformat || null,
                  deliveryschedule: client.deliveryschedule || null,
                  percentallocation: client.percentallocation || null,
                  fixedallocation: client.fixedallocation || null,
                  exclusivitysettings: client.exclusivitysettings || null,
                  isactive: client.isactive ?? true,
                  createdat: client.createdat || new Date().toISOString(),
                };
                
                return (
                  <ClientCard
                    key={client.id}
                    client={clientData}
                    onEdit={() => {
                      setSelectedClient(clientData);
                      setIsDialogOpen(true);
                    }}
                    onDelete={() => client.id && handleDelete(client.id)}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </RoleGuard>
  )
}
