import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Define types for better type safety
type Lead = {
  id: number;
  leadsource: string | null;
  leadstatus: string | null;
  createdat: string;
};

type Supplier = {
  id: number;
  name: string;
  leadCost: number;
};

type UploadBatch = {
  id: number;
  sourceName: string;
  supplier: Supplier | Supplier[] | null;
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
    console.log('Source performance API called');
    // Get leads by source with their statuses and creation dates
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all leads with supplier information - using left join since not all leads have suppliers
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select(`
        id,
        leadsource,
        leadstatus,
        createdat,
        supplierid,
        suppliers(name)
      `);

    console.log('Leads data fetched:', { count: leads?.length || 0, error: leadsError });

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      throw leadsError;
    }

    // Get recent leads for last 30 days
    const { data: recentLeads, error: recentLeadsError } = await supabase
      .from('leads')
      .select(`
        id,
        leadsource,
        leadstatus,
        createdat,
        supplierid,
        suppliers(name)
      `)
      .gt('createdat', thirtyDaysAgo.toISOString());

    if (recentLeadsError) {
      console.error('Error fetching recent leads:', recentLeadsError);
      throw recentLeadsError;
    }

    // Get upload batches with supplier info
    const { data: batches, error: batchesError } = await supabase
      .from('upload_batches')
      .select('id, sourcename, supplierid, total_buying_price, totalleads')
      .not('sourcename', 'is', null);

    // Get suppliers separately
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('id, name, lead_cost');

    if (batchesError) throw batchesError;
    if (suppliersError) throw suppliersError;

    // Create supplier lookup map
    const supplierMap = new Map();
    suppliers?.forEach(supplier => {
      supplierMap.set(supplier.id, supplier);
    });

    // Process the data to calculate metrics by source
    const sourceMetrics: Record<string, SourceMetrics> = {};

    // Initialize metrics for each source from leads
    leads?.forEach((lead: any) => {
      // Get source name from supplier or fallback to leadsource
      const supplierName = lead.suppliers?.name;
      let source = supplierName || lead.leadsource || 'Unknown Source';

      // Ensure source is a valid string and not null/undefined/empty
      if (!source || typeof source !== 'string' || source.trim() === '') {
        source = 'Unknown Source';
      }

      // Clean the source name to remove any invalid characters
      source = String(source).trim().replace(/[^\w\s-]/g, '').substring(0, 50);

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

      // Update counts based on lead status
      const status = (lead.leadstatus || 'new').toLowerCase();
      sourceMetrics[source].totalLeads++;
      sourceMetrics[source].statusCounts[status] = (sourceMetrics[source].statusCounts[status] || 0) + 1;

      // Update status-specific counts
      if (status.includes('new') || status === 'new') sourceMetrics[source].newLeads++;
      if (status.includes('contacted')) sourceMetrics[source].contactedLeads++;
      if (status.includes('qualified')) sourceMetrics[source].qualifiedLeads++;
      if (status.includes('converted') || status === 'converted') sourceMetrics[source].convertedLeads++;
      if (status.includes('closed') && status.includes('lost')) sourceMetrics[source].closedLostLeads++;
    });

    // Process recent leads for 30-day stats
    recentLeads?.forEach((lead: any) => {
      const supplierName = lead.suppliers?.name;
      let source = supplierName || lead.leadsource || 'Unknown Source';

      // Ensure source is a valid string and not null/undefined/empty
      if (!source || typeof source !== 'string' || source.trim() === '') {
        source = 'Unknown Source';
      }

      // Clean the source name to remove any invalid characters
      source = String(source).trim().replace(/[^\w\s-]/g, '').substring(0, 50);

      if (sourceMetrics[source]) {
        sourceMetrics[source].last30Days.leads++;
        if (lead.leadstatus?.toLowerCase().includes('converted')) {
          sourceMetrics[source].last30Days.converted++;
        }
      }
    });

    // Calculate metrics for each source
    Object.entries(sourceMetrics).forEach(([source, metrics]) => {
      // Calculate conversion rate
      metrics.conversionRate = metrics.totalLeads > 0
        ? (metrics.convertedLeads / metrics.totalLeads) * 100
        : 0;

      // Find matching batch for cost data - try both sourcename and supplier name
      let batch = batches?.find(b => b.sourcename === source);
      if (!batch) {
        // Try to find by supplier name
        const supplierByName = suppliers?.find(s => s.name === source);
        if (supplierByName) {
          batch = batches?.find(b => b.supplierid === supplierByName.id);
        }
      }

      const supplier = batch?.supplierid ? supplierMap.get(batch.supplierid) : null;
      const leadCost = supplier?.lead_cost || batch?.buying_price_per_lead || 5; // Default cost if not found

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
        : metrics.revenue > 0 ? 100 : 0; // If no cost but revenue, show 100% ROI
    });

    console.log('Processed source metrics:', Object.keys(sourceMetrics).length, 'sources');

    // Helper function to safely format numbers
    const safeFloat = (value: any, defaultValue: number = 0): number => {
      if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
        return defaultValue;
      }
      const result = parseFloat(Number(value).toFixed(2));
      return isNaN(result) || !isFinite(result) ? defaultValue : result;
    };

    // Format the response
    const result = Object.entries(sourceMetrics).map(([source, metrics]) => ({
      source: String(source || 'Unknown').trim(),
      totalLeads: Math.max(0, Math.floor(metrics.totalLeads || 0)),
      conversionRate: safeFloat(metrics.conversionRate),
      costPerLead: safeFloat(metrics.costPerLead),
      totalCost: safeFloat(metrics.totalCost),
      revenue: safeFloat(metrics.revenue),
      roi: safeFloat(metrics.roi),
      last30Days: {
        leads: Math.max(0, Math.floor(metrics.last30Days?.leads || 0)),
        converted: Math.max(0, Math.floor(metrics.last30Days?.converted || 0)),
        revenue: safeFloat(metrics.last30Days?.revenue),
        conversionRate: (metrics.last30Days?.leads || 0) > 0
          ? safeFloat(((metrics.last30Days.converted || 0) / metrics.last30Days.leads) * 100)
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

    // Add some sample data if no real data exists to ensure charts display
    if (result.length === 0) {
      const sampleData = [
        {
          source: "Sample Source 1",
          totalLeads: 100,
          conversionRate: 15.5,
          costPerLead: 5.0,
          totalCost: 500.0,
          revenue: 775.0,
          roi: 55.0,
          last30Days: { leads: 30, converted: 5, revenue: 250.0, conversionRate: 16.67 },
          statusCounts: [{ status: "new", count: 85 }, { status: "converted", count: 15 }],
          statusSummary: { new: 85, contacted: 10, qualified: 8, converted: 15, closedLost: 5 }
        },
        {
          source: "Sample Source 2",
          totalLeads: 75,
          conversionRate: 12.0,
          costPerLead: 4.5,
          totalCost: 337.5,
          revenue: 450.0,
          roi: 33.3,
          last30Days: { leads: 25, converted: 3, revenue: 150.0, conversionRate: 12.0 },
          statusCounts: [{ status: "new", count: 66 }, { status: "converted", count: 9 }],
          statusSummary: { new: 66, contacted: 8, qualified: 6, converted: 9, closedLost: 3 }
        }
      ];
      console.log('No real data found, returning sample data for testing');
      return NextResponse.json({
        success: true,
        data: sampleData
      });
    }

    console.log('Returning real source performance data:', result.length, 'sources');
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
