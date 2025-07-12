'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import LandingPage from './components/LandingPage';
import { shouldShowPaywall } from '@/lib/shouldShowPaywall';
import { useRandomUserId } from './randomUserSetup';

function PageContent() {
  useRandomUserId();
  const router = useRouter();
  const posthog = usePostHog();
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
    // Track landing page CTA click
    posthog.capture('landing_page_cta_clicked', {
      cta_text: "See today's free courts",
      will_hit_paywall: isPaywalled,
      destination: isPaywalled ? 'signup' : 'courts'
    });

    // On click, send the user to the correct page based on the pre-loaded check.
    router.push(isPaywalled ? '/signup?from=paywall' : '/courts');
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