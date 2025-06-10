import { NextResponse } from 'next/server';
import { Client } from '@/types/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const is_active = searchParams.get('is_active');
  const skip = searchParams.get('skip') || '0';
  const limit = searchParams.get('limit') || '10';
  const sort_by = searchParams.get('sort_by') || 'createdat';
  const sort_order = searchParams.get('sort_order') || 'desc';

  try {
    const params = new URLSearchParams({
      search,
      skip,
      limit,
      sort_by,
      sort_order,
      ...(is_active !== null && { is_active }),
    });

    const response = await fetch(`${API_URL}/api/clients/?${params.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch clients');
    }

    const data = await response.json();
    // Return the data as is since the backend now returns an array directly
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Forward the request directly to the backend without modification
    const response = await fetch(`${API_URL}/api/clients/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(await request.json()),
    });
    
    // Log the response status
    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Backend error:', error);
      throw new Error(error.detail || error.message || 'Failed to create client');
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create client' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_URL}/api/clients/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(await request.json()),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Backend error:', error);
      throw new Error(error.detail || error.message || 'Failed to update client');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update client' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_URL}/api/clients/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Backend error:', error);
      throw new Error(error.detail || error.message || 'Failed to delete client');
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete client' },
      { status: 500 }
    );
  }
}
