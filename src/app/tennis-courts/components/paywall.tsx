"use client";

import React from "react";
import { Check, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  "Unlimited court searches",
  "Favorite court tracking",
  "Priority customer support",
];

export default function Paywall() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <Card className="w-full max-w-md border border-gray-200 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold">Paywall</CardTitle>
          <CardDescription className="text-base text-gray-600">
            Access to this site is currently restricted. Please check back later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Features */}
          <div className="space-y-2 rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              Benefits of Subscribing:
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
          <div className="text-center text-sm text-gray-500 mt-4">
            Subscription options will be available soon.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
