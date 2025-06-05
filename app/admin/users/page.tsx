"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2 } from "lucide-react"

interface User {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
  last_sign_in: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      // Mock data for now - replace with actual Supabase query
      const mockUsers: User[] = [
        {
          id: "1",
          email: "admin@example.com",
          full_name: "Admin User",
          role: "Admin",
          created_at: "2024-01-01",
          last_sign_in: "2024-01-15",
        },
        {
          id: "2",
          email: "manager@example.com",
          full_name: "Manager User",
          role: "Manager",
          created_at: "2024-01-05",
          last_sign_in: "2024-01-14",
        },
        {
          id: "3",
          email: "viewer@example.com",
          full_name: "Viewer User",
          role: "Viewer",
          created_at: "2024-01-10",
          last_sign_in: "2024-01-13",
        },
      ]
      setUsers(mockUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "destructive"
      case "Manager":
        return "default"
      case "Viewer":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (loading) {
    return <div className="p-6">Loading users...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their permissions</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>View and manage all users in the system</CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Created: {new Date(user.created_at).toLocaleDateString()} | Last Sign In:{" "}
                    {new Date(user.last_sign_in).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
