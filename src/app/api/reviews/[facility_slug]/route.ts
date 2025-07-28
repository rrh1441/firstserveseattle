import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role client for bypassing RLS when needed
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type Params = Promise<{ facility_slug: string }>;

// GET - Fetch reviews for a facility
export async function GET(
  req: Request,
  { params }: { params: Params }
) {
  const requestId = Math.random().toString(36).substring(7);
  try {
    const { facility_slug } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    console.log(`📖 [REVIEWS-${requestId}] Fetching reviews:`, {
      facility_slug,
      page,
      limit,
      offset,
      timestamp: new Date().toISOString()
    });

    // Get approved reviews only
    const { data: reviews, error } = await supabase
      .from('facility_reviews')
      .select('*')
      .eq('facility_slug', facility_slug)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(`❌ [REVIEWS-${requestId}] Database error fetching reviews:`, {
        error: error.message,
        code: error.code,
        facility_slug
      });
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    console.log(`✅ [REVIEWS-${requestId}] Reviews fetched:`, {
      count: reviews?.length || 0,
      facility_slug
    });

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('facility_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('facility_slug', facility_slug)
      .eq('moderation_status', 'approved');

    if (countError) {
      console.error(`❌ [REVIEWS-${requestId}] Database error counting reviews:`, {
        error: countError.message,
        code: countError.code,
        facility_slug
      });
      return NextResponse.json(
        { error: 'Failed to count reviews' },
        { status: 500 }
      );
    }

    console.log(`📊 [REVIEWS-${requestId}] Pagination info:`, {
      total: count,
      page,
      limit,
      facility_slug
    });

    return NextResponse.json({
      reviews: reviews || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error(`❌ [REVIEWS-${requestId}] Unexpected error:`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}