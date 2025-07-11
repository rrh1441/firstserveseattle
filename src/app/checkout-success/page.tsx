'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// import { usePostHog } from 'posthog-js/react';
import Image from 'next/image';
import { logEvent } from '@/lib/logEvent';
import { ConversionTracker } from '@/lib/eventLogging';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  // const posthog = usePostHog();
  const [countdown, setCountdown] = useState(5); // Increased to 5 seconds
  
  useEffect(() => {
    console.log('✅ CHECKOUT SUCCESS PAGE LOADED');
    
    // Track successful signup completion
    logEvent('signup_completed', {
      timestamp: new Date().toISOString(),
      userJourneyStage: 'conversion',
      conversionIntent: 'subscribing',
    });
    
    // PostHog conversion tracking
    // posthog.capture('checkout_completed', {
    //   timestamp: new Date().toISOString(),
    //   conversion_type: 'subscription',
    //   page: 'checkout_success'
    // });
    
    // Enhanced conversion tracking
    ConversionTracker.trackOfferImpression('checkout_success');
    
    // Show success message for 5 seconds, then redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        console.log(`⏰ Countdown: ${prev}`);
        if (prev <= 1) {
          clearInterval(timer);
          console.log('🔄 Redirecting to login...');
          router.replace('/login?redirect_to=/members&from=checkout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      console.log('🧹 Cleanup timer');
      clearInterval(timer);
    };
  }, [router]); // , posthog]);
  
  const handleSignInNow = () => {
    console.log('👆 Manual sign in button clicked');
    router.replace('/login?redirect_to=/members&from=checkout');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
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
        
        <div className="rounded-full bg-green-100 w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">🎉 Success!</h1>
        <p className="text-xl text-gray-600 mb-2">Your trial is active!</p>
        <p className="text-lg text-gray-600 mb-8">Welcome to First Serve Seattle</p>
        
        <div className="bg-white rounded-lg border-2 border-green-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">✅ Next Step</h2>
          <p className="text-gray-600 mb-4">Click below to sign in and start using your account</p>
          <p className="text-lg font-bold text-green-600">Auto-redirecting in {countdown} seconds</p>
        </div>
        
        <button
          onClick={handleSignInNow}
          className="w-full bg-[#0c372b] text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-[#0c372b]/90 transition-colors"
        >
          Sign In Now →
        </button>
        
        <p className="text-sm text-gray-500 mt-4">If you&apos;re seeing this page, the checkout worked!</p>
      </div>
    </div>
  );
} 