"use client";

import { Card, CardContent } from "@/components/ui/card";

export default function DaysCounter({
  uniqueDays,
  gateDays,
}: {
  uniqueDays: number;
  gateDays: number;
}) {
  const remaining = gateDays - uniqueDays;
  const message =
    uniqueDays < gateDays
      ? `${remaining} free day${remaining === 1 ? "" : "s"} left`
      : "Free limit reached";

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardContent className="flex items-center justify-between gap-3 py-4">
        <span className="text-sm font-medium text-blue-800">{message}</span>
        <a href="/signup" className="rounded bg-[#0c372b] px-3 py-1 text-white">
          Get Unlimited Views
        </a>
      </CardContent>
    </Card>
  );
}
