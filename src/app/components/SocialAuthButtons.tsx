"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface SocialAuthButtonsProps {
  redirectTo?: string;
  mode: 'login' | 'signup';
  disabled?: boolean;
}

export default function SocialAuthButtons({ 
  redirectTo,
  mode,
  disabled = false 
}: SocialAuthButtonsProps) {
  const supabase = createClientComponentClient();

  const handleAppleSignIn = async () => {
    console.log(`🍎 Apple sign-in initiated (${mode} mode)`);
    
    // For signup mode, redirect to signup page to complete Stripe checkout
    // For login mode, redirect to members page
    const finalRedirect = mode === 'signup' ? '/signup' : (redirectTo || '/members');
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(finalRedirect)}&mode=${mode}`
      }
    });

    if (error) {
      console.error('Apple sign-in error:', error);
    }
  };

  return (
    <div className="space-y-3">
      {/* Friendly Apple ID tip */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
        <div className="flex items-start gap-2">
          <svg className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-medium text-blue-800">💡 Important for Apple users</p>
            <p className="text-blue-700 mt-1">
              If you use <strong>&ldquo;Hide My Email&rdquo;</strong>, make sure to copy that exact private email address and use it during checkout. This ensures your account links properly with billing.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleAppleSignIn}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-3 bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
        Continue with Apple
      </button>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or</span>
        </div>
      </div>
    </div>
  );
} 