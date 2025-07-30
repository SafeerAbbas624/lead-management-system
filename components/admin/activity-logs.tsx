"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Filter } from "lucide-react"
import { RoleGuard } from "@/components/auth/role-guard"

interface ActivityLog {
  id: string
  activityType: string
  userId: string
  userName: string
  resourceType: string
  resourceId: string
  details: any
  ipAddress: string
  userAgent: string
  timestamp: string
}

export function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("all")
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("all")

  useEffect(() => {
    fetchActivityLogs()
  }, [activityTypeFilter, resourceTypeFilter])

  const fetchActivityLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query parameters
      const params = new URLSearchParams({
        limit: '100'
      })

      if (activityTypeFilter && activityTypeFilter !== 'all') {
        params.append('activityType', activityTypeFilter)
      }

      if (resourceTypeFilter && resourceTypeFilter !== 'all') {
        params.append('resourceType', resourceTypeFilter)
      }

      const response = await fetch(`/api/admin/activity-logs?${params}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setLogs(result.data || [])
      } else {
        setError(result.error || 'Failed to fetch activity logs')
        setLogs([])
      }
    } catch (error) {
      console.error("Error fetching activity logs:", error)
      setError(error instanceof Error ? error.message : 'Failed to fetch activity logs')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case "create":
        return "Create"
      case "update":
        return "Update"
      case "delete":
        return "Delete"
      case "login":
        return "Login"
      case "logout":
        return "Logout"
      case "distribute_leads":
        return "Distribute Leads"
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ")
    }
  }

  const getActivityTypeBadge = (type: string) => {
    switch (type) {
      case "create":
        return "bg-green-100 text-green-800 border-green-200"
      case "update":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "delete":
        return "bg-red-100 text-red-800 border-red-200"
      case "login":
      case "logout":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "distribute_leads":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case "lead":
        return "Lead"
      case "user":
        return "User"
      case "dnc_entry":
        return "DNC Entry"
      case "auth":
        return "Authentication"
      case "batch":
        return "Batch"
      default:
        return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ")
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resourceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesActivityType = activityTypeFilter === "all" || log.activityType === activityTypeFilter
    const matchesResourceType = resourceTypeFilter === "all" || log.resourceType === resourceTypeFilter

    return matchesSearch && matchesActivityType && matchesResourceType
  })

  const uniqueActivityTypes = Array.from(new Set(logs.map((log) => log.activityType)))
  const uniqueResourceTypes = Array.from(new Set(logs.map((log) => log.resourceType)))

  const handleExportLogs = () => {
    // In a real application, you would generate a CSV or JSON file
    console.log("Exporting logs:", filteredLogs)
    alert("Logs exported successfully")
  }

  if (loading) {
    return <div className="p-6">Loading activity logs...</div>
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Activity Logs</h3>
          <p className="text-red-600 mt-2">{error}</p>
          <p className="text-sm text-red-500 mt-2">
            The activity logs table may not exist. Please contact your administrator to set up the database schema.
          </p>
          <button
            onClick={fetchActivityLogs}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <RoleGuard requiredPermission="canViewActivityLogs">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Activity Logs</h2>
          <p className="text-muted-foreground">View and audit user activity in the system</p>
        </div>
        <Button onClick={handleExportLogs}>
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
          <CardDescription>View all user actions and system events</CardDescription>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Activity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  {uniqueActivityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getActivityTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Resource Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {uniqueResourceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getResourceTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline" className={getActivityTypeBadge(log.activityType)}>
                        {getActivityTypeLabel(log.activityType)}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.userName}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{getResourceTypeLabel(log.resourceType)}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{log.resourceId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <pre className="text-xs overflow-hidden text-ellipsis max-w-[200px]">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </TableCell>
                    <TableCell>{log.ipAddress}</TableCell>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </div>
    </RoleGuard>
  )
}
