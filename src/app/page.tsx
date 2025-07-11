'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from './components/LandingPage';
import { shouldShowPaywall } from '@/lib/shouldShowPaywall';
import { useRandomUserId } from './randomUserSetup';

function PageContent() {
  useRandomUserId();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isPaywalled, setIsPaywalled] = useState(false);

  useEffect(() => {
    // Pre-load the paywall check for the CTA, making the redirect instant.
    shouldShowPaywall().then(show => {
      setIsPaywalled(show);
      setIsLoading(false);
    });
  }, []);

  const handleGetFreeViews = () => {
    // On click, send the user to the correct page based on the pre-loaded check.
    router.push(isPaywalled ? '/paywall' : '/courts');
  };

  return (
    <LandingPage
      isLoading={isLoading}
      onGetFreeViews={handleGetFreeViews}
    />
  );
}

// The root of the app is now the landing page.
export default function HomePage() {
  return (
    // Suspense is a good practice for pages that handle routing or data fetching.
    <Suspense>
      <PageContent />
    </Suspense>
  );
}