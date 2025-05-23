"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  uniqueDays: number;
  gateDays: number;
}

const ordinal = (n: number) =>
  ["First", "Second", "Third"][n - 1] ?? `${n}th`;

export default function DaysCounter({ uniqueDays, gateDays }: Props) {
  const currentOrdinal = ordinal(Math.min(uniqueDays + 1, gateDays));
  const remaining = Math.max(0, gateDays - (uniqueDays + 1));
  const text =
    uniqueDays < gateDays
      ? `${currentOrdinal} Free Court Check – ${remaining} Remaining`
      : `You've used all ${gateDays} free days`;

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 py-4">
        <div className="flex items-center gap-2">
          <span role="img" aria-label="Tennis ball icon" className="text-xl">
            🎾
          </span>
          <span className="text-sm font-medium text-blue-800">{text}</span>
        </div>
        <Button
          asChild
          size="sm"
          className="bg-[#0c372b] hover:bg-[#0c372b]/90 text-white w-full sm:w-auto"
        >
          <a href="/signup">Get Unlimited Checks</a>
        </Button>
      </CardContent>
    </Card>
  );
}