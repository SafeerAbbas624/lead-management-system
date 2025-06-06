// frontend/src/services/leadService.js

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token'); // or however you store your auth token
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export async function fetchLeads() {
  console.log('Fetching leads...');
  const res = await fetch("/api/leads", {
    headers: getAuthHeaders()
  });
  console.log('Fetch leads response:', res.status, res.statusText);
  if (!res.ok) {
    console.error('Failed to fetch leads:', res.statusText);
    return [];
  }
  const data = await res.json();
  console.log('Fetched leads:', data);
  return data;
}

export async function addLead(lead) {
  console.log('Adding lead:', lead);
  const res = await fetch("/api/leads", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(lead),
  });
  console.log('Add lead response:', res.status, res.statusText);
  if (!res.ok) {
    console.error('Failed to add lead:', res.statusText);
  }
  return res.ok;
}

export async function editLead(lead) {
  console.log('Editing lead:', lead);
  const res = await fetch(`/api/leads/${lead.id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(lead),
  });
  console.log('Edit lead response:', res.status, res.statusText);
  if (!res.ok) {
    console.error('Failed to edit lead:', res.statusText);
  }
  return res.ok;
}

export async function changeLeadStatus(leadId, newStatus) {
  console.log('Changing lead status:', { leadId, newStatus });
  const res = await fetch(`/api/leads/${leadId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ leadstatus: newStatus }),
  });
  console.log('Change status response:', res.status, res.statusText);
  if (!res.ok) {
    console.error('Failed to change lead status:', res.statusText);
  }
  return res.ok;
}

export async function deleteLead(leadId) {
  console.log('Deleting lead:', leadId);
  const res = await fetch(`/api/leads/${leadId}`, {
    method: "DELETE",
    headers: getAuthHeaders()
  });
  console.log('Delete lead response:', res.status, res.statusText);
  if (!res.ok) {
    console.error('Failed to delete lead:', res.statusText);
  }
  return res.ok;
} 