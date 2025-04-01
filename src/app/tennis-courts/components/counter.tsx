// src/app/tennis-courts/components/counter.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
// Removed Eye import

const ViewsCounter = ({ viewsCount }: { viewsCount: number }) => {
  const maxViews = 3; // Total free views allowed

  // Map numbers to ordinal words
  const ordinalMap: { [key: number]: string } = {
    1: 'First',
    2: 'Second',
    3: 'Third'
  };

  // Calculate the current view number (1-based index)
  const currentViewNumber = Math.min(viewsCount + 1, maxViews);

  // Calculate remaining views *after* this one
  const remainingViews = Math.max(0, maxViews - currentViewNumber);

  // Get the ordinal word for the current view
  const currentViewOrdinal = ordinalMap[currentViewNumber] || `${currentViewNumber}th`;

  // Construct the display text with "Court Check"
  let displayText = "";
  if (viewsCount < maxViews) {
      // --- UPDATED WORDING ---
      displayText = `${currentViewOrdinal} Free Court Check - ${remainingViews} Remaining`;
      // --- END UPDATE ---
  } else {
      // --- FIX APOSTROPHE HERE ---
      displayText = `You&apos;ve used all ${maxViews} free checks`; // Replaced ' with &apos;
  }


  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardContent className="pt-4 pb-4 md:pt-6 md:pb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            {/* --- REPLACED ICON --- */}
            {/* Using text-xl or text-lg for emoji size control, adjust leading if needed */}
            <span className="text-xl leading-none" role="img" aria-label="Tennis ball icon">🎾</span>
            {/* --- END ICON REPLACEMENT --- */}
            {/* Updated Display Text */}
            <span className="text-sm font-medium text-blue-800 text-center sm:text-left">
              {displayText}
            </span>
          </div>
          {/* Button remains the same */}
          <Button asChild size="sm" className="bg-[#0c372b] hover:bg-[#0c372b]/90 text-white whitespace-nowrap w-full sm:w-auto">
            <a href="/signup">
              Get Unlimited Checks
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ViewsCounter;