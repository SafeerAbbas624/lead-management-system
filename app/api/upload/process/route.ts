import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ProcessedUpload {
  data: any[]
  supplierId: number
  leadCost: number
  duplicateStats: any
  dncStats: any
  fieldMappings?: any
  cleaningStats?: any
  normalizationStats?: any
  taggingStats?: any
}

export async function POST(request: NextRequest) {
  try {
    const body: ProcessedUpload = await request.json();
    const { data, supplierId, leadCost, duplicateStats, dncStats } = body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('No data provided for upload');
    }

    if (!supplierId || !leadCost) {
      throw new Error('Supplier ID and lead cost are required');
    }

    // Get supplier information
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single();

    if (supplierError || !supplier) {
      throw new Error('Invalid supplier ID');
    }

    // Create upload batch record
    const { data: uploadBatch, error: batchError } = await supabase
      .from('upload_batches')
      .insert({
        filename: `processed_upload_${Date.now()}.json`,
        filetype: 'application/json',
        status: 'processing',
        totalleads: data.length,
        cleanedleads: dncStats?.cleanLeads || data.length,
        duplicateleads: duplicateStats?.duplicateCount || 0,
        dncmatches: dncStats?.dncMatches || 0,
        originalheaders: Object.keys(data[0] || {}),
        mappingrules: body.fieldMappings || {},
        uploadedby: 1, // TODO: Get from authenticated user
        processingprogress: 0,
        supplierid: supplierId,
        sourcename: supplier.name,
        createdat: new Date().toISOString(),
      })
      .select()
      .single();

    if (batchError || !uploadBatch) {
      throw new Error(`Failed to create upload batch: ${batchError?.message}`);
    }

    // Prepare leads for insertion
    const leadsToInsert = (dncStats?.cleanData || data).map((lead: any) => ({
      email: lead.email || null,
      firstname: lead.firstname || null,
      lastname: lead.lastname || null,
      phone: lead.phone || null,
      companyname: lead.companyname || null,
      taxid: lead.taxid || null,
      address: lead.address || null,
      city: lead.city || null,
      state: lead.state || null,
      zipcode: lead.zipcode || null,
      country: lead.country || null,
      leadsource: supplier.name,
      leadstatus: 'new',
      leadscore: lead.leadscore || null,
      leadcost: leadCost,
      exclusivity: lead.exclusivity || false,
      exclusivitynotes: lead.exclusivitynotes || null,
      uploadbatchid: uploadBatch.id,
      clientid: null, // Will be assigned during distribution
      supplierid: supplierId,
      metadata: {
        originalData: lead,
        processingStats: {
          duplicateCheck: duplicateStats,
          dncCheck: dncStats,
        },
      },
      tags: lead.tags || [],
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
    }));

    // Insert leads in batches to avoid timeout
    const batchSize = 100;
    const insertedLeads: any[] = [];
    let processedCount = 0;

    for (let i = 0; i < leadsToInsert.length; i += batchSize) {
      const batch = leadsToInsert.slice(i, i + batchSize);
      
      const { data: insertedBatch, error: insertError } = await supabase
        .from('leads')
        .insert(batch)
        .select();

      if (insertError) {
        console.error('Error inserting leads batch:', insertError);
        // Continue with next batch, but log the error
      } else if (insertedBatch) {
        insertedLeads.push(...insertedBatch);
      }

      processedCount += batch.length;
      
      // Update progress
      const progress = Math.round((processedCount / leadsToInsert.length) * 100);
      await supabase
        .from('upload_batches')
        .update({ processingprogress: progress })
        .eq('id', uploadBatch.id);
    }

    // Handle duplicates - insert into duplicate_leads table
    if (duplicateStats?.duplicates && duplicateStats.duplicates.length > 0) {
      const duplicatesToInsert = duplicateStats.duplicates.map((duplicate: any) => ({
        email: duplicate.email || null,
        firstname: duplicate.firstname || null,
        lastname: duplicate.lastname || null,
        phone: duplicate.phone || null,
        companyname: duplicate.companyname || null,
        taxid: duplicate.taxid || null,
        address: duplicate.address || null,
        city: duplicate.city || null,
        state: duplicate.state || null,
        zipcode: duplicate.zipcode || null,
        country: duplicate.country || null,
        leadsource: supplier.name,
        leadstatus: 'duplicate',
        leadscore: duplicate.leadscore || null,
        leadcost: leadCost,
        exclusivity: duplicate.exclusivity || false,
        exclusivitynotes: duplicate.exclusivitynotes || null,
        metadata: {
          originalData: duplicate,
          duplicateInfo: duplicate.duplicateInfo,
        },
        tags: duplicate.tags || [],
        original_lead_id: duplicate.originalLeadId || null,
        upload_batch_id: uploadBatch.id,
        supplier_id: supplierId,
        supplier_name: supplier.name,
        duplicate_type: duplicate.duplicateType || 'unknown',
        duplicate_reason: duplicate.duplicateReason || 'Unknown duplicate reason',
        duplicate_fields: duplicate.duplicateFields || {},
        created_at: new Date().toISOString(),
        detected_at: new Date().toISOString(),
      }));

      // Insert duplicates in batches
      for (let i = 0; i < duplicatesToInsert.length; i += batchSize) {
        const batch = duplicatesToInsert.slice(i, i + batchSize);
        
        const { error: duplicateError } = await supabase
          .from('duplicate_leads')
          .insert(batch);

        if (duplicateError) {
          console.error('Error inserting duplicate leads:', duplicateError);
        }
      }
    }

    // Update upload batch as completed
    const { error: updateError } = await supabase
      .from('upload_batches')
      .update({
        status: 'completed',
        processingprogress: 100,
        cleanedleads: insertedLeads.length,
        completedat: new Date().toISOString(),
      })
      .eq('id', uploadBatch.id);

    if (updateError) {
      console.error('Error updating upload batch:', updateError);
    }

    // Calculate final statistics
    const finalStats = {
      uploadBatchId: uploadBatch.id,
      totalProcessed: data.length,
      leadsInserted: insertedLeads.length,
      duplicatesFound: duplicateStats?.duplicateCount || 0,
      dncMatches: dncStats?.dncMatches || 0,
      cleanLeads: insertedLeads.length,
      supplierName: supplier.name,
      leadCost: leadCost,
      totalCost: insertedLeads.length * leadCost,
      processingTime: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Upload processed successfully',
      stats: finalStats,
      uploadBatch: {
        id: uploadBatch.id,
        filename: uploadBatch.filename,
        status: 'completed',
        totalleads: uploadBatch.totalleads,
        cleanedleads: insertedLeads.length,
        duplicateleads: duplicateStats?.duplicateCount || 0,
        dncmatches: dncStats?.dncMatches || 0,
      },
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process upload',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check upload status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      // Return recent uploads
      const { data: recentUploads, error } = await supabase
        .from('upload_batches')
        .select(`
          *,
          suppliers(name),
          users(username)
        `)
        .order('createdat', { ascending: false })
        .limit(10);

      if (error) {
        throw new Error(`Failed to fetch recent uploads: ${error.message}`);
      }

      return NextResponse.json({
        success: true,
        recentUploads: recentUploads || [],
      });
    }

    // Return specific upload status
    const { data: upload, error } = await supabase
      .from('upload_batches')
      .select(`
        *,
        suppliers(name),
        users(username)
      `)
      .eq('id', batchId)
      .single();

    if (error || !upload) {
      throw new Error('Upload batch not found');
    }

    return NextResponse.json({
      success: true,
      upload,
    });
  } catch (error) {
    console.error('Error fetching upload status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch upload status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
