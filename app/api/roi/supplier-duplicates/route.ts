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

    // Get upload batches with supplier information within date range
    const { data: batchesData, error: batchesError } = await supabase
      .from('upload_batches')
      .select(`
        id,
        totalleads,
        cleanedleads,
        duplicateleads,
        createdat,
        suppliers (
          id,
          name
        )
      `)
      .gte('createdat', fromDate)
      .lte('createdat', toDate)
      .not('suppliers', 'is', null);

    if (batchesError) throw batchesError;

    // Get duplicate leads data within date range
    const { data: duplicatesData, error: duplicatesError } = await supabase
      .from('duplicate_leads')
      .select('supplier_id, supplier_name, created_at')
      .gte('created_at', fromDate)
      .lte('created_at', toDate);

    if (duplicatesError) throw duplicatesError;

    // Group data by supplier
    const supplierMetrics = new Map();

    // Process upload batches
    batchesData?.forEach(batch => {
      const supplierId = batch.suppliers?.id;
      const supplierName = batch.suppliers?.name || 'Unknown Supplier';

      if (!supplierId) return;

      if (!supplierMetrics.has(supplierId)) {
        supplierMetrics.set(supplierId, {
          supplierName,
          totalLeads: 0,
          cleanLeads: 0,
          duplicateLeads: 0,
          duplicateRate: 0,
          qualityScore: 0
        });
      }

      const metrics = supplierMetrics.get(supplierId);
      metrics.totalLeads += batch.totalleads || 0;
      metrics.cleanLeads += batch.cleanedleads || 0;
      metrics.duplicateLeads += batch.duplicateleads || 0;

      supplierMetrics.set(supplierId, metrics);
    });

    // Process additional duplicate leads data
    duplicatesData?.forEach(duplicate => {
      if (!duplicate.supplier_id) return;

      const supplierId = duplicate.supplier_id;
      const supplierName = duplicate.supplier_name || 'Unknown Supplier';

      if (!supplierMetrics.has(supplierId)) {
        supplierMetrics.set(supplierId, {
          supplierName,
          totalLeads: 0,
          cleanLeads: 0,
          duplicateLeads: 0,
          duplicateRate: 0,
          qualityScore: 0
        });
      }

      const metrics = supplierMetrics.get(supplierId);
      metrics.duplicateLeads++;

      supplierMetrics.set(supplierId, metrics);
    });

    // Calculate derived metrics
    const result = Array.from(supplierMetrics.values())
      .map(metrics => {
        // Calculate duplicate rate
        metrics.duplicateRate = metrics.totalLeads > 0 
          ? (metrics.duplicateLeads / metrics.totalLeads) * 100 
          : 0;

        // Calculate quality score (percentage of clean leads)
        metrics.qualityScore = metrics.totalLeads > 0 
          ? (metrics.cleanLeads / metrics.totalLeads) * 100 
          : 0;

        // Round to 2 decimal places
        metrics.duplicateRate = parseFloat(metrics.duplicateRate.toFixed(2));
        metrics.qualityScore = parseFloat(metrics.qualityScore.toFixed(2));

        return metrics;
      })
      .filter(metrics => metrics.totalLeads > 0) // Only include suppliers with leads
      .sort((a, b) => b.qualityScore - a.qualityScore); // Sort by quality score descending

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching supplier duplicates data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch supplier duplicates data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
