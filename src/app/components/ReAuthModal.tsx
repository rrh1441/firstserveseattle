"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Loader2 } from "lucide-react";

interface ReAuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userEmail: string;
  authProvider: "apple" | "google" | "email" | null;
}

export default function ReAuthModal({
  open,
  onClose,
  onSuccess,
  userEmail,
  authProvider,
}: ReAuthModalProps) {
  const supabase = createClientComponentClient();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordReAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      });

      if (signInError) {
        setError("Incorrect password. Please try again.");
        return;
      }

      // Success - password verified
      setPassword("");
      onSuccess();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthReAuth = async (provider: "apple" | "google") => {
    setLoading(true);
    setError(null);

    // Store flag so we know to open billing after re-auth
    localStorage.setItem("reauth_pending_action", "billing");

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect_to=/members&mode=login`,
        },
      });

      if (oauthError) {
        setError(`Failed to start ${provider} sign-in. Please try again.`);
        localStorage.removeItem("reauth_pending_action");
        setLoading(false);
      }
      // If no error, user will be redirected to OAuth provider
    } catch {
      setError("Something went wrong. Please try again.");
      localStorage.removeItem("reauth_pending_action");
      setLoading(false);
    }
  };

  const isOAuthUser = authProvider === "apple" || authProvider === "google";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm your identity</DialogTitle>
          <DialogDescription>
            For your security, please verify your identity before accessing billing settings.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {isOAuthUser ? (
            // OAuth re-authentication
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                You signed in with {authProvider === "apple" ? "Apple" : "Google"}.
                Please sign in again to continue.
              </p>

              {authProvider === "apple" && (
                <Button
                  onClick={() => handleOAuthReAuth("apple")}
                  disabled={loading}
                  className="w-full bg-black text-white hover:bg-gray-800"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg
                      className="mr-2 h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                  )}
                  Continue with Apple
                </Button>
              )}

              {authProvider === "google" && (
                <Button
                  onClick={() => handleOAuthReAuth("google")}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  Continue with Google
                </Button>
              )}
            </div>
          ) : (
            // Password re-authentication
            <form onSubmit={handlePasswordReAuth} className="space-y-4">
              <div>
                <label
                  htmlFor="reauth-password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Enter your password
                </label>
                <input
                  id="reauth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-[#0c372b] focus:outline-none focus:ring-1 focus:ring-[#0c372b]"
                  placeholder="Your password"
                  required
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !password}
                className="w-full bg-[#0c372b] text-white hover:bg-[#0c372b]/90"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Confirm
              </Button>
            </form>
          )}

          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
