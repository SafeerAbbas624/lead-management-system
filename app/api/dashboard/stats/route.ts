import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Define TypeScript interfaces for better type safety
interface Lead {
  id: number;
  leadstatus: string;
  createdat: string;
  leadsource?: string;
  [key: string]: any;
}

interface UploadBatch {
  id: number;
  status: string;
  dncmatches: number | null;
  totalleads: number;
  cleanedleads: number;
  createdat: string;
  [key: string]: any;
}

interface Supplier {
  id: number;
  leadcost: number | null;
  name: string;
  leads?: { count: number }[];
  [key: string]: any;
}

interface LeadDistribution {
  leadsallocated: number;
  client: {
    percentallocation: number | null;
    fixedallocation: number | null;
  } | null | Array<{
    percentallocation: number | null;
    fixedallocation: number | null;
  }>;
  [key: string]: any;
}

interface DashboardStats {
  overview: {
    totalLeads: number;
    totalUploads: number;
    totalSuppliers: number;
    activeClients: number;
  };
  leads: {
    total: number;
    converted: number;
    new: number;
    contacted: number;
    qualified: number;
    closedLost: number;
  };
  quality: {
    dncMatches: number;
    duplicateLeads: number;
    cleanLeads: number;
    qualityScore: number;
  };
  financials: {
    totalCost: number;
    totalRevenue: number;
    netProfit: number;
    roi: number;
    avgLeadCost: number;
    avgRevenuePerLead: number;
  };
  performance: {
    conversionRate: number;
    processingBatches: number;
    failedBatches: number;
    successRate: number;
  };
  trends: {
    leadsThisMonth: number;
    leadsLastMonth: number;
    monthOverMonthGrowth: number;
    revenueThisMonth: number;
    revenueLastMonth: number;
    revenueGrowth: number;
  };
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to get the start and end dates for a given month
const getMonthRange = (monthsAgo = 0) => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  
  return { start: start.toISOString(), end: end.toISOString() };
};

