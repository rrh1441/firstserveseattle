'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import type { ReactElement } from 'react';
import TennisCourtList from '@/app/tennis-courts/components/TennisCourtList';
import DaysCounter from '@/app/tennis-courts/components/DaysCounter';
import Paywall from '@/app/tennis-courts/components/paywall';
import { shouldShowPaywall } from '@/lib/shouldShowPaywall';
import { logEvent } from '@/lib/logEvent';
import { ConversionTracker } from '@/lib/eventLogging';

const LoadingIndicator = (): ReactElement => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <p className="animate-pulse text-lg text-gray-600">Loading Courts…</p>
  </div>
);

interface ViewState {
  uniqueDays: number;
  gateDays: number;
  showPaywall: boolean;
}

export default function CourtsPage(): ReactElement | null {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewData, setViewData] = useState<ViewState | null>(null);

  useEffect(() => {
    async function decide() {
      setIsLoading(true);
      try {
        const show = await shouldShowPaywall();
        
        logEvent('visit_courts_page', { showPaywall: show });
        ConversionTracker.trackVisit('/courts', show);

        if (show) {
          // If paywall should be shown, we don't need day counts.
          setViewData({ showPaywall: true, uniqueDays: 0, gateDays: 0 });
        } else {
          // Otherwise, get the data for the counter display.
          setViewData({
            uniqueDays: JSON.parse(localStorage.getItem('fss_days') ?? '[]').length,
            gateDays: Number(localStorage.getItem('fss_gate') ?? 3),
            showPaywall: false,
          });
        }
      } catch {
        // Fail safe: if anything goes wrong, send to signup.
        router.replace('/signup');
      } finally {
        setIsLoading(false);
      }
    }
    decide();
  }, [router]);

  if (isLoading) {
    return <LoadingIndicator />;
  }

  // If paywall is active, render the paywall component directly.
  if (viewData?.showPaywall) {
    return <Paywall />;
  }

  // Otherwise, show the main courts list view.
  if (viewData) {
    return (
      <div className="container mx-auto max-w-4xl bg-white px-4 pt-8 pb-6 text-black md:pt-10 md:pb-8">
        <header className="mb-8 flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-6">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
              alt="First Serve Seattle Logo"
              width={80}
              height={80}
              priority
            />
            <div>
              <h1 className="mb-1 text-3xl font-extrabold text-[#0c372b] md:text-4xl">
                First Serve Seattle
              </h1>
              <p className="text-base font-semibold md:text-lg">
                Today&apos;s Open Tennis and Pickleball Courts
              </p>
            </div>
          </div>
        </header>

        <DaysCounter
          uniqueDays={viewData.uniqueDays}
          gateDays={viewData.gateDays}
        />

        <Suspense fallback={<LoadingIndicator />}>
          <TennisCourtList />
        </Suspense>
      </div>
    );
  }

  return null;
}