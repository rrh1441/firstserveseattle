"use client"

import * as React from "react"
import { Check, Sparkles } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const features = [
  "Unlimited court searches",
  "Real-time availability updates",
  "Favorite court tracking",
  "Priority customer support"
]

export default function Paywall() {
  const [plan, setPlan] = React.useState("monthly")
  const [loading, setLoading] = React.useState(false)

  const prices = {
    monthly: 8,
    lifetime: 80
  }

  const valueProp = {
    monthly: "Less than the cost of one court reservation",
    lifetime: "Pay once, find free courts forever"
  }

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      // Mocked subscription logic
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Subscription clicked:', plan)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader className="text-center space-y-2">
        <CardTitle className="text-2xl font-bold">You've reached your free limit</CardTitle>
        <CardDescription className="text-base">
          Get unlimited access to all courts and features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ToggleGroup
          type="single"
          value={plan}
          onValueChange={(value) => value && setPlan(value)}
          className="justify-center"
        >
          <ToggleGroupItem value="monthly" className="px-6">
            Monthly
          </ToggleGroupItem>
          <ToggleGroupItem value="lifetime" className="px-6">
            Lifetime
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="text-center space-y-2">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">${prices[plan]}</span>
            <span className="text-muted-foreground">
              {plan === "monthly" ? "/month" : " one-time"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{valueProp[plan]}</p>
        </div>

        <div className="space-y-2 rounded-lg bg-muted/50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            Everything you get:
          </div>
          <ul className="grid gap-2 text-sm">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? "Processing..." : "Get Started Now"}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Secure payment powered by Stripe. Cancel anytime.
        </p>
      </CardContent>
    </Card>
  )
}

