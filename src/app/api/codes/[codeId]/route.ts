import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/codes/:codeId
 *
 * Public endpoint to lookup code information.
 * No authentication required - customers can scan QR codes and see basic info.
 *
 * Returns only non-sensitive data: TMGS, Size, Year, ID
 * Does NOT expose owner information or internal IDs.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { codeId: string } }
) {
  try {
    const { codeId } = params;

    // Validate code ID format
    if (!codeId || typeof codeId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid code ID' },
        { status: 400 }
      );
    }

    // Connect to Supabase
    const supabase = createSupabaseServerClient();

    // Look up the code (no user filter - public lookup)
    const { data: code, error } = await supabase
      .from('codes')
      .select('id, system_acronym, size, year, created_at')
      .eq('id', codeId.toUpperCase())
      .single();

    if (error || !code) {
      return NextResponse.json(
        { error: 'Code not found' },
        { status: 404 }
      );
    }

    // Return only public, non-sensitive information
    return NextResponse.json({
      id: code.id,
      system: code.system_acronym,
      size: code.size,
      year: code.year,
      created: code.created_at
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/codes/:codeId:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
