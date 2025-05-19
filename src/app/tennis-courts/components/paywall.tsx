"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { PlanSelector } from "@/components/PlanSelector";
import { logEvent } from "@/lib/logEvent";
import { shouldShowPaywall } from "@/lib/shouldShowPaywall";

const features = [
  "See today's availability for ALL public courts",
  "Filter courts by lights, pickleball lines, hitting walls",
  "Save your favorite courts for quick access",
  "Unlimited court views",
  "Priority customer support",
];

const headlines = [
  { group: "A", text: "Stop guessing, start playing!" },
  { group: "B", text: "Never drive to a full court again!" },
];

export default function PaywallPage() {
  const [canShow, setCanShow] = useState<boolean | null>(null);
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  const [assignedHeadline, setAssignedHeadline] = useState<{
    group: string;
    text: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    shouldShowPaywall()
      .then((result) => {
        if (mounted) setCanShow(result);
      })
      .catch(() => {
        if (mounted) setCanShow(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!canShow) return;
    const randomIndex = Math.random() < 0.5 ? 0 : 1;
    const selectedHeadline = headlines[randomIndex];
    setAssignedHeadline(selectedHeadline);

    logEvent("view_paywall", {
      headlineGroup: selectedHeadline.group,
    });
  }, [canShow]);

  const handleSubscribeClick = () => {
    logEvent("click_subscribe_cta", {
      plan,
      headlineGroup: assignedHeadline?.group ?? null,
    });
  };

  if (canShow !== true) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-white p-4">
      <Card className="w-full max-w-md border border-gray-200 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">
            {assignedHeadline
              ? assignedHeadline.text
              : "You've reached your free limit"}
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            Start your <span className="font-semibold">14-day free trial</span>{" "}
            — no payment due today.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <PlanSelector
            selectedPlan={plan}
            onPlanSelect={setPlan}
            features={features}
          />

          <Link
            href={`/signup?plan=${plan}${
              assignedHeadline ? `&headline_group=${assignedHeadline.group}` : ""
            }`}
            onClick={handleSubscribeClick}
            className="w-full block text-center bg-[#0c372b] text-white py-3 text-lg font-semibold rounded-md hover:bg-[#0c372b]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0c372b] focus:ring-offset-2"
          >
            {plan === "monthly"
              ? "Start Free Trial – Monthly"
              : "Start Free Trial – Annual"}
          </Link>

          <p className="text-xs text-center text-gray-500">
            Secure payment powered by Stripe. Cancel anytime.
          </p>

          <div className="text-center mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              Already subscribed?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:underline"
              >
                Sign in here
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Need help?{" "}
              <a
                href="mailto:support@firstserveseattle.com"
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
