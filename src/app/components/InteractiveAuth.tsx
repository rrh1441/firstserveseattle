'use client';

import { useRouter } from 'next/navigation';
import { track } from '@vercel/analytics';

export function AuthButtons() {
  const router = useRouter();

  const handleSignIn = () => {
    track('landing_page_signin_clicked', {
      button_location: 'header',
      destination: 'login'
    });
    router.push("/login");
  };

  const handleSignUp = () => {
    track('landing_page_signup_clicked', {
      button_location: 'header', 
      destination: 'signup'
    });
    router.push("/signup");
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleSignIn}
        className="text-sm font-medium text-gray-700 px-3 py-1.5"
      >
        Sign In
      </button>
      <button
        onClick={handleSignUp}
        className="text-sm font-medium text-white bg-[#0c372b] px-4 py-1.5 rounded"
      >
        Sign Up
      </button>
    </div>
  );
}

export function FooterSignInButton() {
  const router = useRouter();

  const handleFooterSignIn = () => {
    track('landing_page_signin_clicked', {
      button_location: 'footer',
      destination: 'login'
    });
    router.push("/login");
  };

  return (
    <button 
      onClick={handleFooterSignIn} 
      className="text-[#0c372b] font-medium"
    >
      Sign in
    </button>
  );
}