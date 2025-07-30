"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestAuthPage() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Authentication Test Page</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Current User State</CardTitle>
          <CardDescription>Debug information about the current authentication state</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>User Object:</strong>
              <pre className="bg-gray-100 p-2 rounded mt-2 text-sm">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
            
            <div>
              <strong>Authentication Status:</strong>
              <p className={`font-medium ${user ? 'text-green-600' : 'text-red-600'}`}>
                {user ? '✅ Authenticated' : '❌ Not Authenticated'}
              </p>
            </div>

            {user && (
              <div className="space-y-2">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>Username:</strong> {user.username}</p>
                <p><strong>Full Name:</strong> {user.fullName}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>Created:</strong> {new Date(user.createdAt).toLocaleString()}</p>
              </div>
            )}

            <div className="space-x-2">
              <Button onClick={() => window.location.href = '/dashboard'}>
                Go to Dashboard
              </Button>
              <Button onClick={() => window.location.href = '/login'} variant="outline">
                Go to Login
              </Button>
              {user && (
                <Button onClick={logout} variant="destructive">
                  Logout
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
