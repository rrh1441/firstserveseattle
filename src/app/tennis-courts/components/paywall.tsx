// src/app/tennis-courts/components/paywall.tsx

"use client"

import React, { useState } from "react"
import { Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// If you need user info from Supabase:
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

const supabase = createClientComponentClient()

const features = [
  "Unlimited court searches",
  "Favorite court tracking",
  "Priority customer support",
]

const prices = {
  monthly: 8,
  annual: 64,
}

const valueProp = {
  monthly: "Less than the cost of one court reservation",
  annual: "Find free courts for a year",
}

export default function Paywall() {
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly")
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      // (Optional) If you need the user ID from Supabase Auth:
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        // If no user is logged in, you can redirect to login or show a message
        alert("You must be logged in to subscribe.")
        return
      }

      // Call the create-checkout-session endpoint
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          user_id: session.user.id, // from Supabase session
        }),
      })

      const data = await response.json()
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        console.error("No checkout URL returned:", data)
        alert("Failed to create checkout session.")
      }
    } catch (error) {
      console.error("Error subscribing:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <Card className="w-full max-w-md border border-gray-200 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">You&#39;ve reached your free limit</CardTitle>
          <CardDescription className="text-base text-gray-600">
            Get unlimited access to all courts and features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle group for plan selection */}
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setPlan("monthly")}
              className={`px-4 py-2 rounded-md font-semibold text-sm ${
                plan === "monthly"
                  ? "bg-gray-100 text-black"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPlan("annual")}
              className={`px-4 py-2 rounded-md font-semibold text-sm ${
                plan === "annual"
                  ? "bg-gray-100 text-black"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              Annual
            </button>
          </div>

          {/* Pricing display */}
          <div className="text-center space-y-2">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold">${prices[plan]}</span>
              <span className="text-gray-500">
                {plan === "monthly" ? "/month" : "/year"}
              </span>
            </div>
            <p className="text-sm text-gray-600">{valueProp[plan]}</p>
          </div>

          {/* Feature list */}
          <div className="space-y-2 rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              Everything you get:
            </div>
            <ul className="grid gap-2 text-sm">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Subscribe button */}
          <Button
            className="w-full bg-black text-white py-2 text-lg rounded-md hover:bg-gray-800"
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? "Processing..." : "Get Started Now"}
          </Button>

          <p className="text-xs text-center text-gray-500 mt-4">
            Secure payment powered by Stripe. Cancel anytime.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
