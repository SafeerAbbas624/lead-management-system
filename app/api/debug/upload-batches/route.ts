import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Check if upload_batches table exists and has data
    const { data: batches, error, count } = await supabase
      .from('upload_batches')
      .select('*', { count: 'exact' })
      .limit(10);

    if (error) {
      console.error('Error querying upload_batches:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: 'Failed to query upload_batches table'
      });
    }

    return NextResponse.json({
      success: true,
      totalCount: count,
      sampleData: batches,
      message: `Found ${count} upload batches in database`
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Debug endpoint failed'
    });
  }
}

export async function POST() {
  try {
    // Create some sample upload batches for testing
    const sampleBatches = [
      {
        filename: 'sample_leads_1.csv',
        filetype: 'text/csv',
        status: 'Completed',
        totalleads: 150,
        cleanedleads: 130,
        duplicateleads: 15,
        dncmatches: 5,
        originalheaders: ['firstname', 'lastname', 'email', 'phone'],
        mappingrules: {},
        uploadedby: 1,
        processingprogress: 100,
        supplierid: 1,
        sourcename: 'Website Forms',
        createdat: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        completedat: new Date(Date.now() - 86400000 + 300000).toISOString() // 5 minutes later
      },
      {
        filename: 'sample_leads_2.xlsx',
        filetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        status: 'Processing',
        totalleads: 200,
        cleanedleads: 0,
        duplicateleads: 0,
        dncmatches: 0,
        originalheaders: ['name', 'email', 'phone', 'company'],
        mappingrules: {},
        uploadedby: 1,
        processingprogress: 45,
        supplierid: 2,
        sourcename: 'Email Campaign',
        createdat: new Date().toISOString(),
        completedat: null
      },
      {
        filename: 'sample_leads_3.csv',
        filetype: 'text/csv',
        status: 'Completed',
        totalleads: 300,
        cleanedleads: 280,
        duplicateleads: 18,
        dncmatches: 2,
        originalheaders: ['first_name', 'last_name', 'email_address', 'phone_number'],
        mappingrules: {},
        uploadedby: 1,
        processingprogress: 100,
        supplierid: 1,
        sourcename: 'Lead Generation Campaign',
        createdat: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        completedat: new Date(Date.now() - 172800000 + 600000).toISOString() // 10 minutes later
      }
    ];

    const { data, error } = await supabase
      .from('upload_batches')
      .insert(sampleBatches)
      .select();

    if (error) {
      console.error('Error inserting sample batches:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: 'Failed to insert sample upload batches'
      });
    }

    return NextResponse.json({
      success: true,
      message: `Created ${data.length} sample upload batches`,
      data: data
    });

  } catch (error) {
    console.error('Error creating sample batches:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Failed to create sample batches'
    });
  }
}
