import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { moderateReview } from '@/lib/moderation';

// Service role client for bypassing RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// POST - Create a new review
export async function POST(req: Request) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`🌟 [REVIEW-${requestId}] Starting review submission:`, {
    timestamp: new Date().toISOString(),
    url: req.url
  });

  try {
    const body = await req.json();
    const { facility_slug, rating, review_text, reviewer_name, user_id } = body;

    console.log(`📝 [REVIEW-${requestId}] Request data:`, {
      facility_slug,
      rating,
      textLength: review_text?.length || 0,
      hasReviewerName: !!reviewer_name,
      hasUserId: !!user_id,
      isAnonymous: !user_id
    });

    // Validation
    if (!facility_slug || typeof rating !== 'number' || rating < 0 || rating > 5) {
      console.error(`❌ [REVIEW-${requestId}] Validation failed - invalid fields:`, {
        facility_slug: !!facility_slug,
        rating: typeof rating,
        ratingValue: rating
      });
      return NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 }
      );
    }

    // If no user_id and no reviewer_name, reject
    if (!user_id && !reviewer_name) {
      console.error(`❌ [REVIEW-${requestId}] Validation failed - no user identification`);
      return NextResponse.json(
        { error: 'Either user authentication or reviewer name is required' },
        { status: 400 }
      );
    }

    // Moderate the review if there's text content
    let moderation_status = 'approved';
    let moderation_reason = 'No text content to moderate';

    if (review_text && review_text.trim()) {
      console.log(`🔍 [REVIEW-${requestId}] Starting moderation for text review`);
      const moderationResult = await moderateReview(review_text, rating, reviewer_name);
      moderation_status = moderationResult.approved ? 'approved' : 'rejected';
      moderation_reason = moderationResult.reason;
      console.log(`✅ [REVIEW-${requestId}] Moderation complete:`, {
        status: moderation_status,
        reason: moderation_reason,
        confidence: moderationResult.confidence
      });
    } else if (reviewer_name && reviewer_name.trim()) {
      console.log(`🔍 [REVIEW-${requestId}] Starting moderation for reviewer name only`);
      const moderationResult = await moderateReview('No review text provided', rating, reviewer_name);
      moderation_status = moderationResult.approved ? 'approved' : 'rejected';
      moderation_reason = moderationResult.reason;
      console.log(`✅ [REVIEW-${requestId}] Name moderation complete:`, {
        status: moderation_status,
        reason: moderation_reason,
        confidence: moderationResult.confidence
      });
    } else {
      console.log(`ℹ️ [REVIEW-${requestId}] No text content or name, skipping moderation`);
    }

    // Insert the review
    console.log(`💾 [REVIEW-${requestId}] Inserting review into database`);
    const { data, error } = await supabase
      .from('facility_reviews')
      .insert({
        facility_slug,
        user_id: user_id || null,
        rating,
        review_text: review_text || null,
        reviewer_name: reviewer_name || null,
        moderation_status,
        moderation_reason,
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ [REVIEW-${requestId}] Database error:`, {
        error: error.message,
        code: error.code,
        details: error.details
      });
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }

    console.log(`✅ [REVIEW-${requestId}] Review created successfully:`, {
      reviewId: data.id,
      status: moderation_status,
      facility: facility_slug
    });

    return NextResponse.json({
      success: true,
      review: data,
      moderated: moderation_status === 'approved'
    });

  } catch (error) {
    console.error(`❌ [REVIEW-${requestId}] Unexpected error:`, {
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