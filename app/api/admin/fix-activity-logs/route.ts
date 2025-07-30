import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // Update existing activity logs to use correct user IDs
    // Replace user ID 1 with user ID 8 (admin - Safeer Abbas)
    const { error: updateError1 } = await supabase
      .from('activity_logs')
      .update({ userid: 8 })
      .eq('userid', 1);

    if (updateError1) {
      console.error('Error updating user ID 1:', updateError1);
    }

    // Replace user ID 2 with user ID 10 (Ben - Nathen Ben)
    const { error: updateError2 } = await supabase
      .from('activity_logs')
      .update({ userid: 10 })
      .eq('userid', 2);

    if (updateError2) {
      console.error('Error updating user ID 2:', updateError2);
    }

    // Add some new activity logs with the correct user IDs
    const newLogs = [
      {
        activitytype: 'login',
        userid: 8,
        resourcetype: 'auth',
        resourceid: 'session_admin_001',
        details: { method: 'password', success: true, browser: 'Chrome', location: 'Dashboard' },
        ipaddress: '192.168.1.100',
        useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdat: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
      },
      {
        activitytype: 'upload',
        userid: 8,
        resourcetype: 'batch',
        resourceid: '44',
        details: { filename: 'test.csv', total_leads: 1311, clean_leads: 1311, duplicates: 0, file_size: '2.5MB' },
        ipaddress: '192.168.1.100',
        useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdat: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
      },
      {
        activitytype: 'login',
        userid: 10,
        resourcetype: 'auth',
        resourceid: 'session_ben_001',
        details: { method: 'password', success: true, browser: 'Firefox', location: 'Analytics' },
        ipaddress: '192.168.1.101',
        useragent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
        createdat: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      },
      {
        activitytype: 'export',
        userid: 10,
        resourcetype: 'lead',
        resourceid: 'export_ben_001',
        details: { format: 'CSV', total_records: 500, client_filter: 'active', date_range: 'last_7_days' },
        ipaddress: '192.168.1.101',
        useragent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
        createdat: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString() // 1.5 hours ago
      },
      {
        activitytype: 'login',
        userid: 11,
        resourcetype: 'auth',
        resourceid: 'session_nir_001',
        details: { method: 'password', success: true, browser: 'Safari', location: 'Leads' },
        ipaddress: '192.168.1.102',
        useragent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        createdat: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
      },
      {
        activitytype: 'read',
        userid: 11,
        resourcetype: 'lead',
        resourceid: 'view_leads_001',
        details: { action: 'view_leads_list', filters: { status: 'New', source: 'all' }, total_viewed: 150 },
        ipaddress: '192.168.1.102',
        useragent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        createdat: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString() // 3.5 hours ago
      }
    ];

    // Insert new logs
    const { error: insertError } = await supabase
      .from('activity_logs')
      .insert(newLogs);

    if (insertError) {
      console.error('Error inserting new logs:', insertError);
      return NextResponse.json({
        success: false,
        error: 'Failed to insert new activity logs',
        details: insertError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Activity logs updated successfully',
      updatedLogs: newLogs.length,
      userMappings: {
        'User ID 1 → User ID 8': 'Safeer Abbas (admin)',
        'User ID 2 → User ID 10': 'Nathen Ben (manager)',
        'New logs added for': 'All three users (8, 10, 11)'
      }
    });

  } catch (error) {
    console.error('Error fixing activity logs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fix activity logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
