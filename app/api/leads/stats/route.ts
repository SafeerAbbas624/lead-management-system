import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    console.log('Stats API called with params:', Object.fromEntries(searchParams.entries()));

    // Parse filters from query parameters with proper validation
    const timeFrame = searchParams.get('time_frame') || '1month';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const sources = searchParams.get('sources')?.split(',').filter(s => s.trim());
    const statuses = searchParams.get('statuses')?.split(',').filter(s => s.trim());

    // Parse integer arrays with validation
    const batchIdsParam = searchParams.get('batch_ids');
    const batchIds = batchIdsParam ?
      batchIdsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) :
      undefined;

    const supplierIdsParam = searchParams.get('supplier_ids');
    const supplierIds = supplierIdsParam ?
      supplierIdsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) :
      undefined;

    const clientIdsParam = searchParams.get('client_ids');
    const clientIds = clientIdsParam ?
      clientIdsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) :
      undefined;

    // Parse float values with validation
    const costMinParam = searchParams.get('cost_min');
    const costMin = costMinParam && !isNaN(parseFloat(costMinParam)) ? parseFloat(costMinParam) : undefined;

    const costMaxParam = searchParams.get('cost_max');
    const costMax = costMaxParam && !isNaN(parseFloat(costMaxParam)) ? parseFloat(costMaxParam) : undefined;

    const search = searchParams.get('search');

    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

    // Calculate date range based on time frame with validation
    let startDate: Date, endDate: Date;

    if (dateFrom && dateTo) {
      startDate = new Date(dateFrom);
      endDate = new Date(dateTo);

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format provided' },
          { status: 422 }
        );
      }
    } else {
      endDate = new Date();
      startDate = new Date();

      switch (timeFrame) {
        case '1month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6months':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1);
      }
    }

    console.log('Date range:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });

    // Build base query - select only needed fields to avoid potential issues
    // Use a very high limit to override Supabase's default 1000 row limit
    let query = supabase
      .from('leads')
      .select('id, email, firstname, lastname, phone, companyname, leadsource, leadstatus, leadcost, supplierid, clientid, uploadbatchid, createdat')
      .gte('createdat', startDate.toISOString())
      .lte('createdat', endDate.toISOString());

    // Filters are now applied in the pagination loop below

    // Get all leads data using pagination to bypass Supabase limits
    console.log('Executing leads query with pagination to get all results...');

    let allLeadsData: any[] = [];
    let hasMore = true;
    let offset = 0;
    const batchSize = 1000;

    while (hasMore) {
      const batchQuery = supabase
        .from('leads')
        .select('id, email, firstname, lastname, phone, companyname, leadsource, leadstatus, leadcost, supplierid, clientid, uploadbatchid, createdat')
        .gte('createdat', startDate.toISOString())
        .lte('createdat', endDate.toISOString());

      // Apply the same filters as the main query
      if (sources && sources.length > 0) {
        batchQuery.in('leadsource', sources);
      }
      if (statuses && statuses.length > 0) {
        batchQuery.in('leadstatus', statuses);
      }
      if (batchIds && batchIds.length > 0) {
        batchQuery.in('uploadbatchid', batchIds);
      }
      if (supplierIds && supplierIds.length > 0) {
        batchQuery.in('supplierid', supplierIds);
      }
      if (clientIds && clientIds.length > 0) {
        batchQuery.in('clientid', clientIds);
      }
      if (costMin !== undefined) {
        batchQuery.gte('leadcost', costMin);
      }
      if (costMax !== undefined) {
        batchQuery.lte('leadcost', costMax);
      }
      if (tags.length > 0) {
        batchQuery.overlaps('tags', tags);
      }

      // Apply search filters
      if (search) {
        const searchTerm = search.trim();
        batchQuery.or(`
          firstname.ilike.%${searchTerm}%,
          lastname.ilike.%${searchTerm}%,
          email.ilike.%${searchTerm}%,
          phone.ilike.%${searchTerm}%,
          companyname.ilike.%${searchTerm}%,
          taxid.ilike.%${searchTerm}%,
          address.ilike.%${searchTerm}%,
          city.ilike.%${searchTerm}%,
          state.ilike.%${searchTerm}%,
          zipcode.ilike.%${searchTerm}%,
          country.ilike.%${searchTerm}%,
          leadsource.ilike.%${searchTerm}%,
          leadstatus.ilike.%${searchTerm}%,
          exclusivitynotes.ilike.%${searchTerm}%
        `.replace(/\s+/g, ''));
      }

      // Add pagination
      batchQuery.range(offset, offset + batchSize - 1);

      const { data: batchData, error: batchError } = await batchQuery;

      if (batchError) {
        console.error('Error fetching batch:', batchError);
        break;
      }

      if (batchData && batchData.length > 0) {
        allLeadsData = allLeadsData.concat(batchData);
        offset += batchSize;
        hasMore = batchData.length === batchSize; // Continue if we got a full batch
        console.log(`Fetched batch: ${batchData.length} leads, total so far: ${allLeadsData.length}`);
      } else {
        hasMore = false;
      }
    }

    const leadsData = allLeadsData;
    const leadsError = null;

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      return NextResponse.json(
        {
          error: 'Failed to fetch leads data',
          details: leadsError.message,
          code: leadsError.code,
          hint: leadsError.hint
        },
        { status: 422 }
      );
    }

    console.log(`Found ${leadsData?.length || 0} filtered leads`);

    // Get the actual total leads count (unfiltered) for the "Total Leads" card
    console.log('Getting total leads count...');
    const { count: actualTotalLeads, error: totalCountError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    if (totalCountError) {
      console.error('Error fetching total leads count:', totalCountError);
    }

    const totalLeads = actualTotalLeads || 0;
    const filteredLeadsCount = leadsData?.length || 0;

    console.log(`Total leads in database: ${totalLeads}, Filtered leads: ${filteredLeadsCount}`);

    // If no filtered leads found, return stats with actual total but empty filtered data
    if (!leadsData || leadsData.length === 0) {
      return NextResponse.json({
        totalLeads, // Use actual total leads count
        leadsBySource: [],
        duplicatesBySource: [],
        totalBatches: 0,
        processingBatches: 0,
        completedBatches: 0,
        failedBatches: 0,
        totalDuplicates: 0,
        dncMatches: 0,
        leadsByStatus: [],
        leadsByCost: {
          totalCost: 0,
          averageCost: 0,
          minCost: 0,
          maxCost: 0,
        },
        monthOverMonthGrowth: 0,
        recentActivity: []
      });
    }

    // Get supplier information to map supplier names
    console.log('Fetching suppliers...');
    const { data: suppliersData, error: suppliersError } = await supabase
      .from('suppliers')
      .select('id, name');

    if (suppliersError) {
      console.error('Error fetching suppliers:', suppliersError);
      // Continue without supplier mapping
    }

    const supplierMap = suppliersData?.reduce((acc: Record<number, string>, supplier) => {
      acc[supplier.id] = supplier.name;
      return acc;
    }, {}) || {};

    console.log(`Found ${suppliersData?.length || 0} suppliers`);

    // Calculate leads by source (supplier)
    const sourceStats = leadsData?.reduce((acc: Record<string, number>, lead) => {
      // Use supplier name if available, otherwise use leadsource field, otherwise 'Unknown'
      const supplierName = lead.supplierid ? supplierMap[lead.supplierid] : null;
      const source = supplierName || lead.leadsource || 'Unknown Supplier';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {}) || {};

    const leadsBySource = Object.entries(sourceStats)
      .map(([source, count]) => ({
        source,
        count: count as number,
        percentage: filteredLeadsCount > 0 ? Math.round((count as number / filteredLeadsCount) * 100 * 10) / 10 : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate leads by status
    const statusStats = leadsData?.reduce((acc: Record<string, number>, lead) => {
      const status = lead.leadstatus || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}) || {};

    const leadsByStatus = Object.entries(statusStats)
      .map(([status, count]) => ({
        status,
        count: count as number,
        percentage: filteredLeadsCount > 0 ? Math.round((count as number / filteredLeadsCount) * 100 * 10) / 10 : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate cost statistics
    const costs = leadsData?.map(lead => lead.leadcost || 0).filter(cost => cost > 0) || [];
    const leadsByCost = {
      totalCost: costs.reduce((sum, cost) => sum + cost, 0),
      averageCost: costs.length > 0 ? costs.reduce((sum, cost) => sum + cost, 0) / costs.length : 0,
      minCost: costs.length > 0 ? Math.min(...costs) : 0,
      maxCost: costs.length > 0 ? Math.max(...costs) : 0,
    };

    // Get actual total batches count (unfiltered) for the "Total Batches" card
    const { count: actualTotalBatches, error: totalBatchesError } = await supabase
      .from('upload_batches')
      .select('*', { count: 'exact', head: true });

    if (totalBatchesError) {
      console.error('Error fetching total batches count:', totalBatchesError);
    }

    // Get batch statistics with date filtering for other calculations
    let batchQuery = supabase
      .from('upload_batches')
      .select('*')
      .gte('createdat', startDate.toISOString())
      .lte('createdat', endDate.toISOString());

    // Apply batch filters if provided
    if (batchIds && batchIds.length > 0) {
      batchQuery = batchQuery.in('id', batchIds);
    }
    if (supplierIds && supplierIds.length > 0) {
      batchQuery = batchQuery.in('supplierid', supplierIds);
    }

    const { data: batchData, error: batchError } = await batchQuery;

    if (batchError) {
      console.error('Error fetching batch data:', batchError);
    }

    // Get current status counts from all batches (not just filtered)
    const { data: allBatchesData, error: allBatchesError } = await supabase
      .from('upload_batches')
      .select('status');

    if (allBatchesError) {
      console.error('Error fetching all batches data:', allBatchesError);
    }

    const totalBatches = actualTotalBatches || 0;
    const processingBatches = allBatchesData?.filter(batch => batch.status === 'Processing').length || 0;
    const completedBatches = allBatchesData?.filter(batch => batch.status === 'Completed').length || 0;
    const failedBatches = allBatchesData?.filter(batch => batch.status === 'Failed').length || 0;

    // Calculate real duplicates by source (supplier) using email and phone duplicates
    const duplicatesBySource = await Promise.all(
      leadsBySource.map(async (source) => {
        // Get leads for this source to check for duplicates
        const sourceLeads = leadsData?.filter(lead => {
          const supplierName = lead.supplierid ? supplierMap[lead.supplierid] : null;
          const leadSource = supplierName || lead.leadsource || 'Unknown Supplier';
          return leadSource === source.source;
        }) || [];

        // Find duplicates by email within this source
        const emailCounts: Record<string, number> = {};
        const phoneCounts: Record<string, number> = {};

        sourceLeads.forEach(lead => {
          if (lead.email) {
            emailCounts[lead.email.toLowerCase()] = (emailCounts[lead.email.toLowerCase()] || 0) + 1;
          }
          if (lead.phone) {
            phoneCounts[lead.phone] = (phoneCounts[lead.phone] || 0) + 1;
          }
        });

        // Calculate duplicates (entries that appear more than once)
        const emailDuplicateCount = Object.values(emailCounts).reduce((sum, count) => sum + (count > 1 ? count - 1 : 0), 0);
        const phoneDuplicateCount = Object.values(phoneCounts).reduce((sum, count) => sum + (count > 1 ? count - 1 : 0), 0);

        const totalSourceDuplicates = emailDuplicateCount + phoneDuplicateCount;
        const percentage = source.count > 0 ? Math.round((totalSourceDuplicates / source.count) * 100 * 10) / 10 : 0;

        return {
          source: source.source,
          duplicates: totalSourceDuplicates,
          percentage
        };
      })
    );

    // Get actual total duplicates from duplicate_leads table
    const { count: actualTotalDuplicates, error: duplicatesError } = await supabase
      .from('duplicate_leads')
      .select('*', { count: 'exact', head: true });

    if (duplicatesError) {
      console.error('Error fetching total duplicates count:', duplicatesError);
    }

    const totalDuplicates = actualTotalDuplicates || 0;

    // Calculate month-over-month growth based on actual total leads
    const currentDate = new Date();
    const lastMonthStart = new Date(currentDate);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    lastMonthStart.setDate(1); // Start of last month

    const lastMonthEnd = new Date(currentDate);
    lastMonthEnd.setDate(0); // End of last month

    const { count: lastMonthTotalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .lte('createdat', lastMonthEnd.toISOString());

    const monthOverMonthGrowth = lastMonthTotalLeads && lastMonthTotalLeads > 0
      ? Math.round(((totalLeads - lastMonthTotalLeads) / lastMonthTotalLeads) * 100 * 10) / 10
      : 0;

    // Get real DNC matches from dnc_entries table
    const { data: dncEntries } = await supabase
      .from('dnc_entries')
      .select('value, valuetype');

    let dncMatches = 0;
    if (dncEntries && leadsData) {
      // Check for DNC matches in current leads
      dncMatches = leadsData.filter(lead => {
        return dncEntries.some(dncEntry => {
          if (dncEntry.valuetype === 'email' && lead.email) {
            return lead.email.toLowerCase() === dncEntry.value.toLowerCase();
          }
          if (dncEntry.valuetype === 'phone' && lead.phone) {
            return lead.phone === dncEntry.value;
          }
          return false;
        });
      }).length;
    }

    // Get real recent activity from upload_batches
    const { data: recentBatches } = await supabase
      .from('upload_batches')
      .select('*')
      .order('createdat', { ascending: false })
      .limit(5);

    const recentActivity = recentBatches?.map(batch => ({
      id: batch.id.toString(),
      type: batch.status === 'Completed' ? 'batch_completed' :
            batch.status === 'Failed' ? 'batch_failed' : 'batch_processing',
      description: `Batch "${batch.filename}" ${batch.status.toLowerCase()} with ${batch.totalleads || 0} leads${batch.duplicateleads ? ` (${batch.duplicateleads} duplicates)` : ''}`,
      timestamp: batch.createdat || batch.completedat || new Date().toISOString()
    })) || [];

    return NextResponse.json({
      totalLeads,
      leadsBySource,
      duplicatesBySource,
      totalBatches,
      processingBatches,
      completedBatches,
      failedBatches,
      totalDuplicates,
      dncMatches,
      leadsByStatus,
      leadsByCost,
      monthOverMonthGrowth,
      recentActivity
    });

  } catch (error) {
    console.error('Error fetching lead stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch lead statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
