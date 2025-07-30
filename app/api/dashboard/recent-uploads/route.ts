import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Define types for better type safety
type UploadBatch = {
  id: number;
  filename: string;
  status: string;
  totalleads: number;
  cleanedleads: number;
  duplicateleads: number;
  dncmatches: number;
  createdat: string;
  processingprogress: number;
  errormessage: string | null;
  sourcename?: string;
  supplierid?: number;
  supplier?: {
    name: string;
    email: string;
  } | null;
};

type FormattedUploadBatch = {
  id: number;
  filename: string;
  status: string;
  totalLeads: number;
  cleanedLeads: number;
  duplicateLeads: number;
  dncMatches: number;
  createdAt: string;
  processingProgress: number;
  errorMessage: string;
  sourceName: string;
  supplierName: string;
  supplierEmail: string;
  successRate: number;
  timeAgo: string;
};

// Helper function to format time ago
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };
  
  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }
  
  return 'just now';
};

export async function GET(request: Request) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const status = searchParams.get('status');

    // First, fetch the upload batches
    let query = supabase
      .from('upload_batches')
      .select('*')
      .order('createdat', { ascending: false })
      .limit(limit);

    // Add status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Execute the query
    const { data: batches, error } = await query;

    console.log('Recent uploads query result:', { batches, error, count: batches?.length });

    if (error) {
      console.error('Error fetching recent uploads:', error);
      throw error;
    }

    // If no batches found, return empty array
    if (!batches || batches.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit,
          hasMore: false
        }
      });
    }

    // Format the response
    const formattedBatches: FormattedUploadBatch[] = await Promise.all(batches.map(async (batch: any) => {
      // Initialize supplier data with defaults
      let supplierName = 'N/A';
      let supplierEmail = 'N/A';

      // Only try to fetch supplier data if supplierid exists and is a valid number
      const supplierId = batch.supplierid;
      if (supplierId && !isNaN(Number(supplierId))) {
        try {
          const { data: supplierData, error: supplierError } = await supabase
            .from('suppliers')
            .select('name, email')
            .eq('id', supplierId)
            .maybeSingle();

          if (!supplierError && supplierData) {
            supplierName = supplierData.name || 'N/A';
            supplierEmail = supplierData.email || 'N/A';
          } else if (supplierError) {
            console.error('Error fetching supplier:', supplierError);
          }
        } catch (e) {
          console.error('Error in supplier fetch:', e);
        }
      }

      const transformed = {
        id: batch.id,
        filename: batch.filename,
        status: batch.status,
        totalLeads: batch.totalleads || 0,
        cleanedLeads: batch.cleanedleads || 0,
        duplicateLeads: batch.duplicateleads || 0,
        dncMatches: batch.dncmatches || 0,
        createdAt: batch.createdat,
        processingProgress: batch.processingprogress || 0,
        errorMessage: batch.errormessage || '',
        sourceName: batch.sourcename || 'N/A',
        supplierName,
        supplierEmail,
        totalBuyingPrice: batch.total_buying_price || 0,
        buyingPricePerLead: batch.buying_price_per_lead || 0,
        successRate: batch.totalleads ? Math.round(((batch.cleanedleads || 0) / batch.totalleads) * 100) : 0,
        timeAgo: formatTimeAgo(batch.createdat)
      };

      console.log('Transformed batch:', transformed);
      return transformed;
    }));

    const response = {
      success: true,
      data: formattedBatches,
      pagination: {
        total: formattedBatches.length,
        limit,
        hasMore: formattedBatches.length === limit
      }
    };

    console.log('Final API response:', JSON.stringify(response, null, 2));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in recent-uploads endpoint:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch recent uploads',
        details: error instanceof Error ? error.message : 'Unknown error',
        data: []
      },
      { status: 500 }
    );
  }
}
