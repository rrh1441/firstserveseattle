// src/app/components/PlanSelector.tsx
"use client";

import React from "react";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
interface PlanSelectorProps {
  selectedPlan: "monthly" | "annual";
  onPlanSelect: (plan: "monthly" | "annual") => void;
  features: string[];
  assignedOffer?: { id: string; discount?: { percentage: number } } | null;
}

const prices = { monthly: 8, annual: 64 };

export function PlanSelector({
  selectedPlan,
  onPlanSelect,
  features,
  assignedOffer,
}: PlanSelectorProps) {
  const isMonthly = selectedPlan === "monthly";
  const isAnnual  = selectedPlan === "annual";

  return (
    <div className="space-y-6">
      {/* Plan toggle */}
      <div className="flex justify-center rounded-md border border-input bg-gray-100 p-1 shadow-sm">
        <button
          onClick={() => onPlanSelect("monthly")}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isMonthly
              ? "bg-white text-black shadow"
              : "text-gray-600 hover:bg-white/50 hover:text-black",
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => onPlanSelect("annual")}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isAnnual
              ? "bg-white text-black shadow"
              : "text-gray-600 hover:bg-white/50 hover:text-black",
          )}
        >
          Annual <span className="ml-1 hidden sm:inline">(Save 33%)</span>
        </button>
      </div>

      {/* Price display */}
      <div className="text-center space-y-2">
        {assignedOffer?.discount && selectedPlan === 'monthly' ? (
          <>
            {/* Show discounted pricing for monthly only */}
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-3xl font-bold line-through decoration-2 decoration-gray-400">
                ${prices[selectedPlan]}
              </span>
              <span className="text-3xl font-bold text-green-700">
                ${assignedOffer.discount.percentage === 50 
                  ? Math.round(prices[selectedPlan] * 0.5) 
                  : prices[selectedPlan]
                } first month
              </span>
            </div>
            <p className="text-sm font-semibold text-[#0c372b]">
              {assignedOffer.discount.percentage}% off your first month, then ${prices[selectedPlan]} / month
            </p>
          </>
        ) : isAnnual ? (
          <>
            {/* Show annual pricing with discount appearance */}
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-3xl font-bold line-through decoration-2 decoration-gray-400">
                $96
              </span>
              <span className="text-3xl font-bold text-[#0c372b]">
                ${prices.annual}
              </span>
            </div>
            <p className="text-sm font-semibold text-[#0c372b]">
              $${(prices.annual / 12).toFixed(2)} / month billed annually
            </p>
          </>
        ) : (
          <>
            {/* Show monthly pricing */}
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-3xl font-bold text-[#0c372b]">
                ${prices.monthly}
              </span>
            </div>
            <p className="text-sm font-semibold text-[#0c372b]">
              ${prices.monthly} / month
            </p>
          </>
        )}

        <p className="text-sm text-gray-600">
          {isAnnual
            ? "Best value – save 33 %."
            : "Start now, cancel anytime."}
        </p>
      </div>

      {/* Feature list */}
      <div className="space-y-3 rounded-lg bg-gray-50 p-4 border">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          What you get:
        </div>
        <ul className="grid gap-2 text-sm text-gray-700">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
