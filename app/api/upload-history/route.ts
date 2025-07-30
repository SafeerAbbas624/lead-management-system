import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get upload history from upload_batches table (without join)
    const { data: batches, error: batchesError } = await supabase
      .from('upload_batches')
      .select('*')
      .order('createdat', { ascending: false })
      .limit(50);

    if (batchesError) {
      console.error('Error fetching upload history:', batchesError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch upload history'
        },
        { status: 500 }
      );
    }

    // Get suppliers separately if needed
    const supplierIds = [...new Set(batches?.map(b => b.supplierid).filter(Boolean) || [])];
    let suppliersMap: Record<number, any> = {};

    if (supplierIds.length > 0) {
      const { data: suppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id, name, email')
        .in('id', supplierIds);

      if (!suppliersError && suppliers) {
        suppliersMap = suppliers.reduce((acc, supplier) => {
          acc[supplier.id] = supplier;
          return acc;
        }, {} as Record<number, any>);
      }
    }

    // Map database fields to frontend expected format
    const mappedBatches = (batches || []).map((batch: any) => {
      const supplier = batch.supplierid ? suppliersMap[batch.supplierid] : null;

      return {
        id: batch.id,
        filename: batch.filename,
        filetype: batch.filetype,
        status: batch.status,
        totalleads: batch.totalleads,
        cleanedleads: batch.cleanedleads,
        duplicateleads: batch.duplicateleads,
        dncmatches: batch.dncmatches,
        sourcename: batch.sourcename || (supplier ? supplier.name : 'Unknown'),
        total_buying_price: batch.total_buying_price || 0,
        buying_price_per_lead: batch.buying_price_per_lead || 0,
        createdat: batch.createdat,
        completedat: batch.completedat,
        supplier: supplier
      };
    });

    return NextResponse.json({
      success: true,
      batches: mappedBatches
    });
  } catch (error: any) {
    console.error('Error in upload history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
