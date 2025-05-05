// src/app/signup/page.tsx
"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Image from "next/image"
import Link from "next/link"
import { PlanSelector } from "@/components/PlanSelector"
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react"

const features = [
  "See today's availability for ALL public courts",
  "Filter courts by lights, pickleball lines, hitting walls",
  "Save your favorite courts for quick access",
  "Unlimited court views",
  "Priority customer support",
]

type PlanType = "monthly" | "annual"

interface PasswordRequirement { id: string; regex: RegExp; message: string }

const passwordRequirements: PasswordRequirement[] = [
  { id: "length",    regex: /.{6,}/,  message: "At least 6 characters" },
  { id: "lowercase", regex: /[a-z]/,  message: "At least one lowercase letter" },
  { id: "uppercase", regex: /[A-Z]/,  message: "At least one uppercase letter" },
  { id: "digit",     regex: /\d/,     message: "At least one digit" },
]

export default function SignUpPage() {
  const searchParams            = useSearchParams()
  const initialPlanParam        = searchParams.get("plan")
  const _headlineGroupParam     = searchParams.get("headline_group")
  const _offerParam             = searchParams.get("offer")
  /* reference once so ESLint sees them used */
  void _headlineGroupParam; void _offerParam;

  const [plan, setPlan]         = useState<PlanType>(
    initialPlanParam === "annual" ? "annual" : "monthly",
  )

  const supabase = createClientComponentClient()
  const [fullName, setFullName] = useState("")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading]   = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [metRequirements, setMetRequirements] = useState<string[]>([])

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pw = e.target.value
    setPassword(pw)
    setMetRequirements(
      passwordRequirements.filter(r => r.regex.test(pw)).map(r => r.id),
    )
  }

  const allMet = () =>
    passwordRequirements.every(r => metRequirements.includes(r.id))

  /* ---------- create fresh Checkout session on plan toggle ---------- */
  async function handlePlanChange(newPlan: PlanType) {
    setPlan(newPlan)
    if (!email) return
    const resp = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, plan: newPlan }),
    })
    if (resp.ok) {
      const { url } = (await resp.json()) as { url: string | null }
      if (url) window.location.href = url
    }
  }

  /* ---------- submit signup ---------- */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg("")
    if (!allMet()) {
      setErrorMsg("Password does not meet all requirements.")
      return
    }
    setLoading(true)
    try {
      const { data, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (authErr) throw new Error(authErr.message)
      if (!data.user) throw new Error("No user returned after sign-up.")

      await supabase.from("subscribers").upsert(
        {
          id: data.user.id,
          email,
          full_name: fullName,
          plan,
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" },
      )

      const resp = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan }),
      })
      if (!resp.ok) throw new Error(await resp.text())
      const { url } = (await resp.json()) as { url: string | null }
      if (!url) throw new Error("No checkout URL.")
      window.location.href = url
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible)

  /* ---------------------------- JSX ---------------------------- */
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
            <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 mb-2">
              Choose Your Plan
            </h2>
            <p className="text-center text-sm text-gray-600 mb-8">
              Select the plan that works best for you.
            </p>

            {/* Plan selector */}
            <div className="mb-10">
              <PlanSelector
                selectedPlan={plan}
                onPlanSelect={handlePlanChange}
                features={features}
              />
            </div>

            <hr className="my-8 border-gray-200" />

            <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 mb-6">
              Create Your Account
            </h2>

            {errorMsg && (
              <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-600/10 border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                  placeholder="John Smith"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password */}
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
                    onChange={handlePasswordChange}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200 pr-10"
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

                {/* Live password requirements */}
                <ul id="password-requirements" className="mt-2 space-y-1 list-none pl-0">
                  {passwordRequirements.map(req => {
                    const met = metRequirements.includes(req.id)
                    return (
                      <li key={req.id} className={`flex items-center text-xs ${met ? "text-green-600" : "text-gray-500"}`}>
                        {met ? (
                          <CheckCircle2 size={14} className="mr-1.5 flex-shrink-0" />
                        ) : (
                          <XCircle size={14} className="mr-1.5 flex-shrink-0" />
                        )}
                        {req.message}
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !allMet()}
                className="w-full rounded-lg bg-[#0c372b] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0c372b]/90 focus:outline-none focus:ring-2 focus:ring-[#0c372b] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Processing..." : "Create Account & Proceed to Payment"}
              </button>
            </form>

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
              By creating an account, you agree to our{" "}
              <Link href="/terms-of-service" className="underline hover:text-gray-700">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="underline hover:text-gray-700">
                Privacy Policy
              </Link>
              . Secure payment via Stripe.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
