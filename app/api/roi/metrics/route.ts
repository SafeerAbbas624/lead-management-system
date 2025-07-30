import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Get total leads count
    const { count: totalLeadsCount, error: leadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    if (leadsError) throw leadsError;

    // Get leads data for recent activity calculation
    const { data: totalLeadsData, error: leadsDataError } = await supabase
      .from('leads')
      .select('id, createdat, leadcost')
      .order('createdat', { ascending: false });

    if (leadsDataError) throw leadsDataError;

    // Get sold leads from clients_history
    const { data: soldLeadsData, error: soldError } = await supabase
      .from('clients_history')
      .select('id, selling_cost, distributed_at, lead_id')
      .order('distributed_at', { ascending: false });

    if (soldError) throw soldError;

    // Get lead distributions for total revenue calculation
    const { data: distributionsData, error: distributionsError } = await supabase
      .from('lead_distributions')
      .select('id, selling_price_per_sheet, leadsallocated, createdat')
      .not('selling_price_per_sheet', 'is', null);

    if (distributionsError) throw distributionsError;

    // Get upload batches for cost data
    const { data: batchesData, error: batchesError } = await supabase
      .from('upload_batches')
      .select('id, total_buying_price, totalleads, createdat')
      .not('total_buying_price', 'is', null);

    if (batchesError) throw batchesError;

    // Get suppliers count
    const { data: suppliersData, error: suppliersError } = await supabase
      .from('suppliers')
      .select('id, status')
      .eq('status', 'Active');

    if (suppliersError) throw suppliersError;

    // Get clients count
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id, isactive')
      .eq('isactive', true);

    if (clientsError) throw clientsError;

    // Calculate metrics
    const totalLeads = totalLeadsCount || 0;
    const soldLeads = soldLeadsData?.length || 0;
    const conversionRate = totalLeads > 0 ? (soldLeads / totalLeads) * 100 : 0;

    // Calculate total revenue from lead_distributions.selling_price_per_sheet
    const totalRevenue = distributionsData?.reduce((sum, distribution) => {
      return sum + (parseFloat(distribution.selling_price_per_sheet) || 0);
    }, 0) || 0;

    // Debug logging (can be removed in production)
    console.log('ROI Metrics - Total leads:', totalLeads, 'Sold leads:', soldLeads, 'Revenue:', totalRevenue);

    // Calculate total cost
    const totalCost = batchesData?.reduce((sum, batch) => {
      return sum + (parseFloat(batch.total_buying_price) || 0);
    }, 0) || 0;

    // Calculate profit and ROI
    const totalProfit = totalRevenue - totalCost;
    const roi = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    // Calculate average cost per lead
    const totalBatchLeads = batchesData?.reduce((sum, batch) => sum + (batch.totalleads || 0), 0) || 0;
    const avgCostPerLead = totalBatchLeads > 0 ? totalCost / totalBatchLeads : 0;

    // Calculate average revenue per sold lead
    const avgRevenuePerLead = soldLeads > 0 ? totalRevenue / soldLeads : 0;

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentLeads = totalLeadsData?.filter(lead => 
      new Date(lead.createdat) >= thirtyDaysAgo
    ).length || 0;

    const recentSales = soldLeadsData?.filter(sale => 
      new Date(sale.distributed_at) >= thirtyDaysAgo
    ).length || 0;

    const recentRevenue = distributionsData?.filter(distribution =>
      new Date(distribution.createdat) >= thirtyDaysAgo
    ).reduce((sum, distribution) => sum + (parseFloat(distribution.selling_price_per_sheet) || 0), 0) || 0;

    const metrics = {
      overview: {
        totalLeads,
        soldLeads,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalProfit: parseFloat(totalProfit.toFixed(2)),
        roi: parseFloat(roi.toFixed(2)),
        avgCostPerLead: parseFloat(avgCostPerLead.toFixed(2)),
        avgRevenuePerLead: parseFloat(avgRevenuePerLead.toFixed(2)),
        activeSuppliers: suppliersData?.length || 0,
        activeClients: clientsData?.length || 0
      },
      recent: {
        leadsLast30Days: recentLeads,
        salesLast30Days: recentSales,
        revenueLast30Days: parseFloat(recentRevenue.toFixed(2))
      },
      trends: {
        // This will be populated by other endpoints
        dailyMetrics: [],
        supplierPerformance: []
      }
    };

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error fetching ROI metrics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch ROI metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
