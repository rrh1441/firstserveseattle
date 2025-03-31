// src/app/tennis-courts/components/paywall.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { PlanSelector } from "@/components/PlanSelector"; // Import the new component

const features = [
  "See today's availability for ALL public courts",
  "Filter courts by lights, pickleball lines, hitting walls",
  "Save your favorite courts for quick access",
  "Unlimited court views",
  "Priority customer support",
];

// A/B Test Headlines
const headlines = [
    { group: 'A', text: "Stop guessing, start playing!" },
    { group: 'B', text: "Never drive to a full court again!" }
];

export default function PaywallPage() {
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  const [assignedHeadline, setAssignedHeadline] = useState<{ group: string; text: string } | null>(null);

  useEffect(() => {
    // Assign headline randomly on mount
    const randomIndex = Math.random() < 0.5 ? 0 : 1;
    const selectedHeadline = headlines[randomIndex];
    setAssignedHeadline(selectedHeadline);

    // --- A/B Test Tracking ---
    // You need to implement the actual tracking logic here.
    // This might involve sending an event to Datafast (or your analytics tool)
    // indicating which headline group this user/session was assigned.
    // Example (conceptual):
    if (window && typeof window.datafast === 'function') {
       // Send an 'exposure' event - you might call it something else
       // Ideally, only send this once per session or user exposure.
       // You might need more sophisticated logic to prevent repeated sends.
       // window.datafast('event', { name: 'PaywallHeadlineExposure', properties: { paywall_headline_group: selectedHeadline.group } });
       console.log(`Assigned to Paywall Headline Group: ${selectedHeadline.group}`);
    }
    // -------------------------

  }, []); // Empty dependency array ensures this runs only once on mount


  return (
    <div className="flex items-center justify-center min-h-screen bg-white p-4">
      <Card className="w-full max-w-md border border-gray-200 shadow-lg">
        <CardHeader className="text-center space-y-2">
           {/* A/B Tested Headline */}
           <CardTitle className="text-2xl font-bold">
             {assignedHeadline ? assignedHeadline.text : "You've reached your free limit"}
           </CardTitle>
          <CardDescription className="text-base text-gray-600">
            Get unlimited access to all courts and features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Use the PlanSelector component */}
          <PlanSelector
            selectedPlan={plan}
            onPlanSelect={setPlan}
            features={features}
          />

          {/* CTA: sends user to /signup with ?plan=xxx */}
          <Link
             href={`/signup?plan=${plan}${assignedHeadline ? `&headline_group=${assignedHeadline.group}` : ''}`} // Pass headline group if needed later
            className="w-full block text-center bg-[#0c372b] text-white py-3 text-lg font-semibold rounded-md hover:bg-[#0c372b]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0c372b] focus:ring-offset-2"
          >
            Choose {plan === 'monthly' ? 'Monthly' : 'Annual'} & Create Account
          </Link>

          <p className="text-xs text-center text-gray-500">
            Secure payment powered by Stripe. Cancel anytime.
          </p>

          {/* Combined subscription/sign-in and support links */}
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