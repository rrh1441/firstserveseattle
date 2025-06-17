"use client";

import React, { useState, useEffect } from 'react';
import { OfferConfig } from '@/lib/offerExperiments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OfferExperimentManager } from '@/lib/offerExperiments';

interface AnalyticsData {
  totalEvents: number;
  paywallReaches: number;
  conversions: number;
  conversionRate: number;
  offerBreakdown: Record<string, number>;
  engagementMetrics: {
    averageSessionDepth: number;
    highIntentActions: number;
    mapClicks: number;
  };
}

export default function AnalyticsDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [currentExperiment, setCurrentExperiment] = useState<OfferConfig | null>(null);

  // Only show in development or for admin users
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    setIsVisible(isDev || isAdmin);
  }, []);

  useEffect(() => {
    if (isVisible) {
      // Get current experiment info
      const experimentInfo = OfferExperimentManager.getExperimentMetrics();
      setCurrentExperiment(experimentInfo.currentOffer);
      
      // In a real implementation, you'd fetch this from your analytics API
      // For now, show simulated data based on current setup
      setAnalyticsData({
        totalEvents: 1247,
        paywallReaches: 156,
        conversions: 23,
        conversionRate: 14.7,
        offerBreakdown: {
          'five_days_50_off': 78,
          'two_week_trial': 78,
        },
        engagementMetrics: {
          averageSessionDepth: 3.2,
          highIntentActions: 89,
          mapClicks: 45,
        },
      });
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 bg-white shadow-lg border-2 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-800">
            📊 Analytics Dashboard
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3 text-xs">
          {/* Current Experiment */}
          <div className="p-2 bg-blue-50 rounded">
            <div className="font-medium text-blue-900">Current Experiment</div>
            <div className="text-blue-700">
              Offer: {currentExperiment?.currentOffer?.name || 'Loading...'}
            </div>
            <div className="text-blue-600">
              Progress: {currentExperiment?.progressToPaywall ? 
                Math.round(currentExperiment.progressToPaywall * 100) : 0}% to paywall
            </div>
            <div className="text-blue-600">
              Days remaining: {currentExperiment?.daysRemaining || 0}
            </div>
          </div>

          {/* Key Metrics */}
          {analyticsData && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-green-50 rounded text-center">
                  <div className="font-medium text-green-900">Conversions</div>
                  <div className="text-lg font-bold text-green-700">
                    {analyticsData.conversions}
                  </div>
                </div>
                <div className="p-2 bg-orange-50 rounded text-center">
                  <div className="font-medium text-orange-900">Rate</div>
                  <div className="text-lg font-bold text-orange-700">
                    {analyticsData.conversionRate}%
                  </div>
                </div>
              </div>

              {/* Offer Performance */}
              <div className="p-2 bg-gray-50 rounded">
                <div className="font-medium text-gray-900 mb-1">Offer A/B Test</div>
                {Object.entries(analyticsData.offerBreakdown).map(([offer, count]) => (
                  <div key={offer} className="flex justify-between text-gray-700">
                    <span>{offer.replace('_', ' ')}</span>
                    <span>{count} users</span>
                  </div>
                ))}
              </div>

              {/* Engagement */}
              <div className="p-2 bg-purple-50 rounded">
                <div className="font-medium text-purple-900 mb-1">Engagement</div>
                <div className="text-purple-700">
                  Avg session depth: {analyticsData.engagementMetrics.averageSessionDepth}
                </div>
                <div className="text-purple-700">
                  High intent actions: {analyticsData.engagementMetrics.highIntentActions}
                </div>
                <div className="text-purple-700">
                  Maps clicked: {analyticsData.engagementMetrics.mapClicks}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-1">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs flex-1"
                  onClick={() => {
                    console.log('Current experiment metrics:', currentExperiment);
                    console.log('Analytics data:', analyticsData);
                  }}
                >
                  Log Data
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs flex-1"
                  onClick={() => {
                    localStorage.removeItem('offer_cohort_assignment');
                    window.location.reload();
                  }}
                >
                  Reset
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 