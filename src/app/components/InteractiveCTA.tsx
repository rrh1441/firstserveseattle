'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { track } from '@vercel/analytics';
import { shouldShowPaywall } from '@/lib/shouldShowPaywall';
import { useRandomUserId } from '../randomUserSetup';

interface InteractiveCTAProps {
  size?: 'lg' | 'xl';
  variant?: 'dark' | 'light';
  className?: string;
}

export default function InteractiveCTA({ size = 'lg', variant = 'dark', className = '' }: InteractiveCTAProps) {
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
    // Track landing page CTA click with Vercel Analytics
    track('landing_cta_click', {
      button_text: "See today's free courts",
      will_hit_paywall: isPaywalled,
      destination: isPaywalled ? 'signup' : 'courts'
    });

    // On click, send the user to the correct page based on the pre-loaded check.
    router.push(isPaywalled ? '/signup?from=paywall' : '/courts');
  };

  const sizeClasses = size === 'xl'
    ? 'text-xl font-semibold mb-3'
    : 'text-lg font-semibold';

  const variantClasses = variant === 'light'
    ? 'bg-white text-[#0c372b] hover:bg-gray-100 shadow-lg'
    : 'bg-[#0c372b] text-white hover:bg-[#0a2e21]';

  return (
    <button
      onClick={handleGetFreeViews}
      disabled={isLoading}
      className={`w-full md:w-auto md:px-8 py-4 px-6 ${sizeClasses} rounded ${variantClasses} transition-colors disabled:opacity-50 ${className}`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Checking status...
        </div>
      ) : (
        "See today's free courts"
      )}
    </button>
  );
}