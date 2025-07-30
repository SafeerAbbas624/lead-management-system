"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useRoleAccess } from "@/hooks/use-role-access"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const { hasAnyPermission, userRole } = useRoleAccess()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  // Check if user has any admin permissions
  const hasAdminAccess = hasAnyPermission([
    'canManageUsers',
    'canAccessSystemSettings',
    'canManageApiKeys',
    'canViewActivityLogs',
    'canManageSuppliers'
  ])

  if (!hasAdminAccess) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Access Denied</strong>
            <br />
            Your role ({userRole}) does not have permission to access the admin panel.
            <br />
            <span className="text-sm text-muted-foreground">
              Contact your administrator to request access.
            </span>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <div className="space-y-6">{children}</div>
}
