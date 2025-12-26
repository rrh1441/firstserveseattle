// src/app/login/LoginFormClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import SocialAuthButtons from "@/components/SocialAuthButtons";

export default function LoginFormClient({ 
  redirectTo, 
  initialEmail = '',
  showTrialMessage = false
}: { 
  redirectTo: string; 
  initialEmail?: string;
  showTrialMessage?: boolean;
}) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastLogin, setLastLogin] = useState<'apple' | 'email' | null>(null);

  // Check last login method on this device
  useEffect(() => {
    const method = localStorage.getItem('last_login_method') as 'apple' | 'email' | null;
    setLastLogin(method);
  }, []);

  // Check for OAuth errors in URL
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      switch (oauthError) {
        case 'oauth_error':
          setError('Sign in with Apple failed. Please try again.');
          break;
        case 'no_user':
          setError('Unable to get user information from Apple. Please try again.');
          break;
        case 'oauth_failed':
          setError('Authentication failed. Please try again.');
          break;
        default:
          setError('An error occurred during sign in. Please try again.');
      }
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    console.log('🔐 Attempting login...');

    const { error: loginError, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError || !data.user) {
      console.error('❌ Login failed:', loginError);
      setError(
        loginError?.message === "Invalid login credentials"
          ? "Incorrect email or password. Please try again."
          : loginError?.message || "Login failed."
      );
      setLoading(false);
      return;
    }

    console.log('✅ Login successful, redirecting to:', redirectTo);
    localStorage.setItem('last_login_method', 'email');
    router.push(redirectTo);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
            alt="First Serve Seattle Logo"
            width={80}
            height={80}
            priority
          />
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
            Sign In
          </h1>

          {showTrialMessage && (
            <div className="mb-6 rounded-md bg-green-50 p-4 border border-green-200">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium text-green-800">
                  Success! Sign in to access your account.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* Social Auth Buttons */}
          <div className="mb-6">
            {lastLogin === 'apple' && (
              <p className="text-sm font-semibold text-gray-600 mb-2 text-center">You last signed in with Apple <span className="inline-block">↓</span></p>
            )}
            <SocialAuthButtons
              mode="login"
              redirectTo={redirectTo}
              disabled={loading}
            />
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {lastLogin === 'email' && (
              <p className="text-sm font-semibold text-gray-600 mb-2 text-center">You last signed in with email <span className="inline-block">↓</span></p>
            )}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2"
                required
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex justify-between items-baseline">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <Link
                  href="/request-password-reset"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2"
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-[#0c372b] px-5 py-2.5 text-sm font-semibold text-white"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>

            <div className="mt-6 text-center text-sm text-gray-600 space-y-1">
              <p>
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Sign Up
                </Link>
              </p>
              <p>
                Need help?{" "}
                <a
                  href="mailto:support@firstserveseattle.com"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Contact support
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
