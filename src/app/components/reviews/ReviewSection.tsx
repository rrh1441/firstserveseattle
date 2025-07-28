'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import TennisBallRating from './TennisBallRating';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';

interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
    0: number;
  };
}

interface ReviewSectionProps {
  facilitySlug: string;
  facilityName: string;
  userId?: string | null;
}

export default function ReviewSection({ 
  facilitySlug, 
  facilityName, 
  userId 
}: ReviewSectionProps) {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const response = await fetch(`/api/reviews/stats/${facilitySlug}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching review stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [facilitySlug]);

  useEffect(() => {
    fetchStats();
  }, [facilitySlug, refreshTrigger, fetchStats]);

  const handleReviewSubmitted = () => {
    setRefreshTrigger(prev => prev + 1);
    fetchStats();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-slate-900">Reviews</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0c372b] text-white rounded-lg hover:bg-[#0a2e21] transition-colors font-semibold"
        >
          <Plus className="w-4 h-4" />
          Write Review
        </button>
      </div>

      {/* Stats Summary */}
      {loadingStats ? (
        <div className="animate-pulse mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-6 h-6 bg-slate-200 rounded"></div>
              ))}
            </div>
            <div className="h-6 bg-slate-200 rounded w-32"></div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-8 h-4 bg-slate-200 rounded"></div>
                <div className="h-4 bg-slate-200 rounded flex-1 max-w-32"></div>
                <div className="w-8 h-4 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ) : stats && stats.total_reviews > 0 ? (
        <div className="mb-8 pb-8 border-b border-slate-200">
          <div className="flex items-center gap-4 mb-6">
            <TennisBallRating rating={Math.round(stats.average_rating)} size="lg" />
            <div>
              <div className="text-3xl font-bold text-slate-900">
                {stats.average_rating.toFixed(1)}
              </div>
              <div className="text-sm text-slate-600">
                {stats.total_reviews} review{stats.total_reviews !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => {
              const rating = 5 - i;
              const count = stats.rating_distribution[rating as keyof typeof stats.rating_distribution];
              const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center gap-3 text-sm">
                  <span className="text-slate-600 w-3">
                    {rating}
                  </span>
                  <span className="text-lg">🎾</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden max-w-32">
                    <div
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-slate-600 w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-8 pb-8 border-b border-slate-200">
          <div className="text-center py-6">
            <div className="text-6xl mb-4">🎾</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No reviews yet
            </h3>
            <p className="text-slate-600">
              Be the first to review {facilityName}!
            </p>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <ReviewList 
        facilitySlug={facilitySlug}
        refreshTrigger={refreshTrigger}
      />

      {/* Review Form Modal */}
      {showForm && (
        <ReviewForm
          facilitySlug={facilitySlug}
          facilityName={facilityName}
          userId={userId}
          onClose={() => setShowForm(false)}
          onSubmitSuccess={handleReviewSubmitted}
        />
      )}
    </div>
  );
}