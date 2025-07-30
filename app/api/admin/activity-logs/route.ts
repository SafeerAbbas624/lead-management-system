import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const activityType = searchParams.get('activityType');
    const resourceType = searchParams.get('resourceType');
    const userId = searchParams.get('userId');

    // Build the query without join (we'll fetch user data separately if needed)
    let query = supabase
      .from('activity_logs')
      .select(`
        id,
        activitytype,
        userid,
        resourcetype,
        resourceid,
        details,
        ipaddress,
        useragent,
        createdat
      `)
      .order('createdat', { ascending: false })
      .limit(limit);

    // Apply filters
    if (activityType && activityType !== 'all') {
      query = query.eq('activitytype', activityType);
    }

    if (resourceType && resourceType !== 'all') {
      query = query.eq('resourcetype', resourceType);
    }

    if (userId) {
      query = query.eq('userid', userId);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching activity logs:', error);

      // If table doesn't exist, return helpful error message
      if (error.code === '42P01') {
        return NextResponse.json({
          success: false,
          error: 'Activity logs table does not exist',
          details: 'Please create the activity_logs table using the provided schema.',
          tableNotFound: true
        }, { status: 404 });
      }

      throw error;
    }

    // Get unique user IDs to fetch user data
    const userIds = [...new Set(logs?.map(log => log.userid).filter(Boolean))] as number[];

    // Fetch user data if we have user IDs
    let usersData: any[] = [];
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, "fullName"')
        .in('id', userIds);

      if (!usersError) {
        usersData = users || [];
      }
    }

    // Create a map for quick user lookup
    const usersMap = new Map(usersData.map(user => [user.id, user]));

    // Transform the data to match the frontend interface
    const transformedLogs = logs?.map(log => {
      const user = usersMap.get(log.userid);
      return {
        id: log.id.toString(),
        activityType: log.activitytype,
        userId: log.userid?.toString() || '',
        userName: user?.fullName || user?.username || 'Unknown User',
        resourceType: log.resourcetype || '',
        resourceId: log.resourceid || '',
        details: log.details || {},
        ipAddress: log.ipaddress || '',
        userAgent: log.useragent || '',
        timestamp: log.createdat
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: transformedLogs
    });

  } catch (error) {
    console.error('Error in activity logs API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch activity logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST endpoint to create activity logs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      activityType,
      userId,
      resourceType,
      resourceId,
      details,
      ipAddress,
      userAgent
    } = body;

    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        activitytype: activityType,
        userid: userId,
        resourcetype: resourceType,
        resourceid: resourceId,
        details: details,
        ipaddress: ipAddress,
        useragent: userAgent,
        createdat: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating activity log:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error in activity logs POST API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create activity log',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
