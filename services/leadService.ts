import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface Lead {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  companyname: string;
  leadstatus: string;
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const fetchLeads = async (page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Lead>> => {
  try {
    const response = await axios.get(`${API_URL}/api/leads`, {
      params: {
        skip: (page - 1) * pageSize,
        limit: pageSize
      }
    });
    
    // Debug log to check response structure
    console.log('Response data structure:', response.data);

    // Handle the new API response format
    const responseData = response.data;
    const leads = responseData.leads || responseData; // Handle both formats
    const total = responseData.total || leads.length;
    const totalPages = responseData.totalPages || Math.ceil(total / pageSize);
    const currentPage = responseData.page || page;

    console.log('Pagination data:', { total, totalPages, currentPage, pageSize, leadsCount: leads.length });

    return {
      data: leads,
      total,
      page: currentPage,
      pageSize,
      totalPages
    };
  } catch (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }
};

export const addLead = async (lead: Omit<Lead, 'id'>): Promise<Lead> => {
  try {
    const response = await axios.post(`${API_URL}/api/leads`, lead);
    return response.data;
  } catch (error) {
    console.error('Error adding lead:', error);
    throw error;
  }
};

export const editLead = async (lead: Lead): Promise<Lead> => {
  try {
    const response = await axios.put(`${API_URL}/api/leads/${lead.id}`, lead);
    return response.data;
  } catch (error) {
    console.error('Error editing lead:', error);
    throw error;
  }
};

export const changeLeadStatus = async (leadId: number, newStatus: string): Promise<Lead> => {
  try {
    const response = await axios.patch(`${API_URL}/api/leads/${leadId}/status`, { leadstatus: newStatus });
    return response.data;
  } catch (error) {
    console.error('Error changing lead status:', error);
    throw error;
  }
};

export const deleteLead = async (leadId: number): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/api/leads/${leadId}`);
  } catch (error) {
    console.error('Error deleting lead:', error);
    throw error;
  }
};

export interface LeadFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sources?: string[];
  statuses?: string[];
  costMin?: number;
  costMax?: number;
  batchIds?: number[];
  tags?: string[];
  // Time-based filters
  timeFrame?: '1month' | '3months' | '6months' | '1year' | 'custom';
  // Additional filters based on database schema
  supplierIds?: number[];
  clientIds?: number[];
  exclusivity?: boolean;
  leadScoreMin?: number;
  leadScoreMax?: number;
}

export const fetchLeadsWithSearch = async (searchTerm: string, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Lead>> => {
  try {
    const response = await axios.get(`${API_URL}/api/leads`, {
      params: {
        search: searchTerm,
        skip: (page - 1) * pageSize,
        limit: pageSize
      }
    });

    // Debug log to check response structure
    console.log('Search response data structure:', response.data);

    // Handle the new API response format
    const responseData = response.data;
    const leads = responseData.leads || responseData; // Handle both formats
    const total = responseData.total || leads.length;
    const totalPages = responseData.totalPages || Math.ceil(total / pageSize);
    const currentPage = responseData.page || page;

    console.log('Search pagination data:', { total, totalPages, currentPage, pageSize, leadsCount: leads.length });

    return {
      data: leads,
      total,
      page: currentPage,
      pageSize,
      totalPages
    };
  } catch (error) {
    console.error('Error fetching leads with search:', error);
    throw error;
  }
};



export const fetchLeadsWithFilters = async (filters: LeadFilters, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Lead>> => {
  try {
    const params: any = {
      skip: (page - 1) * pageSize,
      limit: pageSize
    };

    // Add filters to params
    if (filters.search) params.search = filters.search;
    if (filters.dateFrom) params.date_from = filters.dateFrom;
    if (filters.dateTo) params.date_to = filters.dateTo;
    if (filters.sources && filters.sources.length > 0) params.sources = filters.sources.join(',');
    if (filters.statuses && filters.statuses.length > 0) params.statuses = filters.statuses.join(',');
    if (filters.costMin !== undefined) params.cost_min = filters.costMin;
    if (filters.costMax !== undefined) params.cost_max = filters.costMax;
    if (filters.batchIds && filters.batchIds.length > 0) params.batch_ids = filters.batchIds.join(',');
    if (filters.tags && filters.tags.length > 0) params.tags = filters.tags.join(',');

    const response = await axios.get(`${API_URL}/api/leads`, { params });
    
    // Debug log to check response structure
    console.log('Filters response data structure:', response.data);

    // Handle the new API response format
    const responseData = response.data;
    const leads = responseData.leads || responseData; // Handle both formats
    const total = responseData.total || leads.length;
    const totalPages = responseData.totalPages || Math.ceil(total / pageSize);
    const currentPage = responseData.page || page;

    console.log('Filters pagination data:', { total, totalPages, currentPage, pageSize, leadsCount: leads.length });

    return {
      data: leads,
      total,
      page: currentPage,
      pageSize,
      totalPages
    };
  } catch (error) {
    console.error('Error fetching leads with filters:', error);
    throw error;
  }

};





export interface LeadStats {
  totalLeads: number;
  leadsBySource: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  duplicatesBySource: Array<{
    source: string;
    duplicates: number;
    percentage: number;
  }>;
  totalBatches: number;
  processingBatches: number;
  completedBatches: number;
  failedBatches: number;
  totalDuplicates: number;
  dncMatches: number;
  leadsByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  leadsByCost: {
    totalCost: number;
    averageCost: number;
    minCost: number;
    maxCost: number;
  };
  monthOverMonthGrowth: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export const fetchLeadsStats = async (filters?: LeadFilters): Promise<LeadStats> => {
  try {
    const params: Record<string, string> = {};

    // Basic filters
    if (filters?.search) params.search = filters.search;
    if (filters?.dateFrom) params.date_from = filters.dateFrom;
    if (filters?.dateTo) params.date_to = filters.dateTo;

    // Array filters
    if (filters?.sources && filters.sources.length > 0) params.sources = filters.sources.join(',');
    if (filters?.statuses && filters.statuses.length > 0) params.statuses = filters.statuses.join(',');
    if (filters?.batchIds && filters.batchIds.length > 0) params.batch_ids = filters.batchIds.join(',');
    if (filters?.supplierIds && filters.supplierIds.length > 0) params.supplier_ids = filters.supplierIds.join(',');
    if (filters?.clientIds && filters.clientIds.length > 0) params.client_ids = filters.clientIds.join(',');
    if (filters?.tags && filters.tags.length > 0) params.tags = filters.tags.join(',');

    // Cost filters
    if (filters?.costMin !== undefined) params.cost_min = filters.costMin.toString();
    if (filters?.costMax !== undefined) params.cost_max = filters.costMax.toString();

    // Lead score filters
    if (filters?.leadScoreMin !== undefined) params.lead_score_min = filters.leadScoreMin.toString();
    if (filters?.leadScoreMax !== undefined) params.lead_score_max = filters.leadScoreMax.toString();

    // Time frame filter
    if (filters?.timeFrame) params.time_frame = filters.timeFrame;

    // Exclusivity filter
    if (filters?.exclusivity !== undefined) params.exclusivity = filters.exclusivity.toString();

    // Note: Using Next.js API route instead of Python backend for stats
    const response = await axios.get(`/api/leads/stats`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching leads stats:', error);
    throw error;
  }
};

