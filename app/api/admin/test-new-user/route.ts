import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // Create a test user
    const testUser = {
      username: 'testuser_' + Date.now(),
      password: 'hashedpassword123', // In real app, this would be properly hashed
      fullName: 'Test User Demo',
      email: 'testuser@example.com',
      role: 'Viewer',
      createdAt: new Date().toISOString()
    };

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();

    if (userError) {
      console.error('Error creating test user:', userError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create test user',
        details: userError.message
      }, { status: 500 });
    }

    // Create some activity logs for the new user
    const testActivities = [
      {
        activitytype: 'login',
        userid: newUser.id,
        resourcetype: 'auth',
        resourceid: `session_test_${newUser.id}`,
        details: { 
          method: 'password', 
          success: true, 
          browser: 'Chrome', 
          location: 'Dashboard',
          first_login: true 
        },
        ipaddress: '192.168.1.200',
        useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Test User)',
        createdat: new Date().toISOString()
      },
      {
        activitytype: 'read',
        userid: newUser.id,
        resourcetype: 'lead',
        resourceid: 'view_test_001',
        details: { 
          action: 'view_leads_list', 
          filters: { status: 'New' }, 
          total_viewed: 25,
          user_role: 'viewer'
        },
        ipaddress: '192.168.1.200',
        useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Test User)',
        createdat: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
      },
      {
        activitytype: 'export',
        userid: newUser.id,
        resourcetype: 'lead',
        resourceid: 'export_test_001',
        details: { 
          format: 'CSV', 
          total_records: 10, 
          permission_level: 'viewer',
          approved_by: 'system'
        },
        ipaddress: '192.168.1.200',
        useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Test User)',
        createdat: new Date(Date.now() - 10 * 60 * 1000).toISOString() // 10 minutes ago
      }
    ];

    const { error: activityError } = await supabase
      .from('activity_logs')
      .insert(testActivities);

    if (activityError) {
      console.error('Error creating test activities:', activityError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create test activities',
        details: activityError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Test user and activities created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role
      },
      activitiesCreated: testActivities.length,
      testInstructions: {
        step1: 'Check the Activity Logs page to see the new user activities',
        step2: 'The new user should appear with their full name',
        step3: 'All activities should show proper user context'
      }
    });

  } catch (error) {
    console.error('Error in test new user API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test new user functionality',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
