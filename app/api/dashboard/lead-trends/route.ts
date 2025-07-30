import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Define types for better type safety
interface LeadTrendData {
  date: string;
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  closedLostLeads: number;
  dncLeads: number;
  totalCost: number;
  totalRevenue: number;
  profit: number;
  roi: number;
}

interface Lead {
  id: number;
  createdat: string;
  leadstatus: string;
  leadsource?: string;
  leadcost?: number;
  uploadbatchid?: number;
}

interface DncBatch {
  createdat: string;
  dncmatches: number | null;
}

interface LeadTrendsResponse {
  success: boolean;
  data: {
    trends: LeadTrendData[];
    summary: {
      totalLeads: number;
      totalConverted: number;
      totalDnc: number;
      totalCost: number;
      totalRevenue: number;
      totalProfit: number;
      avgConversionRate: number;
      avgCostPerLead: number;
      avgRevenuePerLead: number;
    };
    period: string;
    dateRange: {
      start: string;
      end: string;
    };
  };
  metadata: {
    generatedAt: string;
    timeRange: string;
  };
  error?: string;
  details?: string;
}

// Helper function to format date based on period
const formatDate = (date: Date, period: string): string => {
  const d = new Date(date);
  
  switch (period.toLowerCase()) {
    case 'hourly':
      return d.toISOString().slice(0, 13) + ':00:00Z';
    case 'daily':
      return d.toISOString().split('T')[0];
    case 'weekly': {
      const day = d.getUTCDay();
      const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setUTCDate(diff);
      return monday.toISOString().split('T')[0];
    }
    case 'monthly':
      return d.toISOString().slice(0, 7);
    default:
      return d.toISOString().split('T')[0];
  }
};

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period')?.toLowerCase() || 'daily';
    const days = parseInt(searchParams.get('days') || '30', 10);
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);



    // Validate period parameter
    if (!['hourly', 'daily', 'weekly', 'monthly'].includes(period)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid period parameter. Must be one of: hourly, daily, weekly, monthly'
        },
        { status: 400 }
      );
    }

    // First, let's check if we have any leads at all
    const { data: allLeads, error: allLeadsError } = await supabase
      .from('leads')
      .select('createdat, leadstatus, leadsource')
      .limit(5);



    // Fetch leads data with their upload dates and status
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('id, createdat, leadstatus, leadsource, leadcost, uploadbatchid')
      .gte('createdat', startDate.toISOString())
      .lte('createdat', endDate.toISOString())
      .order('createdat', { ascending: true });

    if (leadsError) throw leadsError;

    // Fetch actual sales data from clients_history
    const { data: salesData, error: salesError } = await supabase
      .from('clients_history')
      .select('lead_id, selling_cost, distributed_at')
      .gte('distributed_at', startDate.toISOString())
      .lte('distributed_at', endDate.toISOString())
      .order('distributed_at', { ascending: true });

    if (salesError) throw salesError;

    // Fetch cost data from upload_batches
    const { data: costData, error: costError } = await supabase
      .from('upload_batches')
      .select('id, createdat, total_buying_price, totalleads, buying_price_per_lead')
      .gte('createdat', startDate.toISOString())
      .lte('createdat', endDate.toISOString())
      .order('createdat', { ascending: true });

    if (costError) throw costError;

    // Fetch DNC matches
    const { data: dncData, error: dncError } = await supabase
      .from('upload_batches')
      .select('createdat, dncmatches')
      .not('dncmatches', 'is', null)
      .gte('createdat', startDate.toISOString())
      .lte('createdat', endDate.toISOString())
      .order('createdat', { ascending: true });

    if (dncError) throw dncError;

    // Group data by period
    const periodMap = new Map<string, LeadTrendData>();
    
    // Initialize periods in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const periodKey = formatDate(currentDate, period);
      
      if (!periodMap.has(periodKey)) {
        periodMap.set(periodKey, {
          date: periodKey,
          totalLeads: 0,
          newLeads: 0,
          contactedLeads: 0,
          qualifiedLeads: 0,
          convertedLeads: 0,
          closedLostLeads: 0,
          dncLeads: 0,
          totalCost: 0,
          totalRevenue: 0,
          profit: 0,
          roi: 0
        });
      }
      
      // Move to next period
      if (period === 'hourly') {
        currentDate.setHours(currentDate.getHours() + 1);
      } else if (period === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (period === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    // Create maps for quick lookup
    const salesMap = new Map<number, { selling_cost: number; distributed_at: string }>();
    (salesData || []).forEach(sale => {
      if (sale.lead_id) {
        salesMap.set(sale.lead_id, {
          selling_cost: parseFloat(sale.selling_cost) || 0,
          distributed_at: sale.distributed_at
        });
      }
    });

    const batchCostMap = new Map<number, { buying_price_per_lead: number; total_buying_price: number }>();
    (costData || []).forEach(batch => {
      if (batch.id) {
        batchCostMap.set(batch.id, {
          buying_price_per_lead: parseFloat(batch.buying_price_per_lead) || 0,
          total_buying_price: parseFloat(batch.total_buying_price) || 0
        });
      }
    });

    // Process leads data with real costs and revenue
    (leadsData || []).forEach((lead: any) => {
      if (!lead.createdat) return;

      const periodKey = formatDate(new Date(lead.createdat), period);

      let periodData = periodMap.get(periodKey);
      if (!periodData) {
        periodData = {
          date: periodKey,
          totalLeads: 0,
          newLeads: 0,
          contactedLeads: 0,
          qualifiedLeads: 0,
          convertedLeads: 0,
          closedLostLeads: 0,
          dncLeads: 0,
          totalCost: 0,
          totalRevenue: 0,
          profit: 0,
          roi: 0
        };
        periodMap.set(periodKey, periodData);
      }

      // Update lead counts by status
      periodData.totalLeads++;
      const status = lead.leadstatus?.toLowerCase() || '';

      if (status.includes('new')) periodData.newLeads++;
      if (status.includes('contacted')) periodData.contactedLeads++;
      if (status.includes('qualified')) periodData.qualifiedLeads++;
      if (status.includes('converted')) periodData.convertedLeads++;
      if (status.includes('closed') && status.includes('lost')) periodData.closedLostLeads++;

      // Calculate real costs from upload_batches
      let leadCost = 0;
      if (lead.uploadbatchid && batchCostMap.has(lead.uploadbatchid)) {
        leadCost = batchCostMap.get(lead.uploadbatchid)!.buying_price_per_lead;
      } else if (lead.leadcost) {
        leadCost = parseFloat(lead.leadcost) || 0;
      }

      periodData.totalCost += leadCost;

      periodMap.set(periodKey, periodData);
    });

    // Process actual sales data for revenue
    (salesData || []).forEach((sale: any) => {
      if (!sale.distributed_at) return;

      const periodKey = formatDate(new Date(sale.distributed_at), period);

      let periodData = periodMap.get(periodKey);
      if (!periodData) {
        periodData = {
          date: periodKey,
          totalLeads: 0,
          newLeads: 0,
          contactedLeads: 0,
          qualifiedLeads: 0,
          convertedLeads: 0,
          closedLostLeads: 0,
          dncLeads: 0,
          totalCost: 0,
          totalRevenue: 0,
          profit: 0,
          roi: 0
        };
        periodMap.set(periodKey, periodData);
      }

      // Add actual revenue from sales
      const revenue = parseFloat(sale.selling_cost) || 0;
      periodData.totalRevenue += revenue;
      periodData.convertedLeads++; // Count actual conversions from sales

      periodMap.set(periodKey, periodData);
    });

    // Calculate profit and ROI for each period
    periodMap.forEach((periodData, key) => {
      periodData.profit = periodData.totalRevenue - periodData.totalCost;
      periodData.roi = periodData.totalCost > 0
        ? (periodData.profit / periodData.totalCost) * 100
        : 0;
      periodMap.set(key, periodData);
    });

    // Process DNC data
    (dncData || []).forEach((batch: DncBatch) => {
      if (!batch.createdat) return;
      
      const periodKey = formatDate(new Date(batch.createdat), period);
      let periodData = periodMap.get(periodKey);
      if (!periodData) {
        periodData = {
          date: periodKey,
          totalLeads: 0,
          newLeads: 0,
          contactedLeads: 0,
          qualifiedLeads: 0,
          convertedLeads: 0,
          closedLostLeads: 0,
          dncLeads: 0,
          totalCost: 0,
          totalRevenue: 0,
          profit: 0,
          roi: 0
        };
        periodMap.set(periodKey, periodData);
      }

      periodData.dncLeads += batch.dncmatches || 0;
    });



    // Convert map to array and sort by date
    let trends = Array.from(periodMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Simplify: just show periods with data, or if no data, show recent periods
    const periodsWithData = trends.filter(t => t.totalLeads > 0);

    if (periodsWithData.length > 0) {
      // Show only periods with data
      trends = periodsWithData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      // If no data, show recent periods
      trends = trends.slice(-7).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }



    // Calculate summary statistics
    const summary = {
      totalLeads: trends.reduce((sum, day) => sum + day.totalLeads, 0),
      totalConverted: trends.reduce((sum, day) => sum + day.convertedLeads, 0),
      totalDnc: trends.reduce((sum, day) => sum + day.dncLeads, 0),
      totalCost: parseFloat(trends.reduce((sum, day) => sum + day.totalCost, 0).toFixed(2)),
      totalRevenue: parseFloat(trends.reduce((sum, day) => sum + day.totalRevenue, 0).toFixed(2)),
      totalProfit: parseFloat(trends.reduce((sum, day) => sum + day.profit, 0).toFixed(2)),
      avgConversionRate: 0,
      avgCostPerLead: 0,
      avgRevenuePerLead: 0
    };
    
    // Calculate averages
    if (summary.totalLeads > 0) {
      summary.avgConversionRate = parseFloat(((summary.totalConverted / summary.totalLeads) * 100).toFixed(2));
      summary.avgCostPerLead = parseFloat((summary.totalCost / summary.totalLeads).toFixed(2));
    }
    
    if (summary.totalConverted > 0) {
      summary.avgRevenuePerLead = parseFloat((summary.totalRevenue / summary.totalConverted).toFixed(2));
    }

    const response: LeadTrendsResponse = {
      success: true,
      data: {
        trends,
        summary,
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        timeRange: `${days} days`
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error in lead-trends endpoint:', error);
    
    const errorResponse: LeadTrendsResponse = {
      success: false,
      data: {
        trends: [],
        summary: {
          totalLeads: 0,
          totalConverted: 0,
          totalDnc: 0,
          totalCost: 0,
          totalRevenue: 0,
          totalProfit: 0,
          avgConversionRate: 0,
          avgCostPerLead: 0,
          avgRevenuePerLead: 0
        },
        period: request.nextUrl.searchParams.get('period') || 'daily',
        dateRange: {
          start: new Date().toISOString(),
          end: new Date().toISOString()
        }
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        timeRange: 'N/A'
      },
      error: 'Failed to fetch lead trends',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
