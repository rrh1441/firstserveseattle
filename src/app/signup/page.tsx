"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
// import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import { PlanSelector } from "@/components/PlanSelector";
import { FEATURES } from "@/lib/paywallCopy";
import SocialAuthButtons from "@/components/SocialAuthButtons";

import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

type PlanType = "monthly" | "annual";

interface PasswordRequirement {
  id: string;
  regex: RegExp;
  message: string;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { id: "length", regex: /.{6,}/, message: "At least 6 characters" },
  { id: "lowercase", regex: /[a-z]/, message: "At least one lowercase letter" },
  { id: "uppercase", regex: /[A-Z]/, message: "At least one uppercase letter" },
  { id: "digit", regex: /\d/, message: "At least one digit" },
];

export default function SignUpPage() {
  /* -------------------------------------------------------------------- */
  /*  URL params                                                          */
  /* -------------------------------------------------------------------- */
  const searchParams        = useSearchParams();
  const initialPlanParam    = searchParams.get("plan");
  const headlineGroupParam  = searchParams.get("headline_group"); // analytics only
  const prefilledEmail      = searchParams.get("email") || "";
  const isAppleUser         = searchParams.get("apple_user") === "true";
  void headlineGroupParam;

  /* -------------------------------------------------------------------- */
  /*  Local state                                                         */
  /* -------------------------------------------------------------------- */
  const [plan, setPlan]           = useState<PlanType>(
    initialPlanParam === "annual" ? "annual" : "monthly",
  );
  const [fullName, setFullName]   = useState("");
  const [email, setEmail]         = useState(prefilledEmail);
  const [password, setPassword]   = useState("");
  const [assignedOffer, setAssignedOffer] = useState<{ id: string; discount?: { percentage: number } } | null>(null);
  const [loading, setLoading]     = useState(false);
  const [errorMsg, setErrorMsg]   = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string; user_metadata?: { full_name?: string } } | null>(null);

  const supabase = createClientComponentClient();
  // const posthog = usePostHog();

  /* -------------------------------------------------------------------- */
  /*  Check if user is already signed in (from Apple OAuth)              */
  /* -------------------------------------------------------------------- */
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const appleUser = searchParams.get('apple_user');
    const emailParam = searchParams.get('email');
    
    if (appleUser || emailParam) {
      console.log('🍎 Apple user detected, checking auth state');
      
      // Get current user session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          console.log('✅ Apple user authenticated:', session.user.email);
          setCurrentUser(session.user);
          setEmail(session.user.email || emailParam || '');
          
          // Check if Apple user already has a subscription
          supabase
            .from('subscribers')
            .select('id, status')
            .eq('email', session.user.email)
            .maybeSingle()
            .then(({ data: subscriber }) => {
              if (subscriber) {
                console.log('✅ Apple user already has subscription, redirecting to members');
                window.location.href = '/members';
                return;
              }
              
              // For Apple users without subscription, skip the account creation form
              if (appleUser && session.user.email) {
                console.log('🔄 Auto-filling Apple user email and skipping form');
                setEmail(session.user.email);
              }
            });
        }
      });
    }
  }, [supabase.auth, supabase]);

  useEffect(() => {
    // Everyone gets the 50% off offer
    const offer = { 
      id: 'fifty_percent_off_first_month', 
      discount: { percentage: 50 }
    };
    setAssignedOffer(offer);
  }, []);

  /* -------------------------------------------------------------------- */
  /*  Check if email user is already a subscriber                        */
  /* -------------------------------------------------------------------- */
  const checkExistingSubscriber = async (emailToCheck: string) => {
    if (!emailToCheck || emailToCheck.length < 3) return;
    
    try {
      const { data: subscriber } = await supabase
        .from('subscribers')
        .select('id, status')
        .eq('email', emailToCheck)
        .maybeSingle();
        
      if (subscriber) {
        setErrorMsg(`This email already has an active subscription. Please sign in instead.`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking subscriber:', error);
      return false;
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Helpers                                                             */
  /* -------------------------------------------------------------------- */
  const allMet = () =>
    PASSWORD_REQUIREMENTS.every((req) => req.regex.test(password));

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
  };

  /* -------------------------------------------------------------------- */
  /*  Plan change triggers immediate checkout redirect                    */
  /* -------------------------------------------------------------------- */
  async function handlePlanChange(newPlan: PlanType) {
    console.log(`📊 Plan changed to: ${newPlan}`);
    setPlan(newPlan);
  }

  /* -------------------------------------------------------------------- */
  /*  Submit → create Supabase user then Stripe session                   */
  /* -------------------------------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!plan) {
      alert("Please select a plan first");
      return;
    }

    // For Apple users who are already authenticated, skip account creation
    if (currentUser && currentUser.email) {
      console.log('🍎 Apple user proceeding directly to checkout');
      await proceedToCheckout();
      return;
    }

    // Regular email/password signup flow
    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    setErrorMsg("");

    // For regular users, validate password
    if (!allMet()) {
      setErrorMsg("Password does not meet all requirements.");
      return;
    }

    setLoading(true);
    try {
      // Check if email already has a subscription
      const isExistingSubscriber = await checkExistingSubscriber(email);
      if (isExistingSubscriber) {
        setLoading(false);
        return;
      }

      console.log(`📝 Creating account for ${email}`);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        console.log("✅ Account created, proceeding to checkout");
        
        // Track successful signup
        // posthog.capture('user_signup_completed', {
        //   plan_type: plan,
        //   signup_method: 'email',
        //   has_existing_subscription: false,
        //   email_prefilled: !!prefilledEmail,
        //   is_apple_user: isAppleUser
        // });
        
        await proceedToCheckout();
      }
    } catch (err: unknown) {
      console.error("Signup error:", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  async function proceedToCheckout() {
    try {
      // Track checkout start
      // posthog.capture('checkout_initiated', {
      //   plan_type: plan,
      //   user_email: email,
      //   offer_id: 'fifty_percent_off_first_month',
      //   from_page: 'signup'
      // });
      
      // Everyone gets the 50% off offer
      const offerId = 'fifty_percent_off_first_month';
      console.log('🎯 Signup page - offer ID:', offerId);
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          plan,
          offerId: offerId,
          headlineGroup: headlineGroupParam,
          userId: currentUser?.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const { url } = await response.json();
      console.log("🔀 Redirecting to Stripe checkout");
      window.location.href = url;

      // Redirecting to checkout
    } catch (err: unknown) {
      console.error("Checkout error:", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to create checkout session");
      setLoading(false);
    }
  }

  /* -------------------------------------------------------------------- */
  /*  Render                                                              */
  /* -------------------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-4 py-12 sm:py-16">
      <div className="flex justify-center mb-8">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
          alt="First Serve Seattle Logo"
          width={80}
          height={80}
          priority
        />
      </div>

      <div className="mx-auto max-w-lg">
        <div className="overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-gray-100">
          <div className="px-6 py-8 sm:px-10">
            {/* ---------------- Plan selector ---------------- */}
            <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
              Choose Your Plan
            </h2>
            <p className="text-center text-sm text-gray-600 mb-8">
              Select the plan that works best for you.
            </p>

            <div className="mb-10">
              <PlanSelector
                selectedPlan={plan}
                onPlanSelect={handlePlanChange}
                features={FEATURES}
                assignedOffer={assignedOffer}
              />
            </div>

            <hr className="my-8 border-gray-200" />

            {/* ---------------- Social Auth Options ---------------- */}
            {!isAppleUser && (
              <div className="mb-8">
                <h2 className="text-center text-xl font-bold text-gray-900 mb-6">
                  Create Your Account
                </h2>
                <SocialAuthButtons 
                  mode="signup" 
                  disabled={loading}
                />
              </div>
            )}

            {/* ---------------- Account form ---------------- */}
            {!isAppleUser && (
              <h2 className="text-center text-xl font-bold text-gray-900 mb-6">
                Create with email
              </h2>
            )}

            {isAppleUser && (
              <h2 className="text-center text-xl font-bold text-gray-900 mb-6">
                Complete Your Registration
              </h2>
            )}

            {errorMsg && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMsg}
                {errorMsg.includes('already has an active subscription') && (
                  <div className="mt-2">
                    <Link href="/login" className="font-medium text-red-600 hover:text-red-800 underline">
                      Go to Sign In →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Account Creation Form */}
            {currentUser ? (
              // Apple user is already authenticated
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <svg className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-green-800">Account Connected</span>
                </div>
                <p className="mt-1 text-sm text-green-700">
                  Signed in as <strong>{currentUser.email}</strong>
                </p>
                <p className="mt-1 text-xs text-green-600">
                  Select a plan below to complete your subscription.
                </p>
              </div>
            ) : (
              // Regular email/password form
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Password with requirements */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={handlePasswordChange}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Password Requirements */}
                  <div className="mt-2 space-y-1">
                    {PASSWORD_REQUIREMENTS.map((req) => {
                      const isMet = req.regex.test(password);
                      return (
                        <div key={req.id} className="flex items-center space-x-2 text-xs">
                          {isMet ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-gray-300" />
                          )}
                          <span className={isMet ? "text-green-600" : "text-gray-500"}>
                            {req.message}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {errorMsg && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3">
                    <p className="text-sm text-red-600">{errorMsg}</p>
                  </div>
                )}
              </form>
            )}

            {/* Action Button */}
            <button
              onClick={currentUser ? proceedToCheckout : handleSubmit}
              disabled={loading || (!currentUser && (!plan || (!currentUser && (!fullName || !email || !allMet()))))}
              className="mt-6 w-full rounded-lg bg-blue-600 py-3 text-white font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading 
                ? "Processing..." 
                : currentUser 
                  ? `Start ${plan} Plan - ${plan === "monthly" ? "$9.99/month" : "$99.99/year"}`
                  : "Create Account"
              }
            </button>

            {/* Footer links */}
            <div className="mt-6 space-y-1 text-center text-sm text-gray-600">
              <p>
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Sign In
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

            <p className="mt-6 text-center text-xs text-gray-500">
              By creating an account, you agree to our{" "}
              <Link
                href="/terms-of-service"
                className="underline hover:text-gray-700"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy-policy"
                className="underline hover:text-gray-700"
              >
                Privacy Policy
              </Link>
              . Secure payment via Stripe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}