'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [status, setStatus] = useState<'checking' | 'redirecting'>('checking');
  
  useEffect(() => {
    async function handleSuccess() {
      setStatus('checking');
      
      // Check if user is already logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // User is already logged in, redirect to members
        setStatus('redirecting');
        router.replace('/members');
        return;
      }
      
      // Show success message briefly, then redirect to login
      setTimeout(() => {
        setStatus('redirecting');
        router.replace('/login?redirect_to=/members&from=checkout');
      }, 2500);
    }
    
    handleSuccess();
  }, [router, supabase]);
  
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
        
        {status === 'checking' && (
          <>
            <div className="rounded-full bg-green-100 w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Trial activated!</h1>
            <p className="text-lg text-gray-600 mb-2">Your 14-day free trial is now active.</p>
            <p className="text-gray-500">Taking you to sign in...</p>
          </>
        )}
        
        {status === 'redirecting' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0c372b] mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Redirecting...</h1>
            <p className="text-gray-600">Taking you to your account...</p>
          </>
        )}
      </div>
    </div>
  );
} 