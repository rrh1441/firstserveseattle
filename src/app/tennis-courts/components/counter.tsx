// src/app/tennis-courts/components/counter.tsx
import React from 'react';
import { Button } from '@/components/ui/button'; // Adjust path if needed
import { Card, CardContent } from '@/components/ui/card'; // Adjust path if needed

const ViewsCounter = ({ viewsCount }: { viewsCount: number }) => {
  const maxViews = 3; // Total free views allowed

  // Map numbers to ordinal words
  const ordinalMap: { [key: number]: string } = {
    1: 'First',
    2: 'Second',
    3: 'Third'
  };

  // Calculate the current view number (1-based index)
  // Add 1 because viewsCount is 0-based (0 means first view, 1 means second, etc.)
  const currentViewNumber = Math.min(viewsCount + 1, maxViews + 1); // +1 to handle reaching the limit correctly

  // Calculate remaining views *after* this one
  // If currentViewNumber is 4 (meaning viewsCount was 3), remaining is 0
  const remainingViews = Math.max(0, maxViews - currentViewNumber);

  // Get the ordinal word for the current view
  const currentViewOrdinal = ordinalMap[currentViewNumber] || `${currentViewNumber}th`;

  let displayText = "";
  // Show remaining count logic when views are less than the max
  if (viewsCount < maxViews) {
      // Example: viewsCount = 0 => current=1, remaining=2 => "First Free Court Check - 2 Remaining"
      // Example: viewsCount = 1 => current=2, remaining=1 => "Second Free Court Check - 1 Remaining"
      // Example: viewsCount = 2 => current=3, remaining=0 => "Third Free Court Check - 0 Remaining"
      displayText = `${currentViewOrdinal} Free Court Check - ${remainingViews} Remaining`;
  }
  // Show specific message when the limit is reached or exceeded
  else {
      // LINT/RENDER FIX: Use a direct apostrophe within the JS string template literal
      displayText = `You've used all ${maxViews} free checks`;
  }


  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardContent className="pt-4 pb-4 md:pt-6 md:pb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            {/* Using text-xl or text-lg for emoji size control */}
            <span className="text-xl leading-none" role="img" aria-label="Tennis ball icon">🎾</span>
            {/* Display the calculated text */}
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