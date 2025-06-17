import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type SupplierROI = {
  supplier: string;
  supplierId: number;
  totalLeads: number;
  convertedLeads: number;
  totalCost: number;
  totalRevenue: number;
  conversionRate: number;
  costPerLead: number;
  revenuePerLead: number;
  profit: number;
  roi: number;
};

type LeadRecord = {
  id: number;
  leadstatus: string | null;
  uploadBatchId: number | null;
};

type UploadBatch = {
  id: number;
  supplierId: number | null;
  supplier: {
    id: number;
    name: string;
    leadcost: number | null;
  } | null;
};

export async function GET() {
  try {
    // First, get all upload batches with their supplier information
    const { data: batches, error: batchesError } = await supabase
      .from('upload_batches')
      .select(`
        id,
        supplierId,
        supplier:supplierId (
          id,
          name,
          leadcost
        )
      `)
      .not('supplierId', 'is', null);

    if (batchesError) throw batchesError;
    if (!batches?.length) {
      return NextResponse.json({ data: [] });
    }

    // Get all leads with their upload batch IDs
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, leadstatus, uploadBatchId')
      .not('uploadBatchId', 'is', null);

    if (leadsError) throw leadsError;

    // Process data to calculate ROI metrics by supplier
    const supplierMap = new Map<number, SupplierROI>();

    // Initialize supplier data
    batches.forEach(batch => {
      // Handle case where supplier might be an array (from Supabase relation)
      const supplier = Array.isArray(batch.supplier) ? batch.supplier[0] : batch.supplier;
      if (!supplier || !batch.supplierId) return;
      
      if (!supplierMap.has(batch.supplierId)) {
        supplierMap.set(batch.supplierId, {
          supplier: supplier.name || 'Unknown',
          supplierId: batch.supplierId,
          totalLeads: 0,
          convertedLeads: 0,
          totalCost: 0,
          totalRevenue: 0,
          conversionRate: 0,
          costPerLead: 0,
          revenuePerLead: 0,
          profit: 0,
          roi: 0
        });
      }
    });

    // Process leads and count by supplier
    leads?.forEach(lead => {
      if (!lead.uploadBatchId) return;
      
      const batch = batches.find(b => b.id === lead.uploadBatchId);
      if (!batch?.supplierId || !batch.supplier) return;
      
      const supplierData = supplierMap.get(batch.supplierId);
      if (!supplierData) return;
      
      // Update lead counts
      supplierData.totalLeads++;
      
      // Check if lead is converted
      if (lead.leadstatus?.toLowerCase() === 'converted') {
        supplierData.convertedLeads++;
      }
    });

    // Calculate financial metrics for each supplier
    const roiData = Array.from(supplierMap.values()).map(supplier => {
      const batch = batches.find(b => b.supplierId === supplier.supplierId);
      const supplierData = batch?.supplier ? (Array.isArray(batch.supplier) ? batch.supplier[0] : batch.supplier) : null;
      const leadCost = supplierData?.leadcost || 0;
      const totalCost = supplier.totalLeads * leadCost;
      
      // Assuming $50 revenue per converted lead (adjust as needed)
      const revenuePerConversion = 50;
      const totalRevenue = supplier.convertedLeads * revenuePerConversion;
      const profit = totalRevenue - totalCost;
      
      return {
        ...supplier,
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        conversionRate: supplier.totalLeads > 0 
          ? parseFloat(((supplier.convertedLeads / supplier.totalLeads) * 100).toFixed(2)) 
          : 0,
        costPerLead: supplier.totalLeads > 0 
          ? parseFloat((totalCost / supplier.totalLeads).toFixed(2)) 
          : 0,
        revenuePerLead: supplier.totalLeads > 0 
          ? parseFloat((totalRevenue / supplier.totalLeads).toFixed(2)) 
          : 0,
        profit: parseFloat(profit.toFixed(2)),
        roi: totalCost > 0 
          ? parseFloat(((profit / totalCost) * 100).toFixed(2)) 
          : 0
      };
    });

    // Sort by ROI (highest first)
    roiData.sort((a, b) => b.roi - a.roi);

    return NextResponse.json({ data: roiData });

  } catch (error: any) {
    console.error('Error in supplier-roi endpoint:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch supplier ROI data',
        details: error.message || 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
