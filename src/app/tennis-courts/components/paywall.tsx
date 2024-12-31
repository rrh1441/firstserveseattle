// src/app/tennis-courts/components/paywall.tsx

"use client"

import React, { useState } from "react"
import { Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  "Unlimited court searches",
  "Real-time availability updates",
  "Favorite court tracking",
  "Priority customer support",
]

const prices = {
  monthly: 8,
  lifetime: 80,
}

const valueProp = {
  monthly: "Less than the cost of one court reservation",
  lifetime: "Pay once, find free courts forever",
}

export default function Paywall() {
  const [plan, setPlan] = useState<"monthly" | "lifetime">("monthly")
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      // Add your subscription logic here (e.g., redirect to Stripe Checkout)
      console.log("Subscribing to plan:", plan)
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
              onClick={() => setPlan("lifetime")}
              className={`px-4 py-2 rounded-md font-semibold text-sm ${
                plan === "lifetime"
                  ? "bg-gray-100 text-black"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              Lifetime
            </button>
          </div>

          {/* Pricing display */}
          <div className="text-center space-y-2">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold">${prices[plan]}</span>
              <span className="text-gray-500">
                {plan === "monthly" ? "/month" : " one-time"}
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
