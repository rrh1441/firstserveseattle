"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const planParam = searchParams.get("plan")
  const plan = planParam === "annual" ? "annual" : "monthly"

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
      // 1. Create the user in Supabase
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

      // 2. Upsert subscriber record to avoid duplicate entries
      const { error: subscriberError } = await supabase
        .from('subscribers')
        .upsert(
          {
            id: authData.user.id,
            email: email,
            full_name: fullName, // Insert full_name directly
            plan: plan,
            status: 'pending'
          },
          { onConflict: 'email' } // Ensure email is unique and handle conflicts
        )

      if (subscriberError) {
        console.error('Error upserting subscriber:', subscriberError)
        throw new Error(`Failed to upsert subscriber: ${subscriberError.message}`)
      }

      // 3. Create Stripe Checkout session
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-8">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Create your account</h2>
          <p className="text-sm text-gray-600">
            Sign up to start your {plan} subscription
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <div className="space-y-6">
          {/* Removed Google OAuth Button */}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="••••••••"
              />
              <p className="mt-2 text-xs text-gray-500">
                Password must be at least 6 characters and include uppercase, lowercase, and a number.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <svg className="mr-2 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}