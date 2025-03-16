"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const features = [
  "Unlimited court searches",
  "Favorite court tracking",
  "Priority customer support",
];

const prices = {
  monthly: 8,
  annual: 64,
};

const valueProp = {
  monthly: "Less than the cost of one court reservation",
  annual: "Find free courts for a year",
};

export default function PaywallPage() {
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <Card className="w-full max-w-md border border-gray-200 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">You’ve reached your free limit</CardTitle>
          <CardDescription className="text-base text-gray-600">
            Get unlimited access to all courts and features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan selection */}
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

          {/* Features */}
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

          {/* CTA: sends user to /signup with ?plan=xxx */}
          <Link
            href={`/signup?plan=${plan}`}
            className="w-full block text-center bg-black text-white py-2 text-lg rounded-md hover:bg-gray-800"
          >
            Create Account and Subscribe
          </Link>

          <p className="text-xs text-center text-gray-500 mt-4">
            Secure payment powered by Stripe. Cancel anytime.
          </p>

          {/* Already subscribed? Sign in */}
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Already subscribed?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>

          {/* Email support link */}
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Need help?{" "}
              <a
                href="mailto:support@yourdomain.com"
                className="font-semibold text-blue-600 hover:underline"
              >
                Contact support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}