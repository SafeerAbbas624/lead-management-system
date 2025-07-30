"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Copy, Key, RefreshCw, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RoleGuard } from "@/components/auth/role-guard"

interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  createdAt: string
  expiryDate: string | null
  isActive: boolean
}

export function ApiKeyManagement() {
  const { toast } = useToast()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newKeyDialogOpen, setNewKeyDialogOpen] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    permissions: [] as string[],
    expiryDays: "365",
  })

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      // Mock data for now
      const mockApiKeys: ApiKey[] = [
        {
          id: "1",
          name: "Production API Key",
          key: "••••••••••••••••",
          permissions: ["read", "write"],
          createdAt: "2023-01-15T10:30:00Z",
          expiryDate: "2024-01-15T10:30:00Z",
          isActive: true,
        },
        {
          id: "2",
          name: "Read-only API Key",
          key: "••••••••••••••••",
          permissions: ["read"],
          createdAt: "2023-02-20T14:45:00Z",
          expiryDate: "2024-02-20T14:45:00Z",
          isActive: true,
        },
        {
          id: "3",
          name: "Development API Key",
          key: "••••••••••••••••",
          permissions: ["read", "write", "delete"],
          createdAt: "2023-03-10T09:15:00Z",
          expiryDate: null,
          isActive: false,
        },
      ]
      setApiKeys(mockApiKeys)
    } catch (error) {
      console.error("Error fetching API keys:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (key: string, value: string) => {
    setFormData({
      ...formData,
      [key]: value,
    })
  }

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, permission],
      })
    } else {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter((p) => p !== permission),
      })
    }
  }

  const handleCreateKey = async () => {
    try {
      if (!formData.name) {
        toast({
          title: "Error",
          description: "API key name is required",
          variant: "destructive",
        })
        return
      }

      if (formData.permissions.length === 0) {
        toast({
          title: "Error",
          description: "At least one permission is required",
          variant: "destructive",
        })
        return
      }

      // In a real application, you would call an API to create the key
      const generatedKey = `test_${Math.random().toString(36).substring(2, 15)}`

      const expiryDate =
        formData.expiryDays === "never"
          ? null
          : new Date(Date.now() + Number.parseInt(formData.expiryDays) * 24 * 60 * 60 * 1000).toISOString()

      const newApiKey: ApiKey = {
        id: Date.now().toString(),
        name: formData.name,
        key: "••••••••••••••••",
        permissions: formData.permissions,
        createdAt: new Date().toISOString(),
        expiryDate: expiryDate,
        isActive: true,
      }

      setApiKeys([...apiKeys, newApiKey])
      setNewKey(generatedKey)
      setDialogOpen(false)
      setNewKeyDialogOpen(true)

      // Reset form
      setFormData({
        name: "",
        permissions: [],
        expiryDays: "365",
      })
    } catch (error) {
      console.error("Error creating API key:", error)
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      })
    }
  }

  const handleCopyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey)
      toast({
        title: "Copied",
        description: "API key copied to clipboard",
      })
    }
  }

  const handleRevokeKey = async (id: string) => {
    try {
      // In a real application, you would call an API to revoke the key
      const updatedKeys = apiKeys.map((key) => (key.id === id ? { ...key, isActive: false } : key))
      setApiKeys(updatedKeys)

      toast({
        title: "Success",
        description: "API key revoked successfully",
      })
    } catch (error) {
      console.error("Error revoking API key:", error)
      toast({
        title: "Error",
        description: "Failed to revoke API key",
        variant: "destructive",
      })
    }
  }

  const handleRegenerateKey = async (id: string) => {
    try {
      // In a real application, you would call an API to regenerate the key
      const generatedKey = `test_${Math.random().toString(36).substring(2, 15)}`

      setNewKey(generatedKey)
      setNewKeyDialogOpen(true)

      toast({
        title: "Success",
        description: "API key regenerated successfully",
      })
    } catch (error) {
      console.error("Error regenerating API key:", error)
      toast({
        title: "Error",
        description: "Failed to regenerate API key",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="p-6">Loading API keys...</div>
  }

  return (
    <RoleGuard requiredPermission="canManageApiKeys">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Key Management</h2>
          <p className="text-muted-foreground">Create and manage API keys for external integrations</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>View and manage all API keys in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">{apiKey.name}</TableCell>
                    <TableCell>{apiKey.key}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {apiKey.permissions.map((permission) => (
                          <Badge key={permission} variant="outline">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(apiKey.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {apiKey.expiryDate ? new Date(apiKey.expiryDate).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={apiKey.isActive ? "default" : "secondary"}
                        className={apiKey.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {apiKey.isActive ? "Active" : "Revoked"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateKey(apiKey.id)}
                          disabled={!apiKey.isActive}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeKey(apiKey.id)}
                          disabled={!apiKey.isActive}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>Create a new API key for external integrations</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Key Name</Label>
              <Input
                id="name"
                placeholder="Enter key name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="read"
                    checked={formData.permissions.includes("read")}
                    onCheckedChange={(checked) => handlePermissionChange("read", !!checked)}
                  />
                  <Label htmlFor="read" className="font-normal">
                    Read (View leads and data)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="write"
                    checked={formData.permissions.includes("write")}
                    onCheckedChange={(checked) => handlePermissionChange("write", !!checked)}
                  />
                  <Label htmlFor="write" className="font-normal">
                    Write (Create and update leads)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delete"
                    checked={formData.permissions.includes("delete")}
                    onCheckedChange={(checked) => handlePermissionChange("delete", !!checked)}
                  />
                  <Label htmlFor="delete" className="font-normal">
                    Delete (Remove leads and data)
                  </Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDays">Expiry</Label>
              <select
                id="expiryDays"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.expiryDays}
                onChange={(e) => handleInputChange("expiryDays", e.target.value)}
              >
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
                <option value="never">Never expires</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey}>Create Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newKeyDialogOpen} onOpenChange={setNewKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>Copy your API key now. For security reasons, it won't be shown again.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Input value={newKey || ""} readOnly className="pr-10 font-mono text-sm" />
                <Key className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              <Button variant="outline" size="icon" onClick={handleCopyKey}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Make sure to store this key securely. You won't be able to see it again.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewKeyDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </RoleGuard>
  )
}
