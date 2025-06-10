import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Define types for better type safety
type Lead = {
  id: number;
  leadSource: string;
  leadStatus: string;
  createdAt: string;
};

type UploadBatch = {
  id: number;
  sourceName: string;
  supplier: {
    id: number;
    name: string;
    leadCost: number;
  } | null;
};

type SourceMetrics = {
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  closedLostLeads: number;
  statusCounts: Record<string, number>;
  conversionRate: number;
  costPerLead: number;
  totalCost: number;
  revenue: number;
  roi: number;
  last30Days: {
    leads: number;
    converted: number;
    revenue: number;
  };
};

export async function GET() {
  try {
    // Get leads by source with their statuses and creation dates
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, leadSource, leadStatus, createdAt')
      .not('leadSource', 'is', null);

    if (leadsError) throw leadsError;

    // Get upload batches with supplier info
    const { data: batches, error: batchesError } = await supabase
      .from('upload_batches')
      .select('id, sourceName, supplier:supplierId (id, name, leadCost)')
      .not('sourceName', 'is', null);

    if (batchesError) throw batchesError;

    // Process the data to calculate metrics by source
    const sourceMetrics: Record<string, SourceMetrics> = {};

    // Initialize source metrics
    leads.forEach((lead: Lead) => {
      const source = lead.leadSource;
      const isRecent = new Date(lead.createdAt) > thirtyDaysAgo;
      
      if (!sourceMetrics[source]) {
        sourceMetrics[source] = {
          totalLeads: 0,
          newLeads: 0,
          contactedLeads: 0,
          qualifiedLeads: 0,
          convertedLeads: 0,
          closedLostLeads: 0,
          statusCounts: {},
          conversionRate: 0,
          costPerLead: 0,
          totalCost: 0,
          revenue: 0,
          roi: 0,
          last30Days: {
            leads: 0,
            converted: 0,
            revenue: 0
          }
        };
      }
      
      // Count total leads
      sourceMetrics[source].totalLeads++;
      
      // Count leads in the last 30 days
      if (isRecent) {
        sourceMetrics[source].last30Days.leads++;
      }
      
      // Count statuses
      if (lead.leadStatus) {
        // Initialize status count if it doesn't exist
        if (!sourceMetrics[source].statusCounts[lead.leadStatus]) {
          sourceMetrics[source].statusCounts[lead.leadStatus] = 0;
        }
        sourceMetrics[source].statusCounts[lead.leadStatus]++;
        
        // Update status-specific counts
        const status = lead.leadStatus.toLowerCase();
        if (status.includes('new')) sourceMetrics[source].newLeads++;
        if (status.includes('contacted')) sourceMetrics[source].contactedLeads++;
        if (status.includes('qualified')) sourceMetrics[source].qualifiedLeads++;
        if (status.includes('converted')) {
          sourceMetrics[source].convertedLeads++;
          if (isRecent) {
            sourceMetrics[source].last30Days.converted++;
          }
        }
        if (status.includes('closed') && status.includes('lost')) {
          sourceMetrics[source].closedLostLeads++;
        }
      }
    });

    // Calculate metrics for each source
    Object.entries(sourceMetrics).forEach(([source, metrics]) => {
      // Calculate conversion rate
      metrics.conversionRate = metrics.totalLeads > 0 
        ? (metrics.convertedLeads / metrics.totalLeads) * 100 
        : 0;
      
      // Find matching batch for cost data
      const batch = batches?.find(b => b.sourceName === source);
      const supplier = Array.isArray(batch?.supplier) ? batch?.supplier[0] : batch?.supplier;
      const leadCost = supplier?.leadCost || 0;
      
      // Calculate costs and ROI
      metrics.costPerLead = leadCost;
      metrics.totalCost = metrics.totalLeads * leadCost;
      
      // Calculate revenue (example: $50 per converted lead)
      const revenuePerConversion = 50;
      metrics.revenue = metrics.convertedLeads * revenuePerConversion;
      metrics.last30Days.revenue = metrics.last30Days.converted * revenuePerConversion;
      
      // Calculate ROI
      metrics.roi = metrics.totalCost > 0 
        ? ((metrics.revenue - metrics.totalCost) / metrics.totalCost) * 100 
        : 0;
    });

    // Format the response
    const result = Object.entries(sourceMetrics).map(([source, metrics]) => ({
      source,
      totalLeads: metrics.totalLeads,
      conversionRate: parseFloat(metrics.conversionRate.toFixed(2)),
      costPerLead: parseFloat(metrics.costPerLead.toFixed(2)),
      totalCost: parseFloat(metrics.totalCost.toFixed(2)),
      revenue: parseFloat(metrics.revenue.toFixed(2)),
      roi: parseFloat(metrics.roi.toFixed(2)),
      last30Days: {
        leads: metrics.last30Days.leads,
        converted: metrics.last30Days.converted,
        revenue: parseFloat(metrics.last30Days.revenue.toFixed(2)),
        conversionRate: metrics.last30Days.leads > 0
          ? parseFloat(((metrics.last30Days.converted / metrics.last30Days.leads) * 100).toFixed(2))
          : 0
      },
      statusCounts: Object.entries(metrics.statusCounts).map(([status, count]) => ({
        status,
        count
      })),
      statusSummary: {
        new: metrics.newLeads,
        contacted: metrics.contactedLeads,
        qualified: metrics.qualifiedLeads,
        converted: metrics.convertedLeads,
        closedLost: metrics.closedLostLeads
      }
    }));

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in source-performance API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch source performance data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
