import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    if (!fromDate || !toDate) {
      return NextResponse.json(
        { success: false, error: 'Date range is required' },
        { status: 400 }
      );
    }

    // Get total leads count (exact count)
    const { count: totalLeadsCount, error: leadsCountError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    if (leadsCountError) throw leadsCountError;

    // Get ALL leads data (not limited by date range for total counts)
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('id, createdat, leadcost, uploadbatchid')
      .order('createdat', { ascending: true });

    if (leadsError) throw leadsError;

    // Get leads within date range for daily breakdown
    const { data: dateRangeLeadsData, error: dateRangeLeadsError } = await supabase
      .from('leads')
      .select('id, createdat, leadcost, uploadbatchid')
      .gte('createdat', fromDate)
      .lte('createdat', toDate)
      .order('createdat', { ascending: true });

    if (dateRangeLeadsError) throw dateRangeLeadsError;

    // Get sales data from lead_distributions within date range
    const { data: distributionsData, error: distributionsError } = await supabase
      .from('lead_distributions')
      .select('id, selling_price_per_sheet, leadsallocated, createdat')
      .gte('createdat', fromDate)
      .lte('createdat', toDate)
      .not('selling_price_per_sheet', 'is', null)
      .order('createdat', { ascending: true });

    if (distributionsError) throw distributionsError;

    // Get ALL sales data from clients_history for total count
    const { data: allSalesData, error: allSalesError } = await supabase
      .from('clients_history')
      .select('lead_id, distributed_at')
      .order('distributed_at', { ascending: true });

    if (allSalesError) throw allSalesError;

    // Get sales data within date range for daily breakdown
    const { data: salesData, error: salesError } = await supabase
      .from('clients_history')
      .select('lead_id, distributed_at')
      .gte('distributed_at', fromDate)
      .lte('distributed_at', toDate)
      .order('distributed_at', { ascending: true });

    if (salesError) throw salesError;

    // Get upload batches for cost data
    const { data: batchesData, error: batchesError } = await supabase
      .from('upload_batches')
      .select('id, total_buying_price, totalleads, buying_price_per_lead')
      .not('total_buying_price', 'is', null);

    if (batchesError) throw batchesError;

    // Create a map for batch costs
    const batchCostMap = new Map();
    batchesData?.forEach(batch => {
      if (batch.id) {
        batchCostMap.set(batch.id, {
          totalCost: parseFloat(batch.total_buying_price) || 0,
          totalLeads: batch.totalleads || 0,
          costPerLead: parseFloat(batch.buying_price_per_lead) || 0
        });
      }
    });

    // Create a map for sales by lead_id (for counting sold leads)
    const salesMap = new Map();
    salesData?.forEach(sale => {
      if (sale.lead_id) {
        salesMap.set(sale.lead_id, {
          saleDate: sale.distributed_at
        });
      }
    });

    // Calculate total revenue from distributions by date
    const revenueByDate = new Map();
    distributionsData?.forEach(distribution => {
      const date = new Date(distribution.createdat).toISOString().split('T')[0];
      const revenue = parseFloat(distribution.selling_price_per_sheet) || 0;

      if (revenueByDate.has(date)) {
        revenueByDate.set(date, revenueByDate.get(date) + revenue);
      } else {
        revenueByDate.set(date, revenue);
      }
    });

    // Calculate total metrics from ALL data
    const totalLeads = totalLeadsCount || 0;
    const totalSoldLeads = allSalesData?.length || 0;
    const totalConversionRate = totalLeads > 0 ? (totalSoldLeads / totalLeads) * 100 : 0;



    // Calculate total revenue and cost
    const { data: allDistributionsData, error: allDistributionsError } = await supabase
      .from('lead_distributions')
      .select('selling_price_per_sheet')
      .not('selling_price_per_sheet', 'is', null);

    if (allDistributionsError) throw allDistributionsError;

    const totalRevenue = allDistributionsData?.reduce((sum, dist) =>
      sum + (parseFloat(dist.selling_price_per_sheet) || 0), 0) || 0;

    const totalCost = batchesData?.reduce((sum, batch) =>
      sum + (parseFloat(batch.total_buying_price) || 0), 0) || 0;

    const totalProfit = totalRevenue - totalCost;

    // Group data by date (daily aggregation) - using date range data for chart
    const dailyData = new Map();

    // Process leads data within date range for daily breakdown
    dateRangeLeadsData?.forEach(lead => {
      const date = new Date(lead.createdat).toISOString().split('T')[0];
      
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          date,
          totalLeads: 0,
          soldLeads: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          conversionRate: 0
        });
      }

      const dayData = dailyData.get(date);
      dayData.totalLeads++;

      // Calculate cost for this lead
      if (lead.uploadbatchid && batchCostMap.has(lead.uploadbatchid)) {
        const batchInfo = batchCostMap.get(lead.uploadbatchid);
        dayData.cost += batchInfo.costPerLead;
      } else if (lead.leadcost) {
        dayData.cost += parseFloat(lead.leadcost) || 0;
      }

      // Check if this lead was sold
      if (salesMap.has(lead.id)) {
        dayData.soldLeads++;
      }

      // Add revenue from distributions for this date
      if (revenueByDate.has(date)) {
        dayData.revenue = revenueByDate.get(date);
      }

      // Calculate derived metrics
      dayData.profit = dayData.revenue - dayData.cost;
      dayData.conversionRate = dayData.totalLeads > 0 ? (dayData.soldLeads / dayData.totalLeads) * 100 : 0;

      dailyData.set(date, dayData);
    });

    // Convert to array and sort by date
    const result = Array.from(dailyData.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => ({
        ...item,
        revenue: parseFloat(item.revenue.toFixed(2)),
        cost: parseFloat(item.cost.toFixed(2)),
        profit: parseFloat(item.profit.toFixed(2)),
        conversionRate: parseFloat(item.conversionRate.toFixed(2))
      }));

    return NextResponse.json({
      success: true,
      data: result,
      totals: {
        totalLeads,
        totalSoldLeads,
        totalConversionRate: parseFloat(totalConversionRate.toFixed(2)),
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalProfit: parseFloat(totalProfit.toFixed(2))
      }
    });

  } catch (error) {
    console.error('Error fetching conversion overview:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch conversion overview',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
