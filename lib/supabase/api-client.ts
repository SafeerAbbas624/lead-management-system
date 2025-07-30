import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

// Helper function to handle API errors
const handleError = (error: any) => {
  console.error('Supabase error:', error);
  throw error;
};

// Supplier related methods
export const supplierApi = {
  // Get all suppliers
  async getAll() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) handleError(error);
    return data || [];
  },

  // Create a new supplier
  async create(supplierData: {
    name: string;
    email: string;
    contact_person?: string;
    lead_cost?: number;
    status?: string;
  }) {
    const apikey = `sup_${crypto.randomUUID().replace(/-/g, '')}`;

    const { data, error } = await supabase
      .from('suppliers')
      .insert([
        {
          name: supplierData.name,
          email: supplierData.email,
          contact_person: supplierData.contact_person,
          lead_cost: supplierData.lead_cost,
          apikey: apikey,
          status: supplierData.status || 'Active',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) handleError(error);
    return data;
  },

  // Get a single supplier by ID
  async getById(id: number) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) handleError(error);
    return data;
  },

  // Update a supplier
  async update(id: number, updateData: Partial<{
    name: string;
    email: string;
    contact_person: string | null;
    lead_cost: number | null;
    status: string;
    apikey?: string;
  }>) {
    const { data, error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) handleError(error);
    return data;
  },

  // Delete a supplier
  async delete(id: number) {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    
    if (error) handleError(error);
    return { success: true };
  },

  // Get supplier metrics (leads, acceptance rate, etc.)
  async getMetrics(supplierId: number) {
    // Get total leads
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('supplierid', supplierId);

    // Get accepted leads
    const { count: acceptedLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('supplierid', supplierId)
      .eq('status', 'accepted');

    // Calculate acceptance rate
    const acceptanceRate = totalLeads && totalLeads > 0 
      ? Math.round((acceptedLeads || 0) / totalLeads * 100) 
      : 0;

    return {
      totalLeads: totalLeads || 0,
      acceptedLeads: acceptedLeads || 0,
      acceptanceRate: acceptanceRate
    };
  }
};

// Export the Supabase client for direct use if needed
export default supabase;
