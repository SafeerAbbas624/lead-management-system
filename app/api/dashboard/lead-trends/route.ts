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
  createdat: string;
  leadstatus: string;
  leadsource?: string;
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
      const monday = new Date(d.setUTCDate(diff));
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

    // Fetch leads data with their upload dates and status
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('createdat, leadstatus, leadsource')
      .gte('createdat', startDate.toISOString())
      .lte('createdat', endDate.toISOString())
      .order('createdat', { ascending: true });

    if (leadsError) throw leadsError;

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

    // Process leads data
    (leadsData || []).forEach((lead: Lead) => {
      if (!lead.createdat) return;
      
      const periodKey = formatDate(new Date(lead.createdat), period);
      const periodData = periodMap.get(periodKey) || {
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
      
      // Update lead counts by status
      periodData.totalLeads++;
      const status = lead.leadstatus?.toLowerCase() || '';
      
      if (status.includes('new')) periodData.newLeads++;
      if (status.includes('contacted')) periodData.contactedLeads++;
      if (status.includes('qualified')) periodData.qualifiedLeads++;
      if (status.includes('converted')) periodData.convertedLeads++;
      if (status.includes('closed') && status.includes('lost')) periodData.closedLostLeads++;
      
      // Calculate costs and revenue (adjust these calculations based on your business logic)
      const leadCost = 5; // Example: $5 per lead
      const conversionRevenue = 50; // Example: $50 per converted lead
      
      periodData.totalCost += leadCost;
      if (status.includes('converted')) {
        periodData.totalRevenue += conversionRevenue;
      }
      
      periodData.profit = periodData.totalRevenue - periodData.totalCost;
      periodData.roi = periodData.totalCost > 0 
        ? (periodData.profit / periodData.totalCost) * 100 
        : 0;
      
      periodMap.set(periodKey, periodData);
    });

    // Process DNC data
    (dncData || []).forEach((batch: DncBatch) => {
      if (!batch.createdat) return;
      
      const periodKey = formatDate(new Date(batch.createdat), period);
      const periodData = periodMap.get(periodKey) || {
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
      
      periodData.dncLeads += batch.dncmatches || 0;
      periodMap.set(periodKey, periodData);
    });

    // Convert map to array and sort by date
    const trends = Array.from(periodMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
