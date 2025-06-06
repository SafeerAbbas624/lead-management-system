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

export const fetchLeads = async (): Promise<Lead[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/leads`);
    return response.data;
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

export const fetchLeadsWithSearch = async (searchTerm: string): Promise<Lead[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/leads`, { params: { search: searchTerm } });
    return response.data;
  } catch (error) {
    console.error('Error fetching leads with search:', error);
    throw error;
  }
}; 