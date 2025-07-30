import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batchId = parseInt(params.id);
    
    if (isNaN(batchId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid batch ID' },
        { status: 400 }
      );
    }

    // Get batch details from upload_batches table
    const { data: batch, error: batchError } = await supabase
      .from('upload_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (batchError) {
      console.error('Error fetching batch details:', batchError);
      return NextResponse.json(
        { success: false, error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Get supplier details if available
    let supplier = null;
    if (batch.supplierid) {
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, name, email')
        .eq('id', batch.supplierid)
        .single();
      
      if (!supplierError && supplierData) {
        supplier = supplierData;
      }
    }

    // Get some sample leads from this batch
    const { data: sampleLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, email, firstname, lastname, phone, companyname, leadcost, tags')
      .eq('uploadbatchid', batchId)
      .limit(5);

    // Get duplicate leads count and samples
    const { data: duplicateLeads, error: duplicatesError } = await supabase
      .from('duplicate_leads')
      .select('id, email, firstname, lastname, duplicate_type, duplicate_reason')
      .eq('upload_batch_id', batchId)
      .limit(5);

    // Format the response
    const batchDetails = {
      id: batch.id,
      filename: batch.filename,
      filetype: batch.filetype,
      status: batch.status,
      totalleads: batch.totalleads,
      cleanedleads: batch.cleanedleads,
      duplicateleads: batch.duplicateleads,
      dncmatches: batch.dncmatches,
      errormessage: batch.errormessage,
      originalheaders: batch.originalheaders,
      mappingrules: batch.mappingrules,
      sourcename: batch.sourcename,
      createdat: batch.createdat,
      completedat: batch.completedat,
      supplier: supplier,
      sampleLeads: sampleLeads || [],
      duplicateLeads: duplicateLeads || []
    };

    return NextResponse.json({
      success: true,
      batch: batchDetails
    });

  } catch (error: any) {
    console.error('Error in batch details API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
