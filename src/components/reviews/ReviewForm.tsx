'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import TennisBallRating from './TennisBallRating';
import { X } from 'lucide-react';

interface ReviewFormProps {
  facilitySlug: string;
  facilityName: string;
  onClose: () => void;
  onSubmitSuccess: () => void;
  userId?: string | null;
}

export default function ReviewForm({
  facilitySlug,
  facilityName,
  onClose,
  onSubmitSuccess,
  userId
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!userId && !reviewerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          facility_slug: facilitySlug,
          rating,
          review_text: reviewText.trim() || null,
          reviewer_name: !userId ? reviewerName.trim() : null,
          reviewer_email: !userId ? reviewerEmail.trim() || null : null,
          user_id: userId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit review');
      }

      const result = await response.json();
      
      if (result.moderated) {
        toast.success('Review submitted successfully!');
      } else {
        toast.success('Review submitted for moderation. It will appear once approved.');
      }

      onSubmitSuccess();
      onClose();
    } catch (error) {
      console.error('Review submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Review {facilityName}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <TennisBallRating
                  rating={rating}
                  interactive
                  onRatingChange={setRating}
                  size="lg"
                />
                {rating > 0 && (
                  <span className="text-sm text-slate-600">
                    {rating} tennis ball{rating !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Review Text */}
            <div>
              <label 
                htmlFor="review-text" 
                className="block text-sm font-semibold text-slate-900 mb-2"
              >
                Review (optional)
              </label>
              <textarea
                id="review-text"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience with this tennis facility..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c372b] focus:border-transparent resize-none"
                rows={4}
                maxLength={500}
                disabled={isSubmitting}
              />
              <div className="text-right text-sm text-slate-500 mt-1">
                {reviewText.length}/500
              </div>
            </div>

            {/* Anonymous user fields */}
            {!userId && (
              <>
                <div>
                  <label 
                    htmlFor="reviewer-name" 
                    className="block text-sm font-semibold text-slate-900 mb-2"
                  >
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="reviewer-name"
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c372b] focus:border-transparent"
                    maxLength={100}
                    required={!userId}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label 
                    htmlFor="reviewer-email" 
                    className="block text-sm font-semibold text-slate-900 mb-2"
                  >
                    Email (optional)
                  </label>
                  <input
                    id="reviewer-email"
                    type="email"
                    value={reviewerEmail}
                    onChange={(e) => setReviewerEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c372b] focus:border-transparent"
                    maxLength={255}
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    We won't share your email or use it for marketing
                  </p>
                </div>
              </>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-[#0c372b] text-white rounded-lg hover:bg-[#0a2e21] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}