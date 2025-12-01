import { extractCodeId } from '@/lib/qr';
import { getSupabaseClient } from '@/lib/supabaseClient';
import type { CodeRecord, ScanEventWithCode } from '@/lib/supabaseClient';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/scan-events
 *
 * Records a new QR code scan event.
 *
 * Request body:
 * {
 *   rawPayload: string  // The raw text from the QR scanner
 * }
 *
 * Response:
 * {
 *   code: CodeRecord,
 *   scanEvent: { id, code_id, scanned_at }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { rawPayload } = body;

    if (!rawPayload || typeof rawPayload !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid rawPayload' },
        { status: 400 }
      );
    }

    // Extract code ID from the payload
    let codeId: string;
    try {
      codeId = extractCodeId(rawPayload);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : 'Invalid QR code format'
        },
        { status: 400 }
      );
    }

    // Get current year
    const currentYear = new Date().getFullYear();

    // Get server-side Supabase client
    const supabase = getSupabaseClient();

    // Upsert code record
    // First, try to fetch existing code
    const { data: existingCode, error: fetchError } = await supabase
      .from('codes')
      .select('*')
      .eq('id', codeId)
      .single();

    let codeRecord: CodeRecord;

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = not found, which is okay
      console.error('Error fetching code:', fetchError);
      return NextResponse.json(
        { error: 'Database error while fetching code' },
        { status: 500 }
      );
    }

    if (existingCode) {
      // Code already exists - just use it
      codeRecord = existingCode as CodeRecord;
    } else {
      // Code doesn't exist - create new one
      const { data: newCode, error: insertError } = await supabase
        .from('codes')
        .insert({
          id: codeId,
          system_acronym: 'TMGS',
          size: 'unspecified',
          year: currentYear,
          owner_user_id: userId
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting code:', insertError);
        return NextResponse.json(
          { error: 'Database error while creating code' },
          { status: 500 }
        );
      }

      codeRecord = newCode as CodeRecord;
    }

    // Insert scan event
    const { data: scanEvent, error: scanError } = await supabase
      .from('scan_events')
      .insert({
        code_id: codeId,
        scanned_by_user_id: userId,
        raw_payload: rawPayload
      })
      .select('id, code_id, scanned_at')
      .single();

    if (scanError) {
      console.error('Error inserting scan event:', scanError);
      return NextResponse.json(
        { error: 'Database error while recording scan' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      code: {
        id: codeRecord.id,
        system_acronym: codeRecord.system_acronym,
        size: codeRecord.size,
        year: codeRecord.year
      },
      scanEvent: {
        id: scanEvent.id,
        code_id: scanEvent.code_id,
        scanned_at: scanEvent.scanned_at
      }
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/scan-events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scan-events
 *
 * Retrieves recent scan events for the authenticated user.
 *
 * Response:
 * [
 *   {
 *     id: string,
 *     code_id: string,
 *     scanned_at: string,
 *     raw_payload: string,
 *     code: {
 *       id: string,
 *       system_acronym: string,
 *       size: string,
 *       year: number
 *     }
 *   },
 *   ...
 * ]
 */
export async function GET() {
  try {
    // Authenticate user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get server-side Supabase client
    const supabase = getSupabaseClient();

    // Fetch scan events with joined code data
    // We manually filter by userId since we're using the service role key
    const { data: scanEvents, error } = await supabase
      .from('scan_events')
      .select(
        `
        id,
        code_id,
        scanned_at,
        raw_payload,
        codes (
          id,
          system_acronym,
          size,
          year
        )
      `
      )
      .eq('scanned_by_user_id', userId)
      .order('scanned_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching scan events:', error);
      return NextResponse.json(
        { error: 'Database error while fetching scan events' },
        { status: 500 }
      );
    }

    // Transform the response to match our interface
    const transformedEvents: ScanEventWithCode[] = (scanEvents || []).map(
      (event: any) => ({
        id: event.id,
        code_id: event.code_id,
        scanned_at: event.scanned_at,
        raw_payload: event.raw_payload,
        scanned_by_user_id: userId,
        code: event.codes
          ? {
              id: event.codes.id,
              system_acronym: event.codes.system_acronym,
              size: event.codes.size,
              year: event.codes.year,
              owner_user_id: userId,
              created_at: event.codes.created_at || event.scanned_at
            }
          : undefined
      })
    );

    return NextResponse.json(transformedEvents);
  } catch (error) {
    console.error('Unexpected error in GET /api/scan-events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
