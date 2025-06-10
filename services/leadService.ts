import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
    
    // Debug log to check headers
    console.log('Response headers:', response.headers);
    
    // Get pagination info from headers
    const total = response.headers['x-total-count'] ? 
      parseInt(response.headers['x-total-count']) : 
      response.data.length;
      
    const totalPages = response.headers['x-total-pages'] ?
      parseInt(response.headers['x-total-pages']) :
      Math.ceil(total / pageSize);
    
    const currentPage = response.headers['x-current-page'] ?
      parseInt(response.headers['x-current-page']) :
      page;
    
    console.log('Pagination data:', { total, totalPages, currentPage, pageSize });
    
    return {
      data: response.data,
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

export const fetchLeadsWithSearch = async (searchTerm: string, page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Lead>> => {
  try {
    const response = await axios.get(`${API_URL}/api/leads`, { 
      params: { 
        search: searchTerm,
        skip: (page - 1) * pageSize,
        limit: pageSize
      } 
    });
    
    // Debug log to check headers
    console.log('Search response headers:', response.headers);
    
    // Get pagination info from headers
    const total = response.headers['x-total-count'] ? 
      parseInt(response.headers['x-total-count']) : 
      response.data.length;
      
    const totalPages = response.headers['x-total-pages'] ?
      parseInt(response.headers['x-total-pages']) :
      Math.ceil(total / pageSize);
    
    const currentPage = response.headers['x-current-page'] ?
      parseInt(response.headers['x-current-page']) :
      page;
    
    console.log('Search pagination data:', { total, totalPages, currentPage, pageSize });
    
    return {
      data: response.data,
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