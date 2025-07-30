import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DNCMatch {
  leadIndex: number
  leadData: any
  dncEntry: any
  matchType: 'email' | 'phone'
  matchValue: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid data format. Expected array of objects.');
    }

    // Get all active DNC lists
    const { data: dncLists, error: listsError } = await supabase
      .from('dnc_lists')
      .select('*')
      .eq('isactive', true);

    if (listsError) {
      throw new Error(`Failed to fetch DNC lists: ${listsError.message}`);
    }

    if (!dncLists || dncLists.length === 0) {
      return NextResponse.json({
        success: true,
        dncMatches: 0,
        matches: [],
        cleanData: data,
        stats: {
          totalLeads: data.length,
          dncMatches: 0,
          cleanLeads: data.length,
          emailMatches: 0,
          phoneMatches: 0,
        }
      });
    }

    // Get all DNC entries for active lists
    const dncListIds = dncLists.map(list => list.id);
    const { data: dncEntries, error: entriesError } = await supabase
      .from('dnc_entries')
      .select('*')
      .in('dnclistid', dncListIds)
      .or('expirydate.is.null,expirydate.gt.now()'); // Include entries with no expiry or future expiry

    if (entriesError) {
      throw new Error(`Failed to fetch DNC entries: ${entriesError.message}`);
    }

    // Create lookup maps for faster searching
    const emailDNCMap = new Map<string, any>();
    const phoneDNCMap = new Map<string, any>();

    if (dncEntries) {
      dncEntries.forEach(entry => {
        const normalizedValue = entry.value.toLowerCase().trim();
        
        if (entry.valuetype === 'email') {
          emailDNCMap.set(normalizedValue, entry);
        } else if (entry.valuetype === 'phone') {
          // Normalize phone number for comparison
          const normalizedPhone = normalizedValue.replace(/\D/g, '');
          phoneDNCMap.set(normalizedPhone, entry);
        }
      });
    }

    // Check each lead against DNC lists
    const matches: DNCMatch[] = [];
    const cleanData: any[] = [];

    data.forEach((lead, index) => {
      let isDNCMatch = false;
      let matchInfo: DNCMatch | null = null;

      // Check email against DNC
      if (lead.email && emailDNCMap.has(lead.email.toLowerCase().trim())) {
        isDNCMatch = true;
        matchInfo = {
          leadIndex: index,
          leadData: lead,
          dncEntry: emailDNCMap.get(lead.email.toLowerCase().trim()),
          matchType: 'email',
          matchValue: lead.email
        };
      }

      // Check phone against DNC (if not already matched by email)
      if (!isDNCMatch && lead.phone) {
        const normalizedPhone = lead.phone.replace(/\D/g, '');
        if (normalizedPhone.length >= 10 && phoneDNCMap.has(normalizedPhone)) {
          isDNCMatch = true;
          matchInfo = {
            leadIndex: index,
            leadData: lead,
            dncEntry: phoneDNCMap.get(normalizedPhone),
            matchType: 'phone',
            matchValue: lead.phone
          };
        }
      }

      if (isDNCMatch && matchInfo) {
        matches.push(matchInfo);
      } else {
        cleanData.push(lead);
      }
    });

    // Calculate statistics
    const stats = {
      totalLeads: data.length,
      dncMatches: matches.length,
      cleanLeads: cleanData.length,
      emailMatches: matches.filter(m => m.matchType === 'email').length,
      phoneMatches: matches.filter(m => m.matchType === 'phone').length,
      dncListsChecked: dncLists.length,
      totalDNCEntries: dncEntries?.length || 0,
    };

    // If there are matches, we should add them to DNC entries for tracking
    if (matches.length > 0) {
      const newDNCEntries = matches.map(match => ({
        value: match.matchValue,
        valuetype: match.matchType,
        source: 'upload_check',
        reason: `Matched during upload check - Original DNC ID: ${match.dncEntry.id}`,
        dnclistid: match.dncEntry.dnclistid,
        createdat: new Date().toISOString(),
      }));

      // Insert new DNC entries for tracking
      const { error: insertError } = await supabase
        .from('dnc_entries')
        .insert(newDNCEntries);

      if (insertError) {
        console.error('Error inserting DNC tracking entries:', insertError);
        // Don't fail the whole process if tracking fails
      }
    }

    return NextResponse.json({
      success: true,
      dncMatches: matches.length,
      matches: matches.map(match => ({
        leadData: match.leadData,
        matchType: match.matchType,
        matchValue: match.matchValue,
        dncList: dncLists.find(list => list.id === match.dncEntry.dnclistid)?.name,
        reason: match.dncEntry.reason,
      })),
      cleanData,
      stats,
    });
  } catch (error) {
    console.error('Error checking DNC:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check DNC lists',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve DNC statistics
export async function GET(request: NextRequest) {
  try {
    // Get DNC lists with entry counts
    const { data: dncLists, error: listsError } = await supabase
      .from('dnc_lists')
      .select(`
        *,
        dnc_entries(count)
      `);

    if (listsError) {
      throw new Error(`Failed to fetch DNC lists: ${listsError.message}`);
    }

    // Get total DNC entries by type
    const { data: entryCounts, error: countsError } = await supabase
      .from('dnc_entries')
      .select('valuetype')
      .not('expirydate', 'lt', new Date().toISOString());

    if (countsError) {
      throw new Error(`Failed to fetch DNC entry counts: ${countsError.message}`);
    }

    const emailCount = entryCounts?.filter(entry => entry.valuetype === 'email').length || 0;
    const phoneCount = entryCounts?.filter(entry => entry.valuetype === 'phone').length || 0;

    return NextResponse.json({
      success: true,
      dncLists: dncLists || [],
      totalLists: dncLists?.length || 0,
      totalEntries: (entryCounts?.length || 0),
      emailEntries: emailCount,
      phoneEntries: phoneCount,
      activeLists: dncLists?.filter(list => list.isactive).length || 0,
    });
  } catch (error) {
    console.error('Error fetching DNC statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch DNC statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
