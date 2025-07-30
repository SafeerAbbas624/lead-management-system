import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DuplicateMatch {
  leadIndex: number
  leadData: any
  duplicateType: 'file_internal' | 'database_existing'
  duplicateReason: string
  duplicateFields: string[]
  originalLeadId?: number
  matchedData?: any
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid data format. Expected array of objects.');
    }
    const duplicates: DuplicateMatch[] = [];
    const cleanData: any[] = [];
    const seenEmails = new Map<string, number>();
    const seenPhones = new Map<string, number>();

    // Step 1: Check for duplicates within the file itself
    data.forEach((lead, index) => {
      let isDuplicate = false;
      const duplicateFields: string[] = [];
      let duplicateReason = '';

      // Check email duplicates within file
      if (lead.email && lead.email.trim()) {
        const normalizedEmail = lead.email.toLowerCase().trim();
        if (seenEmails.has(normalizedEmail)) {
          isDuplicate = true;
          duplicateFields.push('email');
          duplicateReason = `Duplicate email found at row ${seenEmails.get(normalizedEmail)! + 1}`;
        } else {
          seenEmails.set(normalizedEmail, index);
        }
      }

      // Check phone duplicates within file
      if (lead.phone && lead.phone.trim()) {
        const normalizedPhone = lead.phone.replace(/\D/g, '');
        if (normalizedPhone.length >= 10) {
          if (seenPhones.has(normalizedPhone)) {
            isDuplicate = true;
            duplicateFields.push('phone');
            if (duplicateReason) {
              duplicateReason += ` and duplicate phone found at row ${seenPhones.get(normalizedPhone)! + 1}`;
            } else {
              duplicateReason = `Duplicate phone found at row ${seenPhones.get(normalizedPhone)! + 1}`;
            }
          } else {
            seenPhones.set(normalizedPhone, index);
          }
        }
      }

      if (isDuplicate) {
        duplicates.push({
          leadIndex: index,
          leadData: lead,
          duplicateType: 'file_internal',
          duplicateReason,
          duplicateFields,
        });
      }
    });

    // Step 2: Check remaining leads against database
    const nonDuplicateLeads = data.filter((_, index) =>
      !duplicates.some(dup => dup.leadIndex === index)
    );

    for (let i = 0; i < nonDuplicateLeads.length; i++) {
      const lead = nonDuplicateLeads[i];
      const originalIndex = data.indexOf(lead);
      let isDatabaseDuplicate = false;
      const duplicateFields: string[] = [];
      let duplicateReason = '';
      let matchedLead = null;

      // Check email against database
      if (lead.email && lead.email.trim()) {
        const { data: existingLeads, error } = await supabase
          .from('leads')
          .select('id, email, firstname, lastname, phone, companyname, createdat')
          .eq('email', lead.email.toLowerCase().trim())
          .limit(1);

        if (error) {
          console.error('Error checking email duplicates:', error);
        } else if (existingLeads && existingLeads.length > 0) {
          isDatabaseDuplicate = true;
          duplicateFields.push('email');
          duplicateReason = `Email already exists in database (Lead ID: ${existingLeads[0].id})`;
          matchedLead = existingLeads[0];
        }
      }

      if (isDatabaseDuplicate) {
        duplicates.push({
          leadIndex: originalIndex,
          leadData: lead,
          duplicateType: 'database_existing',
          duplicateReason,
          duplicateFields,
          originalLeadId: matchedLead?.id,
          matchedData: matchedLead,
        });
      } else {
        cleanData.push(lead);
      }
    }

    // Calculate statistics
    const stats = {
      totalLeads: data.length,
      duplicateCount: duplicates.length,
      cleanLeads: cleanData.length,
      fileInternalDuplicates: duplicates.filter(d => d.duplicateType === 'file_internal').length,
      databaseDuplicates: duplicates.filter(d => d.duplicateType === 'database_existing').length,
      emailDuplicates: duplicates.filter(d => d.duplicateFields.includes('email')).length,
      phoneDuplicates: duplicates.filter(d => d.duplicateFields.includes('phone')).length,
    };

    return NextResponse.json({
      success: true,
      duplicateCount: duplicates.length,
      duplicates: duplicates.map(dup => ({
        ...dup.leadData,
        duplicateInfo: {
          type: dup.duplicateType,
          reason: dup.duplicateReason,
          fields: dup.duplicateFields,
          originalLeadId: dup.originalLeadId,
          matchedData: dup.matchedData,
        }
      })),
      cleanData,
      stats,
    });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check duplicates',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
