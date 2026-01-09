'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// import { usePostHog } from 'posthog-js/react';
import Image from 'next/image';
import { logEvent } from '@/lib/logEvent';
import { ConversionTracker } from '@/lib/eventLogging';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  // const posthog = usePostHog();
  const [countdown, setCountdown] = useState(3);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    console.log('✅ CHECKOUT SUCCESS PAGE LOADED');

    // Track successful signup completion
    logEvent('signup_completed', {
      timestamp: new Date().toISOString(),
      userJourneyStage: 'conversion',
      conversionIntent: 'subscribing',
    });

    // Enhanced conversion tracking
    ConversionTracker.trackOfferImpression('checkout_success');

    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      console.log('🔐 User authenticated:', !!user);
    };
    checkAuth();
  }, [supabase]);

  // Separate effect for countdown/redirect after auth check
  useEffect(() => {
    if (isAuthenticated === null) return; // Wait for auth check

    const redirectUrl = isAuthenticated ? '/testc' : '/login?redirect_to=/testc&from=checkout';

    const timer = setInterval(() => {
      setCountdown((prev) => {
        console.log(`⏰ Countdown: ${prev}`);
        if (prev <= 1) {
          clearInterval(timer);
          console.log(`🔄 Redirecting to ${redirectUrl}...`);
          router.replace(redirectUrl);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      console.log('🧹 Cleanup timer');
      clearInterval(timer);
    };
  }, [router, isAuthenticated]);

  const handleGoToApp = () => {
    console.log('👆 Manual button clicked');
    const redirectUrl = isAuthenticated ? '/testc' : '/login?redirect_to=/testc&from=checkout';
    router.replace(redirectUrl);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-8">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
            alt="First Serve Seattle Logo"
            width={80}
            height={80}
            priority
          />
        </div>

        <div className="rounded-full bg-emerald-100 w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">You&apos;re all set!</h1>
        <p className="text-lg text-gray-600 mb-8">Welcome to First Serve Seattle</p>

        <div className="bg-white rounded-xl border border-emerald-200 p-6 mb-6 shadow-sm">
          <p className="text-gray-600 mb-3">
            {isAuthenticated
              ? "Taking you to see today's court availability..."
              : "Taking you to sign in..."}
          </p>
          <p className="text-2xl font-bold text-emerald-600">{countdown}</p>
        </div>

        <button
          onClick={handleGoToApp}
          className="w-full bg-emerald-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-colors"
        >
          {isAuthenticated ? "Go to App →" : "Sign In →"}
        </button>

        <p className="text-sm text-gray-400 mt-6">
          Thanks for subscribing!
        </p>
      </div>
    </div>
  );
} 