"use client"

import { ReactNode } from 'react'
import { useRoleAccess, type RolePermissions } from '@/hooks/use-role-access'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield } from 'lucide-react'

interface RoleGuardProps {
  children: ReactNode
  requiredPermission?: keyof RolePermissions
  requiredPermissions?: (keyof RolePermissions)[]
  requireAll?: boolean // If true, user must have ALL permissions. If false, user needs ANY permission
  fallback?: ReactNode
  showError?: boolean
}

export function RoleGuard({
  children,
  requiredPermission,
  requiredPermissions = [],
  requireAll = false,
  fallback,
  showError = true,
}: RoleGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, userRole } = useRoleAccess()

  // Build the permission list
  const permissionList = requiredPermission 
    ? [requiredPermission, ...requiredPermissions]
    : requiredPermissions

  // Check permissions
  let hasAccess = false
  
  if (permissionList.length === 0) {
    // No specific permissions required, allow access
    hasAccess = true
  } else if (requireAll) {
    // User must have ALL permissions
    hasAccess = hasAllPermissions(permissionList)
  } else {
    // User needs ANY of the permissions
    hasAccess = hasAnyPermission(permissionList)
  }

  if (hasAccess) {
    return <>{children}</>
  }

  // Access denied
  if (fallback) {
    return <>{fallback}</>
  }

  if (showError) {
    return (
      <Alert variant="destructive" className="m-4">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Access Denied</strong>
          <br />
          Your role ({userRole}) does not have permission to access this feature.
          {permissionList.length > 0 && (
            <>
              <br />
              <span className="text-sm text-muted-foreground">
                Required permission{permissionList.length > 1 ? 's' : ''}: {permissionList.join(', ')}
              </span>
            </>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return null
}

// Convenience components for common use cases
export function AdminOnly({ children, fallback, showError = true }: { 
  children: ReactNode
  fallback?: ReactNode
  showError?: boolean 
}) {
  return (
    <RoleGuard 
      requiredPermission="canManageUsers" 
      fallback={fallback}
      showError={showError}
    >
      {children}
    </RoleGuard>
  )
}

export function ManagerOrAdmin({ children, fallback, showError = true }: { 
  children: ReactNode
  fallback?: ReactNode
  showError?: boolean 
}) {
  return (
    <RoleGuard 
      requiredPermissions={["canManageClients", "canManageUsers"]}
      requireAll={false} // User needs ANY of these permissions
      fallback={fallback}
      showError={showError}
    >
      {children}
    </RoleGuard>
  )
}
