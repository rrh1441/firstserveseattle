// src/app/tennis-courts/components/counter.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye } from 'lucide-react';

const ViewsCounter = ({ viewsCount }: { viewsCount: number }) => {
  const maxViews = 5; // Total free views allowed

  // Map numbers to ordinal words
  const ordinalMap: { [key: number]: string } = {
    1: 'First',
    2: 'Second',
    3: 'Third',
    4: 'Fourth',
    5: 'Fifth'
  };

  // Calculate the current view number (1-based index)
  // If viewsCount is 0, it's the 1st view. If 4, it's the 5th view.
  const currentViewNumber = Math.min(viewsCount + 1, maxViews);

  // Calculate remaining views *after* this one
  const remainingViews = Math.max(0, maxViews - currentViewNumber);

  // Get the ordinal word for the current view
  const currentViewOrdinal = ordinalMap[currentViewNumber] || `${currentViewNumber}th`; // Fallback just in case

  // Construct the display text
  let displayText = "";
  if (viewsCount < maxViews) {
      // User is still within their free views
      displayText = `${currentViewOrdinal} Free Court View - ${remainingViews} Remaining`;
  } else {
      // User has used all free views
      displayText = `You've used all ${maxViews} free views`;
  }


  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardContent className="pt-4 pb-4 md:pt-6 md:pb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600 flex-shrink-0" />
            {/* Updated Display Text */}
            <span className="text-sm font-medium text-blue-800 text-center sm:text-left">
              {displayText}
            </span>
          </div>
          {/* Button remains the same, always links to signup */}
          <Button asChild size="sm" className="bg-[#0c372b] hover:bg-[#0c372b]/90 text-white whitespace-nowrap w-full sm:w-auto">
            <a href="/signup">
              Get Unlimited Views
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ViewsCounter;