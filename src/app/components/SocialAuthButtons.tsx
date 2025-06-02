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
    // Show warning about Hide My Email
    const userConfirmed = window.confirm(
      "⚠️ Apple ID Sign-In Warning\n\n" +
      "When signing in with Apple, please choose \"Share My Email\" instead of \"Hide My Email\".\n\n" +
      "If you hide your email:\n" +
      "• Stripe won't be able to find your account for billing\n" +
      "• You won't receive important billing notifications\n" +
      "• Account recovery will be difficult\n\n" +
      "Click OK to continue with Apple sign-in, or Cancel to use email instead."
    );

    if (!userConfirmed) {
      return; // User cancelled
    }

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
      {/* Apple ID Warning */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
        <div className="flex items-start gap-2">
          <svg className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-medium text-amber-800">Apple ID Users: Please Don&apos;t Hide Your Email</p>
            <p className="text-amber-700 mt-1">
              When signing in with Apple, choose <strong>&ldquo;Share My Email&rdquo;</strong> so Stripe can manage your billing properly.
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