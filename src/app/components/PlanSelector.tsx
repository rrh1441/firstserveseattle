// src/app/components/PlanSelector.tsx
"use client";

import React from "react";
import { Check, Sparkles } from "lucide-react";
// Removed unused imports: Card, CardContent, CardDescription, CardHeader, CardTitle, Button
import { cn } from "@/lib/utils"; // Utility for class names

interface PlanSelectorProps {
  selectedPlan: "monthly" | "annual";
  onPlanSelect: (plan: "monthly" | "annual") => void;
  features: string[];
}

const prices = {
  monthly: 8,
  annual: 64, // $64 / 12 = $5.33/month (approx 33% saving vs $8)
};

const valueProp = {
    monthly: "Ideal for trying it out.",
    annual: "Best value - Save 33%!",
  };


export function PlanSelector({ selectedPlan, onPlanSelect, features }: PlanSelectorProps) {

  const isMonthly = selectedPlan === "monthly";
  const isAnnual = selectedPlan === "annual";

  return (
    <div className="space-y-6">
      {/* Plan selection Tabs/Buttons */}
      <div className="flex justify-center rounded-md border border-input bg-gray-100 p-1 shadow-sm">
        <button
          onClick={() => onPlanSelect("monthly")}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isMonthly ? "bg-white text-black shadow" : "text-gray-600 hover:bg-white/50 hover:text-black"
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => onPlanSelect("annual")}
           className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isAnnual ? "bg-white text-black shadow" : "text-gray-600 hover:bg-white/50 hover:text-black"
          )}
        >
          Annual <span className="ml-1 hidden sm:inline">(Save 33%)</span>
        </button>
      </div>

      {/* Pricing display */}
      <div className="text-center space-y-2">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold">${prices[selectedPlan]}</span>
          <span className="text-gray-500">
            {isMonthly ? "/month" : "/year"}
          </span>
        </div>
         <p className="text-sm font-semibold text-[#0c372b]">
           {isAnnual && `$${(prices.annual / 12).toFixed(2)} / month`}
           {isMonthly && `Just $${prices.monthly} for unlimited access`}
        </p>
         {/* Display 50% off notice ONLY for monthly */}
         {isMonthly && (
            <p className="text-sm text-orange-600 font-medium">
              🎉 Special Offer: 50% off your first month! (Applied automatically)
            </p>
          )}
        <p className="text-sm text-gray-600">{valueProp[selectedPlan]}</p>
      </div>

      {/* Features */}
      <div className="space-y-3 rounded-lg bg-gray-50 p-4 border">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          What you get:
        </div>
        <ul className="grid gap-2 text-sm text-gray-700">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}