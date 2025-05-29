// src/app/login/LoginFormClient.tsx
"use client";

import React, { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

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

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: loginError, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError || !data.user) {
      setError(
        loginError?.message === "Invalid login credentials"
          ? "Incorrect email or password. Please try again."
          : loginError?.message || "Login failed."
      );
      setLoading(false);
      return;
    }

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
                  Great! Your 14-day free trial is active. Sign in to access your account.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
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
