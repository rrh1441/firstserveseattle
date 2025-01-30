"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function ResetPasswordPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hashParams = new URLSearchParams(window.location.hash.replace("#", ""));
      const resetToken = hashParams.get("access_token");
      if (resetToken) {
        setToken(resetToken);
        authenticateUser(resetToken);
      } else {
        setError("Invalid or expired reset link. Please request a new one.");
      }
    }
  }, []);

  const authenticateUser = async (token: string) => {
    const { error } = await supabase.auth.exchangeCodeForSession(token);
    if (error) {
      setError("Auth session missing! Please request a new reset link.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token) {
      setError("Invalid or expired reset link.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Redirect to login after success
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (!token && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4">Reset Link Invalid</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push("/signin")}
            className="mt-4 w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-4">Reset Password</h1>
        {success ? (
          <p className="text-green-500 text-sm text-center mb-4">
            Password updated! Redirecting to login...
          </p>
        ) : (
          <form onSubmit={handleResetPassword}>
            {error && (
              <p className="text-red-500 text-sm text-center mb-4">{error}</p>
            )}
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-lg"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Updating Password..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}