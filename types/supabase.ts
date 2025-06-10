export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          fullName: string | null
          email: string
          role: string
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          username: string
          fullName?: string | null
          email: string
          role?: string
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          username?: string
          fullName?: string | null
          email?: string
          role?: string
          createdAt?: string
          updatedAt?: string
        }
      }
      suppliers: {
        Row: {
          id: number
          name: string
          email: string | null
          contactPerson: string | null
          apiKey: string | null
          status: string
          leadCost: number | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          name: string
          email?: string | null
          contactPerson?: string | null
          apiKey?: string | null
          status?: string
          leadCost?: number | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          name?: string
          email?: string | null
          contactPerson?: string | null
          apiKey?: string | null
          status?: string
          leadCost?: number | null
          createdAt?: string
          updatedAt?: string
        }
      }
      upload_batches: {
        Row: {
          id: number
          fileName: string
          fileType: string | null
          status: string
          totalLeads: number | null
          cleanedLeads: number | null
          duplicateLeads: number | null
          dncMatches: number | null
          processingProgress: number | null
          supplierId: number | null
          sourceName: string | null
          errorMessage: string | null
          createdAt: string
          completedAt: string | null
        }
        Insert: {
          id?: number
          fileName: string
          fileType?: string | null
          status?: string
          totalLeads?: number | null
          cleanedLeads?: number | null
          duplicateLeads?: number | null
          dncMatches?: number | null
          processingProgress?: number | null
          supplierId?: number | null
          sourceName?: string | null
          errorMessage?: string | null
          createdAt?: string
          completedAt?: string | null
        }
        Update: {
          id?: number
          fileName?: string
          fileType?: string | null
          status?: string
          totalLeads?: number | null
          cleanedLeads?: number | null
          duplicateLeads?: number | null
          dncMatches?: number | null
          processingProgress?: number | null
          supplierId?: number | null
          sourceName?: string | null
          errorMessage?: string | null
          createdAt?: string
          completedAt?: string | null
        }
      }
      leads: {
        Row: {
          id: number
          firstName: string | null
          lastName: string | null
          email: string | null
          phone: string | null
          companyName: string | null
          address: string | null
          city: string | null
          state: string | null
          zipCode: string | null
          country: string | null
          leadStatus: string | null
          leadSource: string | null
          uploadBatchId: number | null
          exclusivity: boolean | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          firstName?: string | null
          lastName?: string | null
          email?: string | null
          phone?: string | null
          companyName?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zipCode?: string | null
          country?: string | null
          leadStatus?: string | null
          leadSource?: string | null
          uploadBatchId?: number | null
          exclusivity?: boolean | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          firstName?: string | null
          lastName?: string | null
          email?: string | null
          phone?: string | null
          companyName?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zipCode?: string | null
          country?: string | null
          leadStatus?: string | null
          leadSource?: string | null
          uploadBatchId?: number | null
          exclusivity?: boolean | null
          createdAt?: string
          updatedAt?: string
        }
      }
      dnc_lists: {
        Row: {
          id: number
          name: string
          type: string
          description: string | null
          isActive: boolean | null
          createdAt: string
          lastUpdated: string | null
        }
        Insert: {
          id?: number
          name: string
          type: string
          description?: string | null
          isActive?: boolean | null
          createdAt?: string
          lastUpdated?: string | null
        }
        Update: {
          id?: number
          name?: string
          type?: string
          description?: string | null
          isActive?: boolean | null
          createdAt?: string
          lastUpdated?: string | null
        }
      }
      dnc_entries: {
        Row: {
          id: number
          value: string
          valueType: string
          source: string | null
          reason: string | null
          dncListId: number | null
          createdAt: string
          expiryDate: string | null
        }
        Insert: {
          id?: number
          value: string
          valueType: string
          source?: string | null
          reason?: string | null
          dncListId?: number | null
          createdAt?: string
          expiryDate?: string | null
        }
        Update: {
          id?: number
          value?: string
          valueType?: string
          source?: string | null
          reason?: string | null
          dncListId?: number | null
          createdAt?: string
          expiryDate?: string | null
        }
      }
      clients: {
        Row: {
          id: number
          name: string
          email: string | null
          phone: string | null
          contactPerson: string | null
          deliveryFormat: string | null
          deliverySchedule: string | null
          percentAllocation: number | null
          fixedAllocation: number | null
          isActive: boolean | null
          createdAt: string
          updatedAt: string | null
        }
        Insert: {
          id?: number
          name: string
          email?: string | null
          phone?: string | null
          contactPerson?: string | null
          deliveryFormat?: string | null
          deliverySchedule?: string | null
          percentAllocation?: number | null
          fixedAllocation?: number | null
          isActive?: boolean | null
          createdAt?: string
          updatedAt?: string | null
        }
        Update: {
          id?: number
          name?: string
          email?: string | null
          phone?: string | null
          contactPerson?: string | null
          deliveryFormat?: string | null
          deliverySchedule?: string | null
          percentAllocation?: number | null
          fixedAllocation?: number | null
          isActive?: boolean | null
          createdAt?: string
          updatedAt?: string | null
        }
      }
      lead_distributions: {
        Row: {
          id: number
          batchId: number | null
          clientId: number | null
          leadsAllocated: number
          deliveryStatus: string | null
          deliveryDate: string | null
          createdAt: string
        }
        Insert: {
          id?: number
          batchId?: number | null
          clientId?: number | null
          leadsAllocated: number
          deliveryStatus?: string | null
          deliveryDate?: string | null
          createdAt?: string
        }
        Update: {
          id?: number
          batchId?: number | null
          clientId?: number | null
          leadsAllocated?: number
          deliveryStatus?: string | null
          deliveryDate?: string | null
          createdAt?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
