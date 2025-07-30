import { useAuth } from '@/lib/auth-context'

export type UserRole = 'Admin' | 'Manager' | 'Viewer'

export interface RolePermissions {
  // User Management
  canManageUsers: boolean
  canCreateUsers: boolean
  canEditUsers: boolean
  canDeleteUsers: boolean
  
  // System Administration
  canAccessSystemSettings: boolean
  canManageApiKeys: boolean
  canViewActivityLogs: boolean
  
  // Data Management
  canManageSuppliers: boolean
  canManageClients: boolean
  canUploadLeads: boolean
  canEditLeads: boolean
  canDeleteLeads: boolean
  canExportLeads: boolean
  
  // Reports and Analytics
  canViewReports: boolean
  canCreateReports: boolean
  canViewDashboard: boolean
  canViewROIDashboard: boolean
  
  // DNC Management
  canManageDNC: boolean
  
  // Lead Distribution
  canManageDistribution: boolean
}

const rolePermissions: Record<UserRole, RolePermissions> = {
  Admin: {
    // User Management - Full access
    canManageUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    
    // System Administration - Full access
    canAccessSystemSettings: true,
    canManageApiKeys: true,
    canViewActivityLogs: true,
    
    // Data Management - Full access
    canManageSuppliers: true,
    canManageClients: true,
    canUploadLeads: true,
    canEditLeads: true,
    canDeleteLeads: true,
    canExportLeads: true,
    
    // Reports and Analytics - Full access
    canViewReports: true,
    canCreateReports: true,
    canViewDashboard: true,
    canViewROIDashboard: true,
    
    // DNC Management - Full access
    canManageDNC: true,
    
    // Lead Distribution - Full access
    canManageDistribution: true,
  },
  
  Manager: {
    // User Management - No access
    canManageUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    
    // System Administration - Limited access
    canAccessSystemSettings: true, // Allow managers to access their profile settings
    canManageApiKeys: false,
    canViewActivityLogs: true, // Can view but not manage
    
    // Data Management - Full access except suppliers
    canManageSuppliers: false, // Cannot manage suppliers
    canManageClients: true,
    canUploadLeads: true,
    canEditLeads: true,
    canDeleteLeads: true,
    canExportLeads: true,
    
    // Reports and Analytics - Full access
    canViewReports: true,
    canCreateReports: true,
    canViewDashboard: true,
    canViewROIDashboard: true,
    
    // DNC Management - Full access
    canManageDNC: true,
    
    // Lead Distribution - Full access
    canManageDistribution: true,
  },
  
  Viewer: {
    // User Management - No access
    canManageUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    
    // System Administration - Profile access only
    canAccessSystemSettings: true, // Allow viewers to access their profile settings
    canManageApiKeys: false,
    canViewActivityLogs: false,
    
    // Data Management - Read-only access
    canManageSuppliers: false,
    canManageClients: false,
    canUploadLeads: false,
    canEditLeads: false,
    canDeleteLeads: false,
    canExportLeads: true, // Can export but not modify
    
    // Reports and Analytics - Read-only access
    canViewReports: true,
    canCreateReports: false,
    canViewDashboard: true,
    canViewROIDashboard: true,
    
    // DNC Management - Read-only access
    canManageDNC: false,
    
    // Lead Distribution - No access
    canManageDistribution: false,
  },
}

export function useRoleAccess() {
  const { user } = useAuth()
  
  const userRole = user?.role as UserRole
  const permissions = userRole ? rolePermissions[userRole] : null
  
  const hasPermission = (permission: keyof RolePermissions): boolean => {
    if (!permissions) return false
    return permissions[permission]
  }
  
  const hasAnyPermission = (permissionList: (keyof RolePermissions)[]): boolean => {
    return permissionList.some(permission => hasPermission(permission))
  }
  
  const hasAllPermissions = (permissionList: (keyof RolePermissions)[]): boolean => {
    return permissionList.every(permission => hasPermission(permission))
  }
  
  return {
    userRole,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin: userRole === 'Admin',
    isManager: userRole === 'Manager',
    isViewer: userRole === 'Viewer',
  }
}
