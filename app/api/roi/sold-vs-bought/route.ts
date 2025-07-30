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

    // Get upload batches (bought leads) within date range
    const { data: batchesData, error: batchesError } = await supabase
      .from('upload_batches')
      .select('id, createdat, totalleads, total_buying_price')
      .gte('createdat', fromDate)
      .lte('createdat', toDate)
      .order('createdat', { ascending: true });

    if (batchesError) throw batchesError;

    // Get sales data (sold leads) from lead_distributions within date range
    const { data: salesData, error: salesError } = await supabase
      .from('lead_distributions')
      .select('id, selling_price_per_sheet, leadsallocated, createdat')
      .gte('createdat', fromDate)
      .lte('createdat', toDate)
      .not('selling_price_per_sheet', 'is', null)
      .order('createdat', { ascending: true });

    if (salesError) throw salesError;

    // Also get individual sold leads count from clients_history for accurate sold leads count
    const { data: soldLeadsData, error: soldLeadsError } = await supabase
      .from('clients_history')
      .select('lead_id, distributed_at')
      .gte('distributed_at', fromDate)
      .lte('distributed_at', toDate)
      .order('distributed_at', { ascending: true });

    if (soldLeadsError) throw soldLeadsError;

    // Group data by date
    const dailyData = new Map();

    // Process bought leads (upload batches)
    batchesData?.forEach(batch => {
      const date = new Date(batch.createdat).toISOString().split('T')[0];
      
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          date,
          boughtLeads: 0,
          soldLeads: 0,
          totalCost: 0,
          totalRevenue: 0,
          profit: 0,
          roi: 0
        });
      }

      const dayData = dailyData.get(date);
      dayData.boughtLeads += batch.totalleads || 0;
      dayData.totalCost += parseFloat(batch.total_buying_price) || 0;

      dailyData.set(date, dayData);
    });

    // Process sold leads from lead_distributions (revenue) and clients_history (count)
    salesData?.forEach(distribution => {
      const date = new Date(distribution.createdat).toISOString().split('T')[0];

      if (!dailyData.has(date)) {
        dailyData.set(date, {
          date,
          boughtLeads: 0,
          soldLeads: 0,
          totalCost: 0,
          totalRevenue: 0,
          profit: 0,
          roi: 0
        });
      }

      const dayData = dailyData.get(date);
      dayData.totalRevenue += parseFloat(distribution.selling_price_per_sheet) || 0;

      dailyData.set(date, dayData);
    });

    // Count actual sold leads from clients_history
    soldLeadsData?.forEach(sale => {
      const date = new Date(sale.distributed_at).toISOString().split('T')[0];

      if (dailyData.has(date)) {
        const dayData = dailyData.get(date);
        dayData.soldLeads += 1; // Each record represents one sold lead
        dailyData.set(date, dayData);
      }
    });

    // Calculate derived metrics for each day
    dailyData.forEach((dayData, date) => {
      dayData.profit = dayData.totalRevenue - dayData.totalCost;
      dayData.roi = dayData.totalCost > 0 ? (dayData.profit / dayData.totalCost) * 100 : 0;
      
      // Round to 2 decimal places
      dayData.totalCost = parseFloat(dayData.totalCost.toFixed(2));
      dayData.totalRevenue = parseFloat(dayData.totalRevenue.toFixed(2));
      dayData.profit = parseFloat(dayData.profit.toFixed(2));
      dayData.roi = parseFloat(dayData.roi.toFixed(2));

      dailyData.set(date, dayData);
    });

    // Convert to array and sort by date
    const result = Array.from(dailyData.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching sold vs bought data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch sold vs bought data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
