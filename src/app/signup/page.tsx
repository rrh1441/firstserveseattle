"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const initialPlanParam = searchParams.get("plan")
  const [plan, setPlan] = useState(initialPlanParam === "annual" ? "annual" : "monthly")

  const supabase = createClientComponentClient()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const passwordRequirements = [
    { regex: /.{6,}/, message: "At least 6 characters" },
    { regex: /[a-z]/, message: "At least one lowercase letter" },
    { regex: /[A-Z]/, message: "At least one uppercase letter" },
    { regex: /\d/, message: "At least one digit" },
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
      setErrorMsg(`Password must have: ${pwdErrors.join(", ")}.`)
      setLoading(false)
      return
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            plan: plan
          }
        }
      })
      
      if (authError) throw new Error(`Sign-up failed: ${authError.message}`)
      if (!authData.user) throw new Error("No user returned after sign-up.")

      const { error: subscriberError } = await supabase
        .from('subscribers')
        .upsert(
          {
            id: authData.user.id,
            email: email,
            full_name: fullName,
            plan: plan,
            status: 'pending'
          },
          { onConflict: 'email' }
        )

      if (subscriberError) {
        console.error('Error upserting subscriber:', subscriberError)
        throw new Error(`Failed to upsert subscriber: ${subscriberError.message}`)
      }

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })

      if (!response.ok) throw new Error(await response.text())

      const { url } = await response.json()
      if (!url) throw new Error("No checkout URL received.")

      window.location.href = url
    } catch (err) {
      console.error('Signup error:', err)
      setErrorMsg(err instanceof Error ? err.message : "Unknown error.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-4 py-16">
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-gray-100">
          <div className="bg-[#0c372b] px-8 py-6 text-white">
            <h2 className="text-3xl font-bold tracking-tight">Create account</h2>
            <p className="mt-2 text-blue-100">
              Get started with your {plan === "annual" ? "annual" : "monthly"} subscription
            </p>
          </div>

          <div className="p-8">
            {errorMsg && (
              <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-600/10">
                {errorMsg}
              </div>
            )}

            <div className="mb-8">
              <button
                type="button"
                onClick={() => setPlan(plan === "monthly" ? "annual" : "monthly")}
                className="w-full rounded-lg bg-[#92d250] px-4 py-3 text-lg font-bold text-white shadow-sm transition-all hover:bg-[#0c372b]/90 focus:outline-none focus:ring-2 focus:ring-[#0c372b] focus:ring-offset-2"
              >
                {plan === "monthly" ? "Switch to Annual and Save 33%" : "Switch to Monthly"}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-2 block w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 block w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 block w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="••••••••"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Must include uppercase, lowercase, number and be at least 6 characters.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full rounded-lg bg-[#0c372b] px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#0c372b]/90 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <svg className="mr-2 inline h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {loading ? "Creating your account..." : "Create account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}