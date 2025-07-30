/**
 * Activity Logger Utility
 * 
 * This utility provides functions to log user activities throughout the application
 * for audit trail and monitoring purposes.
 */

export interface ActivityLogData {
  activityType: string;
  userId?: number;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an activity to the database
 */
export async function logActivity(data: ActivityLogData): Promise<boolean> {
  try {
    // Get client IP and user agent if not provided
    const activityData = {
      ...data,
      ipAddress: data.ipAddress || getClientIP(),
      userAgent: data.userAgent || getUserAgent(),
    };

    const response = await fetch('/api/admin/activity-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activityData),
    });

    if (!response.ok) {
      console.error('Failed to log activity:', response.statusText);
      return false;
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error logging activity:', error);
    return false;
  }
}

/**
 * Get client IP address (best effort)
 */
function getClientIP(): string {
  // This is a simplified version - in a real app you might want to use a service
  // or check headers like X-Forwarded-For, X-Real-IP, etc.
  return 'unknown';
}

/**
 * Get user agent string
 */
function getUserAgent(): string {
  if (typeof window !== 'undefined') {
    return window.navigator.userAgent;
  }
  return 'unknown';
}

/**
 * Predefined activity types for consistency
 */
export const ActivityTypes = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  
  // CRUD Operations
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  
  // File Operations
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  EXPORT: 'export',
  
  // Lead Management
  DISTRIBUTE_LEADS: 'distribute_leads',
  PROCESS_LEADS: 'process_leads',
  CLEAN_LEADS: 'clean_leads',
  
  // System Operations
  SYSTEM_CONFIG: 'system_config',
  USER_MANAGEMENT: 'user_management',
  
  // API Operations
  API_ACCESS: 'api_access',
} as const;

/**
 * Predefined resource types for consistency
 */
export const ResourceTypes = {
  USER: 'user',
  LEAD: 'lead',
  BATCH: 'batch',
  SUPPLIER: 'supplier',
  CLIENT: 'client',
  DNC_ENTRY: 'dnc_entry',
  AUTH: 'auth',
  SYSTEM: 'system',
  API_KEY: 'api_key',
  DISTRIBUTION: 'distribution',
} as const;

/**
 * Helper functions for common activities
 */
export const ActivityLogger = {
  /**
   * Log user login
   */
  logLogin: (userId: number, details?: Record<string, any>) =>
    logActivity({
      activityType: ActivityTypes.LOGIN,
      userId,
      resourceType: ResourceTypes.AUTH,
      details: { method: 'password', ...details },
    }),

  /**
   * Log user logout
   */
  logLogout: (userId: number) =>
    logActivity({
      activityType: ActivityTypes.LOGOUT,
      userId,
      resourceType: ResourceTypes.AUTH,
    }),

  /**
   * Log file upload
   */
  logUpload: (userId: number, filename: string, batchId?: string, details?: Record<string, any>) =>
    logActivity({
      activityType: ActivityTypes.UPLOAD,
      userId,
      resourceType: ResourceTypes.BATCH,
      resourceId: batchId,
      details: { filename, ...details },
    }),

  /**
   * Log lead distribution
   */
  logLeadDistribution: (userId: number, batchId: string, details: Record<string, any>) =>
    logActivity({
      activityType: ActivityTypes.DISTRIBUTE_LEADS,
      userId,
      resourceType: ResourceTypes.BATCH,
      resourceId: batchId,
      details,
    }),

  /**
   * Log user creation
   */
  logUserCreate: (adminUserId: number, newUserId: string, details?: Record<string, any>) =>
    logActivity({
      activityType: ActivityTypes.CREATE,
      userId: adminUserId,
      resourceType: ResourceTypes.USER,
      resourceId: newUserId,
      details,
    }),

  /**
   * Log user update
   */
  logUserUpdate: (adminUserId: number, targetUserId: string, details?: Record<string, any>) =>
    logActivity({
      activityType: ActivityTypes.UPDATE,
      userId: adminUserId,
      resourceType: ResourceTypes.USER,
      resourceId: targetUserId,
      details,
    }),

  /**
   * Log lead status update
   */
  logLeadUpdate: (userId: number, leadId: string, details?: Record<string, any>) =>
    logActivity({
      activityType: ActivityTypes.UPDATE,
      userId,
      resourceType: ResourceTypes.LEAD,
      resourceId: leadId,
      details,
    }),

  /**
   * Log data export
   */
  logExport: (userId: number, resourceType: string, details?: Record<string, any>) =>
    logActivity({
      activityType: ActivityTypes.EXPORT,
      userId,
      resourceType,
      details,
    }),

  /**
   * Log system configuration changes
   */
  logSystemConfig: (userId: number, details: Record<string, any>) =>
    logActivity({
      activityType: ActivityTypes.SYSTEM_CONFIG,
      userId,
      resourceType: ResourceTypes.SYSTEM,
      details,
    }),
};
