// src/app/request-password-reset/page.tsx
"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import Link from "next/link";

export default function RequestPasswordResetPage() {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    const redirectUrl = `${window.location.origin}/reset-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: redirectUrl },
    );

    setLoading(false);

    if (resetError) {
      console.error('Password reset error:', resetError);
      if (resetError.message.includes("Unable to validate email address")) {
        setError("Please enter a valid email address.");
      } else if (
        resetError.message.includes(
          "For security purposes, you can only request this once every",
        )
      ) {
        setError(
          "Password reset request already sent recently. Please check your email (including spam folder) or wait a few minutes before trying again.",
        );
      } else {
        setError(
          "Failed to send reset link. Please check the email address or try again later.",
        );
      }
    } else {
      setMessage(
        "Password reset email sent! Check your inbox (and spam folder) for the link.",
      );
      setEmail("");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
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
            Reset Your Password
          </h1>
          <p className="text-sm text-center text-gray-600 mb-6">
            Enter your email address below, and we&apos;ll send you a link to set
            a new password.
          </p>

          {message && (
            <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700 border border-green-200">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {!message && (
            <form onSubmit={handleRequestReset} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[#0c372b] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0c372b]/90 focus:outline-none focus:ring-2 focus:ring-[#0c372b] focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Remembered your password?{" "}
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
