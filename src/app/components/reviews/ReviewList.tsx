'use client';

import { useState, useEffect, useCallback } from 'react';
import TennisBallRating from './TennisBallRating';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  reviewer_name: string | null;
  created_at: string;
}

interface ReviewListProps {
  facilitySlug: string;
  refreshTrigger?: number;
}

export default function ReviewList({ facilitySlug, refreshTrigger }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    hasNext: false,
    total: 0
  });

  const fetchReviews = useCallback(async (page = 1, append = false) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      
      const response = await fetch(`/api/reviews/${facilitySlug}?page=${page}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      
      if (append) {
        setReviews(prev => [...prev, ...data.reviews]);
      } else {
        setReviews(data.reviews);
      }
      
      setPagination({
        page: data.pagination.page,
        hasNext: data.pagination.hasNext,
        total: data.pagination.total
      });
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [facilitySlug]);

  useEffect(() => {
    fetchReviews(1, false);
  }, [facilitySlug, refreshTrigger, fetchReviews]);

  const loadMore = () => {
    if (pagination.hasNext && !loadingMore) {
      fetchReviews(pagination.page + 1, true);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="w-6 h-6 bg-slate-200 rounded"></div>
                ))}
              </div>
              <div className="h-4 bg-slate-200 rounded w-24"></div>
            </div>
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600 mb-4">{error}</p>
        <button
          onClick={() => fetchReviews(1, false)}
          className="px-4 py-2 bg-[#0c372b] text-white rounded hover:bg-[#0a2e21] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600">No reviews yet. Be the first to review this facility!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="border-b border-slate-200 pb-6 last:border-b-0 last:pb-0"
        >
          {/* Rating and Date */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <TennisBallRating rating={review.rating} size="sm" />
              <span className="text-sm font-medium text-slate-900">
                {review.reviewer_name || 'Anonymous'}
              </span>
            </div>
            <span className="text-sm text-slate-500">
              {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Review Text */}
          {review.review_text && (
            <p className="text-slate-700 leading-relaxed">
              {review.review_text}
            </p>
          )}
        </div>
      ))}

      {/* Load More Button */}
      {pagination.hasNext && (
        <div className="text-center pt-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingMore ? 'Loading...' : 'Load More Reviews'}
          </button>
        </div>
      )}

      {/* Review Count */}
      {pagination.total > 0 && (
        <p className="text-center text-sm text-slate-500 pt-4">
          Showing {reviews.length} of {pagination.total} review{pagination.total !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}