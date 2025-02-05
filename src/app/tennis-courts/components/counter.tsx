import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye } from 'lucide-react';

const ViewsCounter = ({ viewsCount }: { viewsCount: number }) => {
  const maxViews = 3;
  const remainingViews = maxViews - viewsCount;
  
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium">
              {remainingViews > 0 
                ? `${remainingViews} of ${maxViews} free views remaining`
                : 'You\'ve used all your free views'}
            </span>
          </div>
          <Button asChild className="bg-[#0c372b] hover:bg-[#0c372b]/90">
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