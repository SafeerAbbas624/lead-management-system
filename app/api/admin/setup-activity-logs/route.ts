import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // First, try to check if the table exists
    const { error: tableError } = await supabase
      .from('activity_logs')
      .select('id')
      .limit(1);

    if (tableError && tableError.code === '42P01') {
      // Table doesn't exist, create it using raw SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.activity_logs (
          id SERIAL PRIMARY KEY,
          activitytype text NOT NULL,
          userid integer,
          resourcetype text,
          resourceid text,
          details jsonb,
          ipaddress text,
          useragent text,
          createdat timestamp with time zone NOT NULL DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS idx_activity_logs_userid ON public.activity_logs(userid);
        CREATE INDEX IF NOT EXISTS idx_activity_logs_activitytype ON public.activity_logs(activitytype);
        CREATE INDEX IF NOT EXISTS idx_activity_logs_createdat ON public.activity_logs(createdat);
      `;

      // Use the SQL editor approach
      const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createTableSQL });

      if (sqlError) {
        console.error('Error creating table with SQL:', sqlError);
        return NextResponse.json({
          success: false,
          error: 'Failed to create activity_logs table',
          details: 'Please create the table manually using the provided schema file.'
        }, { status: 500 });
      }
    }

    // Insert sample data
    const sampleLogs = [
      {
        activitytype: 'login',
        userid: 1,
        resourcetype: 'auth',
        resourceid: 'session_001',
        details: { method: 'password', success: true, browser: 'Chrome' },
        ipaddress: '192.168.1.100',
        useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdat: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
      },
      {
        activitytype: 'upload',
        userid: 1,
        resourcetype: 'batch',
        resourceid: '13',
        details: { filename: 'leads_batch_december.csv', total_leads: 500, clean_leads: 485, duplicates: 15 },
        ipaddress: '192.168.1.100',
        useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdat: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
      },
      {
        activitytype: 'distribute_leads',
        userid: 1,
        resourcetype: 'batch',
        resourceid: '13',
        details: { client_ids: [1, 2], total_leads: 485, distribution_method: 'percentage' },
        ipaddress: '192.168.1.100',
        useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdat: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        activitytype: 'create',
        userid: 1,
        resourcetype: 'user',
        resourceid: '3',
        details: { username: 'newuser', role: 'viewer', fullname: 'New User' },
        ipaddress: '192.168.1.100',
        useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdat: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        activitytype: 'update',
        userid: 1,
        resourcetype: 'lead',
        resourceid: '1001',
        details: { field: 'status', old_value: 'New', new_value: 'Contacted' },
        ipaddress: '192.168.1.100',
        useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdat: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
      },
      {
        activitytype: 'export',
        userid: 1,
        resourcetype: 'lead',
        resourceid: 'export_001',
        details: { format: 'CSV', total_records: 150, client_id: 1 },
        ipaddress: '192.168.1.100',
        useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdat: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() // 8 hours ago
      },
      {
        activitytype: 'delete',
        userid: 1,
        resourcetype: 'dnc_entry',
        resourceid: 'phone_001',
        details: { type: 'phone', value: '+1234567890', reason: 'Expired request' },
        ipaddress: '192.168.1.100',
        useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdat: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      {
        activitytype: 'login',
        userid: 2,
        resourcetype: 'auth',
        resourceid: 'session_002',
        details: { method: 'password', success: true, browser: 'Firefox' },
        ipaddress: '192.168.1.101',
        useragent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
        createdat: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      }
    ];

    // Insert sample logs
    const { error: insertError } = await supabase
      .from('activity_logs')
      .insert(sampleLogs);

    if (insertError) {
      console.error('Error inserting sample data:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Failed to insert sample activity logs',
        details: insertError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Activity logs table setup completed successfully',
      sampleLogsInserted: sampleLogs.length
    });

  } catch (error) {
    console.error('Error setting up activity logs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to setup activity logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
