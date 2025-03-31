/* src/app/tennis-courts/components/counter.tsx */
import React from 'react';
import { Button } from '@/components/ui/button'; // Assuming path is correct
import { Card, CardContent } from '@/components/ui/card'; // Assuming path is correct
import { Eye } from 'lucide-react';

const ViewsCounter = ({ viewsCount }: { viewsCount: number }) => {
  const maxViews = 5; // Corresponds to the limit in check-paywall API
  // Ensure viewsCount doesn't go below 0 for calculation
  const currentViews = Math.max(0, viewsCount);
  const remainingViews = Math.max(0, maxViews - currentViews);

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50"> {/* Added subtle styling */}
      <CardContent className="pt-4 pb-4 md:pt-6 md:pb-6"> {/* Adjusted padding */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600 flex-shrink-0" /> {/* Adjusted color */}
            <span className="text-sm font-medium text-blue-800"> {/* Adjusted color */}
              {remainingViews > 0
                // Use backticks for easier interpolation if needed, keep &apos;
                ? `${remainingViews} of ${maxViews} free court views remaining`
                // Corrected line: Replace ' with &apos;
                : `You&apos;ve used all ${maxViews} free views`}
            </span>
          </div>
          <Button asChild size="sm" className="bg-[#0c372b] hover:bg-[#0c372b]/90 text-white whitespace-nowrap w-full sm:w-auto">
            {/* Link directs to signup regardless of remaining views */}
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