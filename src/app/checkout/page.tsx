"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { FEATURES } from "@/lib/paywallCopy";

type PlanType = "monthly" | "annual";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  const emailFromUrl = searchParams.get("email") || "";
  const planFromUrl = searchParams.get("plan");

  const [plan, setPlan] = useState<PlanType>(planFromUrl === "annual" ? "annual" : "monthly");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [trialEnd, setTrialEnd] = useState<number | null>(null);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check authentication and get subscriber info
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser || !authUser.email) {
        // Not authenticated - allow checkout with email from URL
        setCheckingAuth(false);
        return;
      }

      setUser({ id: authUser.id, email: authUser.email });

      // Check if user has a subscriber record
      const { data: subscriber } = await supabase
        .from("subscribers")
        .select("trial_end, status")
        .eq("user_id", authUser.id)
        .single();

      // If no subscriber record exists, create one via link-subscriber API
      if (!subscriber) {
        console.log('No subscriber record found, creating one...');
        try {
          const session = await supabase.auth.getSession();
          await fetch('/api/link-subscriber', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: 'signup',
              accessToken: session.data.session?.access_token
            })
          });
          // Reload to pick up the new subscriber record
          window.location.reload();
          return;
        } catch (err) {
          console.error('Failed to create subscriber:', err);
        }
      }

      if (subscriber?.trial_end) {
        setTrialEnd(subscriber.trial_end);

        // Calculate days remaining
        const now = new Date();
        const trialEndDate = new Date(subscriber.trial_end * 1000);
        const daysLeft = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft > 0) {
          setTrialDaysRemaining(daysLeft);
        }
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, [supabase, router]);

  // Get the email to use for checkout (logged in user or URL param)
  const checkoutEmail = user?.email || emailFromUrl;

  const handleCheckout = async () => {
    if (!checkoutEmail) {
      setError("Email is required. Please try again from the email link.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: checkoutEmail,
          plan,
          userId: user?.id || null,
          trialEnd: trialEnd, // Honor remaining trial if applicable
          // NO offerId - this allows promo codes via Stripe
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white px-4 py-8 sm:py-12">
      <div className="max-w-md mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
            alt="First Serve Seattle"
            width={64}
            height={64}
            priority
          />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Unlock Today&apos;s Courts
          </h1>
          <p className="text-gray-600">
            Real-time availability for 50+ Seattle tennis courts
          </p>
        </div>

        {/* Trial badge */}
        {trialDaysRemaining && trialDaysRemaining > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-6 text-center">
            <p className="text-sm text-emerald-800">
              <span className="font-semibold">{trialDaysRemaining} days</span> left in your trial.
              Subscribe now and you won&apos;t be charged until your trial ends.
            </p>
          </div>
        )}

        {/* Plan selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Monthly */}
          <button
            onClick={() => setPlan("monthly")}
            className={`relative p-4 rounded-xl border-2 transition-all ${
              plan === "monthly"
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            {plan === "monthly" && (
              <div className="absolute top-2 right-2">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
            )}
            <div className="text-left">
              <p className="font-semibold text-gray-900 mb-1">Monthly</p>
              <p className="text-2xl font-bold text-gray-900">
                $8<span className="text-sm font-normal text-gray-500">/mo</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">Cancel anytime</p>
            </div>
          </button>

          {/* Annual */}
          <button
            onClick={() => setPlan("annual")}
            className={`relative p-4 rounded-xl border-2 transition-all ${
              plan === "annual"
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                SAVE $32
              </span>
            </div>
            {plan === "annual" && (
              <div className="absolute top-2 right-2">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
            )}
            <div className="text-left">
              <p className="font-semibold text-gray-900 mb-1">Annual</p>
              <p className="text-2xl font-bold text-gray-900">
                $64<span className="text-sm font-normal text-gray-500">/yr</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">$5.33/month</p>
            </div>
          </button>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <p className="text-sm font-medium text-gray-900 mb-3">What you get:</p>
          <ul className="space-y-2">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-center">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-4 px-6 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Redirecting to checkout...
            </>
          ) : (
            <>
              Continue to Payment
              <span className="text-emerald-200">→</span>
            </>
          )}
        </button>

        {/* Trust badges */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3" />
            Secure checkout
          </span>
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3" />
            Cancel anytime
          </span>
        </div>

        {/* Promo code note */}
        <p className="text-center text-xs text-gray-400 mt-3">
          Have a promo code? You can enter it at checkout.
        </p>

        {/* Signed in as / Email info */}
        {checkoutEmail && (
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              {user ? "Signed in as" : "Checking out as"}{" "}
              <span className="font-medium text-gray-700">{checkoutEmail}</span>
            </p>
            {user && (
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-400 hover:text-gray-600 underline mt-1"
              >
                Not you? Sign out
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
