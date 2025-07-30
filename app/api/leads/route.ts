import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get pagination parameters with higher limits
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 10000); // Allow up to 10,000 results
    const offset = (page - 1) * limit;
    
    // Get filter parameters
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const source = searchParams.get('source') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const tagsParam = searchParams.get('tags') || '';
    const tags = tagsParam ? tagsParam.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
    
    // Build query with explicit limit to override Supabase default 1000 row limit
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('createdat', { ascending: false });

    // Only apply range for reasonable page sizes, otherwise get all and paginate manually
    if (limit <= 1000) {
      query = query.range(offset, offset + limit - 1);
    } else {
      // For large limits, get all data and paginate manually
      query = query.limit(Math.min(limit + offset, 50000)); // Cap at 50k for safety
    }
    
    // Apply comprehensive search filters across all relevant columns including tags
    if (search) {
      const searchTerm = search.trim();

      // First, try to find leads that match the search term in regular fields
      let searchQuery = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .or(`
          firstname.ilike.%${searchTerm}%,
          lastname.ilike.%${searchTerm}%,
          email.ilike.%${searchTerm}%,
          phone.ilike.%${searchTerm}%,
          companyname.ilike.%${searchTerm}%,
          taxid.ilike.%${searchTerm}%,
          address.ilike.%${searchTerm}%,
          city.ilike.%${searchTerm}%,
          state.ilike.%${searchTerm}%,
          zipcode.ilike.%${searchTerm}%,
          country.ilike.%${searchTerm}%,
          leadsource.ilike.%${searchTerm}%,
          leadstatus.ilike.%${searchTerm}%,
          exclusivitynotes.ilike.%${searchTerm}%
        `.replace(/\s+/g, ''));

      // Also search for leads that have the search term in their tags
      let tagsQuery = supabase
        .from('leads')
        .select('*', { count: 'exact' })
        .contains('tags', [searchTerm]);

      // Execute both queries
      const [regularResults, tagsResults] = await Promise.all([
        searchQuery,
        tagsQuery
      ]);

      // Combine results and remove duplicates
      const allLeads = [...(regularResults.data || []), ...(tagsResults.data || [])];
      const uniqueLeads = allLeads.filter((lead, index, self) =>
        index === self.findIndex(l => l.id === lead.id)
      );

      // Apply other filters to the combined results
      let filteredLeads = uniqueLeads;

      if (status) {
        filteredLeads = filteredLeads.filter(lead => lead.leadstatus === status);
      }
      if (source) {
        filteredLeads = filteredLeads.filter(lead => lead.leadsource === source);
      }
      if (startDate) {
        filteredLeads = filteredLeads.filter(lead => new Date(lead.createdat) >= new Date(startDate));
      }
      if (endDate) {
        filteredLeads = filteredLeads.filter(lead => new Date(lead.createdat) <= new Date(endDate));
      }
      if (tags.length > 0) {
        filteredLeads = filteredLeads.filter(lead =>
          lead.tags && tags.some(tag => lead.tags.includes(tag))
        );
      }

      // Apply pagination to filtered results
      const total = filteredLeads.length;
      const paginatedLeads = filteredLeads.slice(offset, offset + limit);

      return NextResponse.json({
        leads: paginatedLeads,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    }
    
    if (status) {
      query = query.eq('leadstatus', status);
    }
    
    if (source) {
      query = query.eq('leadsource', source);
    }
    
    if (startDate) {
      query = query.gte('createdat', startDate);
    }
    
    if (endDate) {
      query = query.lte('createdat', endDate);
    }

    // Filter by tags if provided
    if (tags.length > 0) {
      // Use overlaps operator to check if any of the provided tags exist in the tags array
      query = query.overlaps('tags', tags);
    }
    
    const { data: leads, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Handle manual pagination for large limits
    let finalLeads = leads || [];
    if (limit > 1000 && finalLeads.length > 0) {
      // Apply manual pagination
      finalLeads = finalLeads.slice(offset, offset + limit);
    }

    return NextResponse.json({
      leads: finalLeads,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Add timestamp if not provided
    if (!body.createdat) {
      body.createdat = new Date().toISOString();
    }
    
    const { data: lead, error } = await supabase
      .from('leads')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create lead',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    // Add update timestamp
    updateData.updatedat = new Date().toISOString();
    
    const { data: lead, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update lead',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }
    
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete lead',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
