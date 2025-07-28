import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role client for bypassing RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type Params = Promise<{ facility_slug: string }>;

// GET - Fetch review statistics for a facility
export async function GET(
  req: Request,
  { params }: { params: Params }
) {
  const requestId = Math.random().toString(36).substring(7);
  try {
    const { facility_slug } = await params;

    console.log(`📊 [STATS-${requestId}] Fetching review stats:`, {
      facility_slug,
      timestamp: new Date().toISOString()
    });

    // Get all approved reviews for this facility
    const { data: reviews, error } = await supabase
      .from('facility_reviews')
      .select('rating')
      .eq('facility_slug', facility_slug)
      .eq('moderation_status', 'approved');

    if (error) {
      console.error(`❌ [STATS-${requestId}] Database error fetching review stats:`, {
        error: error.message,
        code: error.code,
        facility_slug
      });
      return NextResponse.json(
        { error: 'Failed to fetch review statistics' },
        { status: 500 }
      );
    }

    if (!reviews || reviews.length === 0) {
      console.log(`ℹ️ [STATS-${requestId}] No reviews found for facility:`, facility_slug);
      return NextResponse.json({
        average_rating: 0,
        total_reviews: 0,
        rating_distribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
          0: 0
        }
      });
    }

    // Calculate statistics
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((totalRating / totalReviews) * 10) / 10; // Round to 1 decimal

    // Calculate rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });

    console.log(`✅ [STATS-${requestId}] Stats calculated:`, {
      facility_slug,
      totalReviews,
      averageRating,
      distribution
    });

    return NextResponse.json({
      average_rating: averageRating,
      total_reviews: totalReviews,
      rating_distribution: distribution
    });

  } catch (error) {
    console.error(`❌ [STATS-${requestId}] Unexpected error:`, {
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