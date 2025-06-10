import { NextResponse } from 'next/server';
import { Client } from '@/types/client';
import { parse } from 'csv-parse/sync';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read the file content
    const buffer = await file.arrayBuffer();
    const content = new TextDecoder().decode(buffer);

    // Parse CSV
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Validate and transform records
    const clients = records.map((record: any) => ({
      name: record.name,
      email: record.email,
      phone: record.phone || null,
      contactperson: record.contact_person || record.contactperson || null,
      deliveryformat: record.delivery_format || record.deliveryformat || null,
      deliveryschedule: record.delivery_schedule || record.deliveryschedule || null,
      percentallocation: record.percent_allocation || record.percentallocation ? 
        Number(record.percent_allocation || record.percentallocation) : null,
      fixedallocation: record.fixed_allocation || record.fixedallocation ? 
        Number(record.fixed_allocation || record.fixedallocation) : null,
      exclusivitysettings: record.exclusivity_settings || record.exclusivitysettings || {},
      isactive: record.is_active !== 'false',
    }));

    // Save clients to the database
    const response = await fetch(`${API_URL}/api/clients/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clients),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to save clients');
    }

    const result = await response.json();
    
    return NextResponse.json({
      count: result.length,
      message: 'Clients imported successfully',
    });
  } catch (error) {
    console.error('Error uploading CSV:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process CSV file' },
      { status: 500 }
    );
  }
}