export async function GET() {
  try {
    // Get date ranges for this month and last month
    const thisMonth = getMonthRange(0);
    const lastMonth = getMonthRange(1);

    // Fetch all required data in parallel
    const [
      { count: totalLeads },
      { data: leads },
      { data: uploadBatches },
      { data: suppliers },
      { count: activeClients },
      { data: leadDistributions },
      { data: thisMonthLeads },
      { data: lastMonthLeads },
      { data: thisMonthRevenue },
      { data: lastMonthRevenue }
    ] = await Promise.all([
      // Total leads count
      supabase
        .from('leads')
        .select('*', { count: 'exact', head: true }),
        
      // All leads with status
      supabase
        .from('leads')
        .select('id, leadstatus, createdat, leadsource'),
        
      // Upload batches data
      supabase
        .from('upload_batches')
        .select('id, status, dncmatches, totalleads, cleanedleads, createdat'),
        
      // Suppliers with lead costs
      supabase
        .from('suppliers')
        .select('id, leadcost, name, leads:leads(count)'),
        
      // Active clients
      supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('isactive', true),
        
      // Lead distributions for revenue calculation
      supabase
        .from('lead_distributions')
        .select('leadsallocated, client:clients(percentallocation, fixedallocation)'),
        
      // This month's leads for trend analysis
      supabase
        .from('leads')
        .select('id, createdat')
        .gte('createdat', thisMonth.start)
        .lte('createdat', thisMonth.end),
        
      // Last month's leads for trend analysis
      supabase
        .from('leads')
        .select('id, createdat')
        .gte('createdat', lastMonth.start)
        .lte('createdat', lastMonth.end),
        
      // This month's revenue
      supabase
        .from('lead_distributions')
        .select('leadsallocated, createdat, client:clients(percentallocation, fixedallocation)')
        .gte('createdat', thisMonth.start)
        .lte('createdat', thisMonth.end),
        
      // Last month's revenue
      supabase
        .from('lead_distributions')
        .select('leadsallocated, createdat, client:clients(percentallocation, fixedallocation)')
        .gte('createdat', lastMonth.start)
        .lte('createdat', lastMonth.end)
    ]);

    // Calculate lead status counts
    const leadStatusCounts = (leads || []).reduce((acc: Record<string, number>, lead: Lead) => {
      const status = lead.leadstatus?.toLowerCase() || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Calculate quality metrics
    const totalDncMatches = (uploadBatches || []).reduce((sum: number, batch: UploadBatch) => 
      sum + (Number(batch.dncmatches) || 0), 0
    );
    
    const totalCleanLeads = (uploadBatches || []).reduce((sum: number, batch: UploadBatch) => 
      sum + (Number(batch.cleanedleads) || 0), 0
    );
    
    const totalProcessedLeads = (uploadBatches || []).reduce((sum: number, batch: UploadBatch) => 
      sum + (Number(batch.totalleads) || 0), 0
    );
    
    const duplicateLeads = Math.max(0, totalProcessedLeads - totalCleanLeads - totalDncMatches);
    const qualityScore = totalProcessedLeads > 0 
      ? Math.round((totalCleanLeads / totalProcessedLeads) * 100) 
      : 0;

    // Calculate financial metrics
    const totalLeadsCount = totalLeads || 0;
    const totalCost = (suppliers || []).reduce((sum: number, supplier: Supplier) => {
      const leadCount = Array.isArray(supplier.leads) && supplier.leads.length > 0 
        ? supplier.leads[0]?.count || 0 
        : 0;
      const leadCost = Number(supplier.leadcost) || 0;
      return sum + (leadCount * leadCost);
    }, 0);
    
    // Calculate revenue from lead distributions
    const calculateRevenue = (distributions: LeadDistribution[]) => {
      return (distributions || []).reduce((sum: number, dist: LeadDistribution) => {
        const client = Array.isArray(dist.client) ? dist.client[0] : dist.client;
        
        if (client?.fixedallocation) {
          return sum + (client.fixedallocation * (dist.leadsallocated || 0));
        } else if (client?.percentallocation) {
          // Assuming $50 value per lead for percentage-based calculations
          return sum + ((dist.leadsallocated || 0) * 50 * (client.percentallocation / 100));
        }
        return sum;
      }, 0);
    };
    
    const totalRevenue = calculateRevenue(leadDistributions || []);
    const revenueThisMonth = calculateRevenue(thisMonthRevenue || []);
    const revenueLastMonth = calculateRevenue(lastMonthRevenue || []);
    
    const netProfit = totalRevenue - totalCost;
    const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
    
    // Calculate performance metrics
    const processingBatches = (uploadBatches || []).filter(
      (batch: UploadBatch) => batch.status?.toLowerCase() === 'processing'
    ).length;
    
    const failedBatches = (uploadBatches || []).filter(
      (batch: UploadBatch) => batch.status?.toLowerCase() === 'failed'
    ).length;
    
    const successRate = uploadBatches && uploadBatches.length > 0
      ? 100 - Math.round((failedBatches / uploadBatches.length) * 100)
      : 100;

    // Calculate trends
    const leadsThisMonth = thisMonthLeads?.length || 0;
    const leadsLastMonth = lastMonthLeads?.length || 0;
    const monthOverMonthGrowth = leadsLastMonth > 0
      ? ((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100
      : 0;
    
    const revenueGrowth = revenueLastMonth > 0
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : 0;

    // Compile the response
    const stats: DashboardStats = {
      overview: {
        totalLeads: totalLeads || 0,
        totalUploads: uploadBatches?.length || 0,
        totalSuppliers: suppliers?.length || 0,
        activeClients: activeClients || 0,
      },
      leads: {
        total: totalLeads || 0,
        converted: leadStatusCounts['converted'] || 0,
        new: leadStatusCounts['new'] || 0,
        contacted: leadStatusCounts['contacted'] || 0,
        qualified: leadStatusCounts['qualified'] || 0,
        closedLost: leadStatusCounts['closed lost'] || 0,
      },
      quality: {
        dncMatches: totalDncMatches,
        duplicateLeads,
        cleanLeads: totalCleanLeads,
        qualityScore,
      },
      financials: {
        totalCost: parseFloat(totalCost.toFixed(2)),
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        netProfit: parseFloat(netProfit.toFixed(2)),
        roi: parseFloat(roi.toFixed(2)),
        avgLeadCost: totalLeads ? parseFloat((totalCost / totalLeads).toFixed(2)) : 0,
        avgRevenuePerLead: leadStatusCounts['converted'] 
          ? parseFloat((totalRevenue / leadStatusCounts['converted']).toFixed(2))
          : 0,
      },
      performance: {
        conversionRate: totalLeadsCount > 0
          ? parseFloat(((leadStatusCounts['converted'] || 0) / totalLeadsCount * 100).toFixed(2))
          : 0,
        processingBatches,
        failedBatches,
        successRate,
      },
      trends: {
        leadsThisMonth,
        leadsLastMonth,
        monthOverMonthGrowth: parseFloat(monthOverMonthGrowth.toFixed(2)),
        revenueThisMonth: parseFloat(revenueThisMonth.toFixed(2)),
        revenueLastMonth: parseFloat(revenueLastMonth.toFixed(2)),
        revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
      },
    };

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard stats',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
