"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Create your account and start your subscription</CardDescription>
        </CardHeader>
        <CardContent>
          {errorMsg && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-start">
          <p className="text-sm text-muted-foreground mb-4">
            You chose the <strong className="font-medium">{plan}</strong> plan.
          </p>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing up..." : "Sign Up & Pay"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

