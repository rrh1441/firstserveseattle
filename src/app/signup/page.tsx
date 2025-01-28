"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const planParam = searchParams.get("plan")
  const plan = planParam === "annual" ? "annual" : "monthly" // fallback

  const supabase = createClientComponentClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg("")

    try {
      // 1. Create the user in Supabase
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        throw new Error(`Sign-up failed: ${error.message}`)
      }
      if (!data.user) {
        throw new Error("No user returned after sign-up.")
      }

      // 2. Create Stripe Checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const { url } = (await response.json()) as { url?: string }
      if (!url) {
        throw new Error("No checkout URL received.")
      }

      // 3. Redirect to Stripe
      window.location.href = url
    } catch (err: unknown) {
      let message = "Unknown error."
      if (err instanceof Error) {
        message = err.message
      }
      setErrorMsg(message)
      setLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true)
    setErrorMsg("")

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Redirect back to the signup page after authentication
          redirectTo: window.location.origin + "/",
        },
      })

      if (error) {
        throw new Error(`Google sign-in failed: ${error.message}`)
      }
    } catch (err: unknown) {
      let message = "Unknown error."
      if (err instanceof Error) {
        message = err.message
      }
      setErrorMsg(message)
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold mb-2">Sign Up</h2>
        <p className="text-gray-600 mb-6">Create your account and start your subscription</p>
        {errorMsg && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{errorMsg}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            You chose the <strong className="font-medium">{plan}</strong> plan.
          </p>
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up & Pay"}
          </button>
        </form>
        <div className="mt-6">
          <div className="flex items-center">
            <hr className="flex-grow border-gray-300" />
            <span className="mx-2 text-gray-500">OR</span>
            <hr className="flex-grow border-gray-300" />
          </div>
          <button
            onClick={handleGoogleSignIn}
            className="w-full mt-4 flex items-center justify-center bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? "Signing in with Google..." : "Sign Up with Google"}
          </button>
        </div>
      </div>
    </div>
  )
}