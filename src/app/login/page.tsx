// src/app/login/page.tsx
"use client";

import React, { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image"; // Import Image
import Link from "next/link"; // Import Link

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: authUser, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        setLoading(false);
        return;
      }

      if (!authUser.user) {
        setError("Login failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      router.push("/members"); // Redirect to members page
      // Optionally force a refresh if state isn't updating correctly post-redirect
      // router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
         {/* Logo */}
         <div className="flex justify-center mb-8">
             <Image
               src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg" // Use your logo URL
               alt="First Serve Seattle Logo"
               width={80} // Adjust size as needed
               height={80}
               priority // Load logo faster
             />
          </div>

        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Sign In</h1>
          {error && (
             <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                {error}
             </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                 className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-gray-400"
                required
                placeholder="you@example.com"
              />
            </div>

            <div>
               <div className="flex justify-between items-baseline">
                 <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                 </label>
                 {/* Forgot Password Link */}
                 <Link href="/reset-password" // Assuming this is the correct path
                      className="text-sm font-medium text-blue-600 hover:underline">
                   Forgot Password?
                 </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                 className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-gray-400"
                required
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              // Use primary green button style
              className="w-full rounded-lg bg-[#0c372b] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0c372b]/90 focus:outline-none focus:ring-2 focus:ring-[#0c372b] focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <svg className="mr-2 inline h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
              ) : null}
              {loading ? "Signing in..." : "Sign In"}
            </button>

            {/* Sign Up and Support Links */}
             <div className="mt-6 text-center text-sm text-gray-600 space-y-1">
                 <p>
                    {/* Corrected apostrophe here */}
                    Don&apos;t have an account?{" "}
                   <Link href="/signup" className="font-medium text-blue-600 hover:underline">
                     Sign Up
                   </Link>
                 </p>
                 <p>
                   Need help?{" "}
                   <a href="mailto:support@firstserveseattle.com" className="font-medium text-blue-600 hover:underline">
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