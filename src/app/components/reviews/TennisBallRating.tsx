'use client';

import { cn } from '@/lib/utils';

interface TennisBallRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export default function TennisBallRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  className
}: TennisBallRatingProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const handleClick = (newRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(newRating);
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: maxRating }, (_, index) => {
        const ballNumber = index + 1;
        const isFilled = ballNumber <= rating;
        
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(ballNumber)}
            disabled={!interactive}
            className={cn(
              sizeClasses[size],
              interactive && 'hover:scale-110 transition-transform cursor-pointer',
              !interactive && 'cursor-default'
            )}
            title={interactive ? `Rate ${ballNumber} tennis ball${ballNumber !== 1 ? 's' : ''}` : undefined}
          >
            <span
              className={cn(
                'transition-all duration-200',
                isFilled ? 'opacity-100' : 'opacity-30'
              )}
            >
              🎾
            </span>
          </button>
        );
      })}
    </div>
  );
}