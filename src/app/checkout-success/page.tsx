'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);
  
  useEffect(() => {
    // Show success message for 3 seconds, then redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.replace('/login?redirect_to=/members&from=checkout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [router]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
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
        
        <div className="rounded-full bg-green-100 w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to First Serve Seattle!</h1>
        <p className="text-lg text-gray-600 mb-6">Your 14-day free trial is now active.</p>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Next Step</h2>
          <p className="text-gray-600 mb-4">Sign in to access your account and start checking court availability.</p>
          <p className="text-sm text-gray-500">Redirecting in {countdown} seconds...</p>
        </div>
        
        <button
          onClick={() => router.replace('/login?redirect_to=/members&from=checkout')}
          className="w-full bg-[#0c372b] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#0c372b]/90 transition-colors"
        >
          Sign In Now
        </button>
      </div>
    </div>
  );
} 