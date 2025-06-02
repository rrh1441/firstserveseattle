"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  const [loading, setLoading]     = useState(false);
  const [errorMsg, setErrorMsg]   = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [metRequirements, setMetRequirements] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string; user_metadata?: { full_name?: string } } | null>(null);

  const supabase = createClientComponentClient();

  /* -------------------------------------------------------------------- */
  /*  Check if user is already signed in (from Apple OAuth)              */
  /* -------------------------------------------------------------------- */
  useEffect(() => {
    if (isAppleUser) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setCurrentUser(user);
          setEmail(user.email || prefilledEmail);
          setFullName(user.user_metadata?.full_name || "");
          console.log('🍎 Apple user detected:', user.email);
        }
      });
    }
  }, [isAppleUser, prefilledEmail, supabase.auth]);

  /* -------------------------------------------------------------------- */
  /*  Helpers                                                             */
  /* -------------------------------------------------------------------- */
  const togglePasswordVisibility = () => setPasswordVisible((v) => !v);

  const allMet = () =>
    PASSWORD_REQUIREMENTS.every((r) => metRequirements.includes(r.id));

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    const met = PASSWORD_REQUIREMENTS.filter((req) =>
      req.regex.test(newPassword),
    ).map((req) => req.id);
    setMetRequirements(met);
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
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");

    // For Apple users, skip password validation
    if (!isAppleUser && !allMet()) {
      setErrorMsg("Password does not meet all requirements.");
      return;
    }

    setLoading(true);
    try {
      let userId = currentUser?.id;

      /* -- For non-Apple users, create account first ------------------- */
      if (!isAppleUser) {
        const { data, error: authErr } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (authErr?.message?.includes("already registered")) {
          throw new Error("Account already exists. Please sign in instead.");
        }
        if (authErr) throw new Error(authErr.message);
        if (!data.user) throw new Error("No user returned after sign-up.");
        userId = data.user.id;
      }

      /* -- store pending subscriber row -------------------------------- */
      console.log('📝 Creating subscriber record for:', email);
      const subResp = await fetch('/api/create-subscriber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email,
          fullName,
          plan
        })
      });
      
      if (!subResp.ok) {
        const subError = await subResp.text();
        console.error('❌ Failed to create subscriber record:', subError);
        throw new Error(`Failed to create subscriber record: ${subError}`);
      }
      console.log('✅ Subscriber record created');

      /* -- Stripe checkout --------------------------------------------- */
      const resp = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const { url } = (await resp.json()) as { url: string | null };
      if (!url) throw new Error("No checkout URL.");
      window.location.href = url;
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
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
            <h2 className="text-center text-xl font-bold text-gray-900 mb-6">
              {isAppleUser ? "Complete Your Registration" : "Or create with email"}
            </h2>

            {isAppleUser && (
              <div className="mb-6 rounded-md bg-blue-50 p-4 border border-blue-200">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium text-blue-800">
                    Complete your registration to continue to checkout
                  </p>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                  placeholder="John Smith"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isAppleUser}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="you@example.com"
                />
                {isAppleUser && (
                  <p className="mt-1 text-xs text-gray-500">
                    Email from Apple ID (cannot be changed)
                  </p>
                )}
              </div>

              {/* Password - only for non-Apple users */}
              {!isAppleUser && (
                <div>
                  <label
                    htmlFor="password"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={passwordVisible ? "text" : "password"}
                      required
                      value={password}
                      onChange={handlePasswordChange}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                      placeholder="••••••••"
                      aria-describedby="password-requirements"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                      aria-label={passwordVisible ? "Hide password" : "Show password"}
                    >
                      {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <ul
                    id="password-requirements"
                    className="mt-2 list-none space-y-1 pl-0"
                  >
                    {PASSWORD_REQUIREMENTS.map((req) => {
                      const met = metRequirements.includes(req.id);
                      return (
                        <li
                          key={req.id}
                          className={`flex items-center text-xs ${
                            met ? "text-green-600" : "text-gray-500"
                          }`}
                        >
                          {met ? (
                            <CheckCircle2
                              size={14}
                              className="mr-1.5 flex-shrink-0"
                            />
                          ) : (
                            <XCircle size={14} className="mr-1.5 flex-shrink-0" />
                          )}
                          {req.message}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || (!isAppleUser && !allMet())}
                className="w-full rounded-lg bg-[#0c372b] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0c372b]/90 focus:outline-none focus:ring-2 focus:ring-[#0c372b] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Processing…" : "Continue to Checkout"}
              </button>
            </form>

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