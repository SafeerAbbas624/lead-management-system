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
      .select('id, supplierid, totalleads, cleanedleads, duplicateleads, total_buying_price, buying_price_per_lead')
      .not('supplierid', 'is', null);

    // Get suppliers separately
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('id, name, lead_cost');

    if (batchesError) throw batchesError;
    if (suppliersError) throw suppliersError;

    // Create supplier lookup map
    const supplierMap = new Map();
    suppliers?.forEach(supplier => {
      supplierMap.set(supplier.id, supplier);
    });

    if (!batches?.length) {
      return NextResponse.json({ data: [] });
    }

    // Get all leads with their upload batch IDs
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, leadstatus, uploadbatchid, supplierid')
      .not('uploadbatchid', 'is', null);

    if (leadsError) throw leadsError;

    // Process data to calculate ROI metrics by supplier
    const supplierROIMap = new Map<number, SupplierROI>();

    // Initialize supplier data from batches
    batches.forEach(batch => {
      if (!batch.supplierid) return;

      const supplier = supplierMap.get(batch.supplierid);
      if (!supplier) return;

      if (!supplierROIMap.has(batch.supplierid)) {
        supplierROIMap.set(batch.supplierid, {
          supplier: supplier.name || 'Unknown',
          supplierId: batch.supplierid,
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

      // Add batch data to supplier totals
      const supplierData = supplierROIMap.get(batch.supplierid)!;
      supplierData.totalLeads += batch.totalleads || 0;
      supplierData.totalCost += batch.total_buying_price || 0;
    });

    // Process leads and count by supplier
    leads?.forEach(lead => {
      if (!lead.supplierid) return;

      const supplierData = supplierROIMap.get(lead.supplierid);
      if (!supplierData) return;

      // Check if lead is converted
      const status = lead.leadstatus?.toLowerCase() || '';
      if (status === 'converted' || status === 'closed won' || status.includes('converted')) {
        supplierData.convertedLeads++;
      }
    });

    console.log('Supplier ROI data processed:', supplierROIMap.size, 'suppliers');

    // Calculate financial metrics for each supplier
    const roiData = Array.from(supplierROIMap.values()).map(supplier => {
      const supplierInfo = supplierMap.get(supplier.supplierId);
      const leadCost = supplierInfo?.lead_cost || 0;

      // Assuming $50 revenue per converted lead (adjust as needed)
      const revenuePerConversion = 50;
      const totalRevenue = supplier.convertedLeads * revenuePerConversion;
      const profit = totalRevenue - supplier.totalCost;
      
      return {
        ...supplier,
        totalCost: parseFloat(supplier.totalCost.toFixed(2)),
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        conversionRate: supplier.totalLeads > 0
          ? parseFloat(((supplier.convertedLeads / supplier.totalLeads) * 100).toFixed(2))
          : 0,
        costPerLead: supplier.totalLeads > 0
          ? parseFloat((supplier.totalCost / supplier.totalLeads).toFixed(2))
          : 0,
        revenuePerLead: supplier.totalLeads > 0
          ? parseFloat((totalRevenue / supplier.totalLeads).toFixed(2))
          : 0,
        profit: parseFloat(profit.toFixed(2)),
        roi: supplier.totalCost > 0
          ? parseFloat(((profit / supplier.totalCost) * 100).toFixed(2))
          : 0
      };
    });

    // Sort by ROI (highest first)
    roiData.sort((a, b) => b.roi - a.roi);

    // Add sample data if no real data exists
    if (roiData.length === 0) {
      const sampleData = [
        {
          supplier: "Sample Supplier A",
          supplierId: 999,
          totalLeads: 120,
          convertedLeads: 18,
          totalCost: 600.0,
          totalRevenue: 900.0,
          conversionRate: 15.0,
          costPerLead: 5.0,
          revenuePerLead: 7.5,
          profit: 300.0,
          roi: 50.0
        },
        {
          supplier: "Sample Supplier B",
          supplierId: 998,
          totalLeads: 80,
          convertedLeads: 8,
          totalCost: 400.0,
          totalRevenue: 400.0,
          conversionRate: 10.0,
          costPerLead: 5.0,
          revenuePerLead: 5.0,
          profit: 0.0,
          roi: 0.0
        },
        {
          supplier: "Sample Supplier C",
          supplierId: 997,
          totalLeads: 60,
          convertedLeads: 3,
          totalCost: 300.0,
          totalRevenue: 150.0,
          conversionRate: 5.0,
          costPerLead: 5.0,
          revenuePerLead: 2.5,
          profit: -150.0,
          roi: -50.0
        }
      ];
      console.log('No real ROI data found, returning sample data for testing');
      return NextResponse.json({ data: sampleData });
    }

    console.log('Returning real supplier ROI data:', roiData.length, 'suppliers');
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
