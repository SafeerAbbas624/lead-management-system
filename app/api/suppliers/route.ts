import { NextResponse } from 'next/server';
import { supplierApi } from '@/lib/supabase/api-client';

// GET /api/suppliers - Get all suppliers with metrics
export async function GET() {
  try {
    // Get all suppliers with their metrics
    const suppliers = await supplierApi.getAll();
    const suppliersWithMetrics = await Promise.all(
      suppliers.map(async (supplier) => {
        const metrics = await supplierApi.getMetrics(supplier.id);
        return {
          ...supplier,
          ...metrics
        };
      })
    );
    
    return NextResponse.json(suppliersWithMetrics);
  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch suppliers',
        details: error.details
      },
      { status: error.status || 500 }
    );
  }
}

// POST /api/suppliers - Create a new supplier
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    // Create the supplier
    const supplier = await supplierApi.create({
      name: body.name,
      email: body.email,
      contact_person: body.contact_person,
      lead_cost: body.lead_cost,
      status: body.status
    });
    
    return NextResponse.json(supplier, { status: 201 });
  } catch (error: any) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create supplier',
        details: error.details
      },
      { status: error.status || 500 }
    );
  }
}
