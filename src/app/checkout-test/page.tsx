"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Check, Loader2, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { FEATURES } from "@/lib/paywallCopy";

type PlanType = "monthly" | "annual";

type SubscriberStatus = "trialing" | "active" | "paid" | "canceled" | "lapsed" | null;

interface SubscriberInfo {
  status: SubscriberStatus;
  trialEnd: number | null;
  trialDaysRemaining: number | null;
  hasStripeCustomer: boolean;
}

export default function CheckoutTestPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [plan, setPlan] = useState<PlanType>("monthly");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [subscriberInfo, setSubscriberInfo] = useState<SubscriberInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check authentication and get subscriber info
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser || !authUser.email) {
        // Not authenticated, redirect to testworkflow (they need to sign up/in first)
        router.push("/");
        return;
      }

      setUser({ id: authUser.id, email: authUser.email });

      // Fetch subscriber info
      const { data: subscriber } = await supabase
        .from("subscribers")
        .select("status, trial_end, stripe_customer_id")
        .eq("user_id", authUser.id)
        .single();

      if (subscriber) {
        const now = new Date();
        const trialEndMs = subscriber.trial_end ? subscriber.trial_end * 1000 : null;
        const trialEndDate = trialEndMs ? new Date(trialEndMs) : null;

        let daysRemaining: number | null = null;
        if (trialEndDate && trialEndDate > now) {
          daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }

        setSubscriberInfo({
          status: subscriber.status as SubscriberStatus,
          trialEnd: subscriber.trial_end,
          trialDaysRemaining: daysRemaining,
          hasStripeCustomer: !!subscriber.stripe_customer_id,
        });
      } else {
        // No subscriber record at all - shouldn't happen normally but handle it
        setSubscriberInfo({
          status: null,
          trialEnd: null,
          trialDaysRemaining: null,
          hasStripeCustomer: false,
        });
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, [supabase, router]);

  const handleCheckout = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          plan,
          userId: user.id,
          trialEnd: subscriberInfo?.trialEnd, // Honor remaining trial if applicable
          // NO offerId - promo codes handled via Stripe checkout
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleBack = () => {
    router.push("/");
  };

  // Determine page title and messaging based on subscriber status
  const getPageContent = () => {
    if (!subscriberInfo) {
      return {
        title: "Start Your Subscription",
        subtitle: "Get access to real-time court availability",
        showTrialBadge: false,
        ctaText: "Continue to Payment",
      };
    }

    const { status, trialDaysRemaining, hasStripeCustomer } = subscriberInfo;

    // Active trial with days remaining
    if (status === "trialing" && trialDaysRemaining && trialDaysRemaining > 0) {
      return {
        title: "Upgrade Now",
        subtitle: "Lock in your subscription before your trial ends",
        showTrialBadge: true,
        trialMessage: `${trialDaysRemaining} day${trialDaysRemaining === 1 ? "" : "s"} left in your trial. Subscribe now and you won't be charged until your trial ends.`,
        ctaText: "Start Subscription",
      };
    }

    // Expired trial
    if (status === "trialing") {
      return {
        title: "Your Trial Has Ended",
        subtitle: "Subscribe to continue seeing today's court availability",
        showTrialBadge: false,
        ctaText: "Subscribe Now",
      };
    }

    // Canceled subscription
    if (status === "canceled" || status === "lapsed") {
      return {
        title: "Welcome Back",
        subtitle: "Reactivate your subscription to see today's courts",
        showTrialBadge: false,
        ctaText: hasStripeCustomer ? "Reactivate Subscription" : "Subscribe Now",
      };
    }

    // Active/paid - shouldn't be on this page but handle gracefully
    if (status === "active" || status === "paid") {
      return {
        title: "You're Already Subscribed",
        subtitle: "You have an active subscription",
        showTrialBadge: false,
        ctaText: "Go to Courts",
        isAlreadySubscribed: true,
      };
    }

    // Default
    return {
      title: "Start Your Subscription",
      subtitle: "Real-time availability for 50+ Seattle tennis courts",
      showTrialBadge: false,
      ctaText: "Continue to Payment",
    };
  };

  const pageContent = getPageContent();

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

  // If already subscribed, show a message and redirect option
  if (pageContent.isAlreadySubscribed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white px-4 py-8 sm:py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You&apos;re Already Subscribed!
          </h1>
          <p className="text-gray-600 mb-6">
            You have full access to today&apos;s court availability.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-4 px-6 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            View Courts
          </button>
          <button
            onClick={() => router.push("/billing")}
            className="w-full mt-3 py-3 px-6 text-gray-600 font-medium hover:text-gray-800 transition-colors"
          >
            Manage Subscription
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white px-4 py-8 sm:py-12">
      <div className="max-w-md mx-auto">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to courts</span>
        </button>

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
            {pageContent.title}
          </h1>
          <p className="text-gray-600">
            {pageContent.subtitle}
          </p>
        </div>

        {/* Trial badge */}
        {pageContent.showTrialBadge && pageContent.trialMessage && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-6 text-center">
            <p className="text-sm text-emerald-800">
              {pageContent.trialMessage}
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
              {pageContent.ctaText}
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

        {/* Signed in as */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Signed in as <span className="font-medium text-gray-700">{user?.email}</span>
          </p>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-gray-600 underline mt-1"
          >
            Not you? Sign out
          </button>
        </div>

        {/* Debug info for testing */}
        {process.env.NODE_ENV === "development" && subscriberInfo && (
          <div className="mt-6 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
            <p className="font-mono">Debug: status={subscriberInfo.status}, trialDays={subscriberInfo.trialDaysRemaining}, hasStripe={String(subscriberInfo.hasStripeCustomer)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
