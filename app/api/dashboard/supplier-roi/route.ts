import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

type SupplierROI = {
  supplier: string;
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

export async function GET() {
  try {
    // Fetch suppliers with their leads and conversion data
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select(`
        id,
        name,
        leadcost,
        leads:leads!inner(
          id,
          leadstatus,
          createdat
        )
      `);

    if (suppliersError) throw suppliersError;

    // Process supplier data to calculate ROI metrics
    const roiData: SupplierROI[] = suppliers.map(supplier => {
      const totalLeads = supplier.leads?.length || 0;
      const convertedLeads = supplier.leads?.filter(
        (lead: any) => lead.leadstatus?.toLowerCase() === 'converted'
      ).length || 0;
      
      const leadCost = supplier.leadcost || 0;
      const totalCost = totalLeads * leadCost;
      
      // Assuming $20 revenue per converted lead (adjust as needed)
      const revenuePerConversion = 20;
      const totalRevenue = convertedLeads * revenuePerConversion;
      const profit = totalRevenue - totalCost;
      
      return {
        supplier: supplier.name || 'Unknown',
        totalLeads,
        convertedLeads,
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        conversionRate: totalLeads > 0 ? parseFloat(((convertedLeads / totalLeads) * 100).toFixed(2)) : 0,
        costPerLead: totalLeads > 0 ? parseFloat((totalCost / totalLeads).toFixed(2)) : 0,
        revenuePerLead: totalLeads > 0 ? parseFloat((totalRevenue / totalLeads).toFixed(2)) : 0,
        profit: parseFloat(profit.toFixed(2)),
        roi: totalCost > 0 ? parseFloat(((profit / totalCost) * 100).toFixed(2)) : 0
      };
    });

    // Sort by ROI (highest first)
    roiData.sort((a, b) => b.roi - a.roi);

    return NextResponse.json({ data: roiData });

  } catch (error: any) {
    console.error('Error in supplier-roi endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier ROI data: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
