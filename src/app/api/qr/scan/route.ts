import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Request body shape for QR scan
 */
type ScanRequest = {
  rawPayload: string; // full text from QR scanner
  size?: string; // optional, e.g. 'S', 'M', 'L'
  systemAcronym?: string; // optional, default "TMGS"
};

/**
 * Extract code ID from various QR payload formats:
 * 1. Plain code: A6F3HW7L
 * 2. URL path: https://app.example.com/s/B7G4JX9M
 * 3. URL query param: https://app.example.com?code=C8H5KY0N
 *
 * Returns null if no valid code ID can be extracted.
 */
function extractCodeId(raw: string): string | null {
  const trimmed = raw.trim();

  // Try to parse as URL first
  try {
    const url = new URL(trimmed);

    // 1) Check for ?code=XYZ query parameter
    const codeParam = url.searchParams.get('code');
    if (codeParam && isValidCodeId(codeParam)) {
      return codeParam.toUpperCase();
    }

    // 2) Check last path segment (e.g., /s/B7G4JX9M -> B7G4JX9M)
    const pathSegments = url.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      const lastSegment = pathSegments[pathSegments.length - 1];
      if (isValidCodeId(lastSegment)) {
        return lastSegment.toUpperCase();
      }
    }
  } catch {
    // Not a valid URL, continue to plain text check
  }

  // 3) Fallback: treat as plain code ID if it looks valid
  if (isValidCodeId(trimmed)) {
    return trimmed.toUpperCase();
  }

  return null;
}

/**
 * Check if a string looks like a valid code ID:
 * - 6-12 characters (alphanumeric)
 * - Only uppercase letters and numbers
 */
function isValidCodeId(str: string): boolean {
  const normalized = str.toUpperCase();
  return /^[A-Z0-9]{6,12}$/.test(normalized);
}

/**
 * POST /api/qr/scan
 *
 * Persists a QR code scan to the database.
 * Requires Clerk authentication.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate with Clerk
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - please sign in' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    let body: ScanRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // 3. Validate rawPayload exists
    if (!body.rawPayload || typeof body.rawPayload !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: rawPayload (string)'
        },
        { status: 400 }
      );
    }

    // 4. Extract code ID from payload
    const codeId = extractCodeId(body.rawPayload);
    if (!codeId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Could not extract valid code ID from payload. Expected formats: plain code (A6F3HW7L), URL path (/s/CODE), or URL query param (?code=CODE)'
        },
        { status: 400 }
      );
    }

    // 5. Prepare code attributes
    const systemAcronym = body.systemAcronym || 'TMGS';
    const size = body.size || 'unspecified';
    const year = new Date().getFullYear();

    // 6. Connect to Supabase with service role
    const supabase = createSupabaseServerClient();

    // 7. Upsert code record
    // Check if code already exists for this user
    const { data: existingCode, error: fetchError } = await supabase
      .from('codes')
      .select('*')
      .eq('id', codeId)
      .eq('owner_user_id', userId)
      .single();

    let codeRecord;

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = not found, which is fine
      console.error('Error fetching code:', fetchError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error while checking for existing code'
        },
        { status: 500 }
      );
    }

    if (existingCode) {
      // Code already exists for this user - reuse it
      codeRecord = existingCode;
    } else {
      // Code doesn't exist - insert new one
      const { data: newCode, error: insertError } = await supabase
        .from('codes')
        .insert({
          id: codeId,
          system_acronym: systemAcronym,
          size: size,
          year: year,
          owner_user_id: userId
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting code:', insertError);
        return NextResponse.json(
          {
            success: false,
            error: 'Database error while creating code record'
          },
          { status: 500 }
        );
      }

      codeRecord = newCode;
    }

    // 8. Insert scan event
    const { data: scanEvent, error: scanError } = await supabase
      .from('scan_events')
      .insert({
        code_id: codeId,
        scanned_by_user_id: userId,
        raw_payload: body.rawPayload
      })
      .select('id, scanned_at')
      .single();

    if (scanError) {
      console.error('Error inserting scan event:', scanError);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error while recording scan event'
        },
        { status: 500 }
      );
    }

    // 9. Return success response
    return NextResponse.json({
      success: true,
      code: {
        id: codeRecord.id,
        system_acronym: codeRecord.system_acronym,
        size: codeRecord.size,
        year: codeRecord.year
      },
      scanEvent: {
        id: scanEvent.id,
        scanned_at: scanEvent.scanned_at
      }
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/qr/scan:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
