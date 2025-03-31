// src/app/signup/page.tsx
"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Image from "next/image";
import Link from "next/link";
import { PlanSelector } from "@/components/PlanSelector";
import { Eye, EyeOff } from 'lucide-react';

const features = [ // Keep features consistent with Paywall
  "See today's availability for ALL public courts",
  "Filter courts by lights, pickleball lines, hitting walls",
  "Save your favorite courts for quick access",
  "Unlimited court views",
  "Priority customer support",
];

// Define the specific type for the plan state
type PlanType = "monthly" | "annual";

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const initialPlanParam = searchParams.get("plan")
  const headlineGroupParam = searchParams.get("headline_group");

  // Explicitly type the useState hook
  const [plan, setPlan] = useState<PlanType>(initialPlanParam === "annual" ? "annual" : "monthly");

  const supabase = createClientComponentClient()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Password requirements (keep for validation logic)
   const passwordRequirements = [
     { regex: /.{6,}/, message: "At least 6 characters" },
     { regex: /[a-z]/, message: "At least one lowercase letter" },
     { regex: /[A-Z]/, message: "At least one uppercase letter" },
     { regex: /\d/, message: "At least one digit" },
     // Add symbol requirement if needed: { regex: /[!@#$%^&*(),.?":{}|<>]/, message: "At least one symbol" }
   ]

   const validatePassword = (pwd: string): string[] => {
     return passwordRequirements
       .filter(req => !req.regex.test(pwd))
       .map(req => req.message)
   }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg("")

    const pwdErrors = validatePassword(password)
    if (pwdErrors.length > 0) {
       // More user-friendly display of errors
       setErrorMsg(`Password needs: ${pwdErrors.join(", ")}.`);
      setLoading(false)
      return
    }

    try {
      // 1. Sign up the user with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })

      if (authError) throw new Error(`Sign-up failed: ${authError.message}`)
      if (!authData.user) throw new Error("No user returned after sign-up.")

      // === Datafast Signup Tracking ===
      if (window && typeof window.datafast === 'function') {
        window.datafast("signup", { email: email });
        console.log("Datafast signup event tracked for:", email);
      } else {
        console.warn("Datafast function not found on window object.");
      }
      // ===========================================

      // 2. Upsert subscriber record
      const { error: subscriberError } = await supabase
        .from('subscribers')
        .upsert(
          {
            id: authData.user.id,
            email: email,
            full_name: fullName,
            plan: plan, // Store the intended plan
            status: 'pending',
             created_at: new Date().toISOString(),
             updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        )

      if (subscriberError) {
        console.error('Error upserting subscriber record:', subscriberError);
      }

      // 3. Create Stripe checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan }),
      })

      if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Creating checkout session failed: ${errorText}`)
        }

      const { url } = await response.json()
      if (!url) throw new Error("No checkout URL received from server.")

      // --- Optional: Track conversion intention ---
       if (window && typeof window.datafast === 'function') {
        window.datafast('event', {
            name: 'InitiateCheckout',
            properties: {
                plan: plan,
                paywall_headline_group: headlineGroupParam,
                email: email
            }
        });
        console.log("Datafast InitiateCheckout event tracked.");
      }
      // -----------------------------------------


      // 4. Redirect user to Stripe checkout
      window.location.href = url

    } catch (err) {
      console.error('Signup or Checkout Error:', err)
      setErrorMsg(err instanceof Error ? err.message : "An unknown error occurred during signup.")
      setLoading(false)
    }
  }

   const togglePasswordVisibility = () => {
     setPasswordVisible(!passwordVisible);
   };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-4 py-12 sm:py-16">
       {/* Logo */}
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
             <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 mb-2">Choose Your Plan</h2>
             <p className="text-center text-sm text-gray-600 mb-8">Select the plan that works best for you.</p>

            {/* Render PlanSelector Here */}
            <div className="mb-10">
                 <PlanSelector
                   selectedPlan={plan} // This now passes the correctly typed state
                   onPlanSelect={setPlan}
                   features={features}
                 />
            </div>

             {/* Separator */}
             <hr className="my-8 border-gray-200" />

             <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 mb-6">Create Your Account</h2>

            {errorMsg && (
              <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-600/10 border border-red-200">
                {errorMsg}
              </div>
            )}

             {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                     <input
                       id="password"
                       type={passwordVisible ? "text" : "password"}
                       required
                       value={password}
                       onChange={(e) => setPassword(e.target.value)}
                       className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200 pr-10" // Added padding-right
                       placeholder="••••••••"
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
                <p className="mt-2 text-xs text-gray-500">
                  Min 6 chars, uppercase, lowercase, number.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#0c372b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0c372b]/90 focus:outline-none focus:ring-2 focus:ring-[#0c372b] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <svg className="mr-2 inline h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {loading ? "Processing..." : `Create Account & Proceed to Payment`}
              </button>
            </form>

            {/* Sign In and Support Links */}
            <div className="mt-6 text-center text-sm text-gray-600 space-y-1">
                 <p>
                   Already have an account?{" "}
                   <Link href="/login" className="font-medium text-blue-600 hover:underline">
                     Sign In
                   </Link>
                 </p>
                 <p>
                   Need help?{" "}
                   <a href="mailto:support@firstserveseattle.com" className="font-medium text-blue-600 hover:underline">
                     Contact support
                   </a>
                 </p>
             </div>
               <p className="mt-6 text-xs text-center text-gray-500">
                By creating an account, you agree to our <Link href="/terms-of-service" className="underline hover:text-gray-700">Terms of Service</Link> and <Link href="/privacy-policy" className="underline hover:text-gray-700">Privacy Policy</Link>. Secure payment via Stripe.
              </p>
          </div>
        </div>
      </div>
    </div>
  )
}