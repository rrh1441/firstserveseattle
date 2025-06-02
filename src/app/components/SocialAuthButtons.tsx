"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface SocialAuthButtonsProps {
  redirectTo?: string;
  mode: 'login' | 'signup';
  disabled?: boolean;
}

export default function SocialAuthButtons({ 
  redirectTo = '/members', 
  mode,
  disabled = false 
}: SocialAuthButtonsProps) {
  const supabase = createClientComponentClient();

  const handleAppleSignIn = async () => {
    console.log(`🍎 Apple sign-in initiated (${mode} mode)`);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(redirectTo)}&mode=${mode}`
      }
    });

    if (error) {
      console.error('❌ Apple sign-in error:', error);
      // Error handling could be improved with a callback prop
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleAppleSignIn}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
        </svg>
        {mode === 'signup' ? 'Sign up with Apple' : 'Sign in with Apple'}
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