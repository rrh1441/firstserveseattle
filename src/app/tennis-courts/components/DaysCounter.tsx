/* src/app/tennis-courts/components/DaysCounter.tsx */
import { Card, CardContent } from "@/components/ui/card";

export default function DaysCounter({
  uniqueDays,
  gateDays,
}: {
  uniqueDays: number;
  gateDays: number;
}) {
  const remaining = Math.max(0, gateDays - uniqueDays);
  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardContent className="flex items-center justify-between gap-3 py-4">
        <span className="text-sm font-medium text-blue-800">
          {remaining > 0
            ? `${remaining} free day${remaining === 1 ? "" : "s"} left`
            : `Free limit reached`}
        </span>
        <a
          href="/signup"
          className="rounded bg-[#0c372b] px-3 py-1 text-white"
        >
          Get Unlimited
        </a>
      </CardContent>
    </Card>
  );
}