import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const dynamic = 'force-dynamic';

// Types
type DNCList = {
  id?: number;
  name: string;
  type: string;
  description: string | null;
  isactive: boolean | null;
  createdat: string;
  lastupdated: string | null;
};

type DNCEntry = {
  id?: number;
  value: string;
  valuetype: string;
  source: string | null;
  reason: string | null;
  dnclistid: number;
  createdat: string;
  expirydate: string | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listId = searchParams.get('listId');
  const type = searchParams.get('type');
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    
    // Get DNC Lists
    if (type === 'lists') {
      const { data: lists, error } = await supabase
        .from('dnc_lists')
        .select('*')
        .ilike('name', `%${search}%`)
        .order('createdat', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ data: lists });
    }

    // Get DNC Entries
    if (listId) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data: entries, count, error } = await supabase
        .from('dnc_entries')
        .select('*', { count: 'exact' })
        .eq('dnclistid', listId)
        .ilike('value', `%${search}%`)
        .order('createdat', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return NextResponse.json({ data: entries, count });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('DNC API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DNC data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    const data = await request.json();
    const { type } = data;

    if (type === 'list') {
      const { name, description = null, type: listType = 'internal', isactive = true } = data;
      
      const { data: newList, error } = await supabase
        .from('dnc_lists')
        .insert({
          name,
          description,
          type: listType,
          isactive,
          createdat: new Date().toISOString(),
          lastupdated: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) throw error;
      return NextResponse.json(newList, { status: 201 });
    }

    if (type === 'entry') {
      const { value, value_type, source = null, reason = null, dnclistid, expirydate = null } = data;
      
      // Validate entry doesn't already exist in this list
      const { data: existingEntry } = await supabase
        .from('dnc_entries')
        .select('id')
        .eq('value', value)
        .eq('dnclistid', dnclistid)
        .maybeSingle();

      if (existingEntry) {
        return NextResponse.json(
          { error: 'This entry already exists in the selected list' },
          { status: 400 }
        );
      }

      const { data: newEntry, error } = await supabase
        .from('dnc_entries')
        .insert({
          value,
          valuetype: value_type,
          source,
          reason,
          dnclistid,
          createdat: new Date().toISOString(),
          expirydate
        })
        .select('*')
        .single();

      if (error) throw error;
      return NextResponse.json(newEntry, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('DNC API Error:', error);
    return NextResponse.json(
      { error: 'Failed to create DNC entry' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    const data = await request.json();
    const { type, id } = data;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    if (type === 'list') {
      const { name, description, listType, isActive } = data;
      const updateData: any = { updated_at: new Date().toISOString() };
      
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (listType) updateData.type = listType;
      if (isActive !== undefined) updateData.is_active = isActive;

      const { data: updatedList, error } = await supabase
        .from('dnc_lists')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(updatedList);
    }

    if (type === 'entry') {
      const { value, valueType, source, reason, expiryDate } = data;
      const updateData: any = {};
      
      if (value) updateData.value = value;
      if (valueType) updateData.value_type = valueType;
      if (source) updateData.source = source;
      if (reason !== undefined) updateData.reason = reason;
      if (expiryDate !== undefined) updateData.expiry_date = expiryDate;

      const { data: updatedEntry, error } = await supabase
        .from('dnc_entries')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(updatedEntry);
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    console.error('DNC API Error:', error);
    return NextResponse.json(
      { error: 'Failed to update DNC item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Type and ID are required' },
        { status: 400 }
      );
    }

    if (type === 'list') {
      // First, delete all entries in this list
      const { error: entriesError } = await supabase
        .from('dnc_entries')
        .delete()
        .eq('dnclistid', id);

      if (entriesError) throw entriesError;

      // Then delete the list
      const { error: listError } = await supabase
        .from('dnc_lists')
        .delete()
        .eq('id', id);

      if (listError) throw listError;

      return NextResponse.json({ success: true });
    }

    if (type === 'entry') {
      const { error } = await supabase
        .from('dnc_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('DNC API Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete DNC entry' },
      { status: 500 }
    );
  }
}
