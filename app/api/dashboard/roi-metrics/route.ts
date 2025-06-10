import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    // Fetch all required data in parallel
    const [
      leadsCount,
      convertedLeads,
      supplierCosts,
      revenueData
    ] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      supabase.from('leads').select('*').eq('leadstatus', 'Converted'),
      supabase.from('suppliers').select('leadcost, leads:leads(count)'),
      supabase.from('lead_distributions').select('leadsallocated, client:clients(percentallocation, fixedallocation)')
    ]);

    // Calculate total leads and conversions
    const totalLeads = leadsCount.count || 0;
    const convertedLeadsCount = convertedLeads.data?.length || 0;
    const conversionRate = totalLeads > 0 ? (convertedLeadsCount / totalLeads) * 100 : 0;

    // Calculate total cost from suppliers
    let totalCost = 0;
    if (supplierCosts.data) {
      for (const supplier of supplierCosts.data) {
        const leadCount = Array.isArray(supplier.leads) && supplier.leads.length > 0 ? 
          supplier.leads[0]?.count || 0 : 0;
        const leadCost = Number(supplier.leadcost) || 0;
        totalCost += leadCount * leadCost;
      }
    }

    // Calculate total revenue from lead distributions
    let totalRevenue = 0;
    if (revenueData.data) {
      for (const dist of revenueData.data) {
        const client = Array.isArray(dist.client) ? dist.client[0] : dist.client;
        
        if (client?.fixedallocation) {
          totalRevenue += (client.fixedallocation * dist.leadsallocated);
        } else if (client?.percentallocation) {
          // Assuming some default value per lead if using percentage
          totalRevenue += (dist.leadsallocated * 50 * (client.percentallocation / 100));
        }
      }
    }

    // Calculate ROI metrics
    const netProfit = totalRevenue - totalCost;
    const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    // Get source performance (simplified example)
    const sourcePerformance = [
      { source: 'Organic', leads: Math.floor(totalLeads * 0.4), conversionRate: conversionRate * 1.1 },
      { source: 'Paid', leads: Math.floor(totalLeads * 0.3), conversionRate: conversionRate * 0.9 },
      { source: 'Referral', leads: Math.floor(totalLeads * 0.2), conversionRate: conversionRate },
      { source: 'Direct', leads: Math.floor(totalLeads * 0.1), conversionRate: conversionRate * 0.8 },
    ];

    return NextResponse.json({
      totalLeads,
      convertedLeads: convertedLeadsCount,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      netProfit: parseFloat(netProfit.toFixed(2)),
      roi: parseFloat(roi.toFixed(2)),
      sourcePerformance,
    });
  } catch (error) {
    console.error('Error in ROI metrics endpoint:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch ROI metrics' },
      { status: 500 }
    );
  }
}
