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

    // Get leads processed daily
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('createdat, leadcost')
      .gte('createdat', fromDate)
      .lte('createdat', toDate)
      .order('createdat', { ascending: true });

    if (leadsError) throw leadsError;

    // Get sales data daily from lead_distributions
    const { data: salesData, error: salesError } = await supabase
      .from('lead_distributions')
      .select('createdat, selling_price_per_sheet, leadsallocated')
      .gte('createdat', fromDate)
      .lte('createdat', toDate)
      .not('selling_price_per_sheet', 'is', null)
      .order('createdat', { ascending: true });

    if (salesError) throw salesError;

    // Get individual sold leads count from clients_history
    const { data: soldLeadsData, error: soldLeadsError } = await supabase
      .from('clients_history')
      .select('distributed_at, lead_id')
      .gte('distributed_at', fromDate)
      .lte('distributed_at', toDate)
      .order('distributed_at', { ascending: true });

    if (soldLeadsError) throw soldLeadsError;

    // Get upload batches for cost data
    const { data: batchesData, error: batchesError } = await supabase
      .from('upload_batches')
      .select('createdat, total_buying_price')
      .gte('createdat', fromDate)
      .lte('createdat', toDate)
      .not('total_buying_price', 'is', null);

    if (batchesError) throw batchesError;

    // Get active suppliers and clients count daily
    const { data: suppliersData, error: suppliersError } = await supabase
      .from('suppliers')
      .select('id, created_at, status')
      .eq('status', 'Active');

    if (suppliersError) throw suppliersError;

    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id, createdat, isactive')
      .eq('isactive', true);

    if (clientsError) throw clientsError;

    // Group data by date
    const dailyMetrics = new Map();

    // Process leads data
    leadsData?.forEach(lead => {
      const date = new Date(lead.createdat).toISOString().split('T')[0];
      
      if (!dailyMetrics.has(date)) {
        dailyMetrics.set(date, {
          date,
          leadsProcessed: 0,
          leadsSold: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          profitMargin: 0,
          activeSuppliers: 0,
          activeClients: 0
        });
      }

      const dayData = dailyMetrics.get(date);
      dayData.leadsProcessed++;
      
      dailyMetrics.set(date, dayData);
    });

    // Process sales data from lead_distributions (revenue)
    salesData?.forEach(distribution => {
      const date = new Date(distribution.createdat).toISOString().split('T')[0];

      if (!dailyMetrics.has(date)) {
        dailyMetrics.set(date, {
          date,
          leadsProcessed: 0,
          leadsSold: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          profitMargin: 0,
          activeSuppliers: 0,
          activeClients: 0
        });
      }

      const dayData = dailyMetrics.get(date);
      dayData.revenue += parseFloat(distribution.selling_price_per_sheet) || 0;

      dailyMetrics.set(date, dayData);
    });

    // Process individual sold leads count from clients_history
    soldLeadsData?.forEach(sale => {
      const date = new Date(sale.distributed_at).toISOString().split('T')[0];

      if (dailyMetrics.has(date)) {
        const dayData = dailyMetrics.get(date);
        dayData.leadsSold++;
        dailyMetrics.set(date, dayData);
      }
    });

    // Process cost data
    batchesData?.forEach(batch => {
      const date = new Date(batch.createdat).toISOString().split('T')[0];
      
      if (dailyMetrics.has(date)) {
        const dayData = dailyMetrics.get(date);
        dayData.cost += parseFloat(batch.total_buying_price) || 0;
        dailyMetrics.set(date, dayData);
      }
    });

    // Calculate derived metrics and add supplier/client counts
    dailyMetrics.forEach((dayData, date) => {
      const dayDate = new Date(date);
      
      // Calculate profit and profit margin
      dayData.profit = dayData.revenue - dayData.cost;
      dayData.profitMargin = dayData.revenue > 0 ? (dayData.profit / dayData.revenue) * 100 : 0;

      // Count active suppliers and clients up to this date
      dayData.activeSuppliers = suppliersData?.filter(supplier => 
        new Date(supplier.created_at) <= dayDate
      ).length || 0;

      dayData.activeClients = clientsData?.filter(client => 
        new Date(client.createdat) <= dayDate
      ).length || 0;

      // Round to 2 decimal places
      dayData.revenue = parseFloat(dayData.revenue.toFixed(2));
      dayData.cost = parseFloat(dayData.cost.toFixed(2));
      dayData.profit = parseFloat(dayData.profit.toFixed(2));
      dayData.profitMargin = parseFloat(dayData.profitMargin.toFixed(2));

      dailyMetrics.set(date, dayData);
    });

    // Convert to array and sort by date
    const result = Array.from(dailyMetrics.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching daily metrics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch daily metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
