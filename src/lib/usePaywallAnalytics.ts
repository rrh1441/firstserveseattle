import { useEffect, useRef } from "react";
import { logEvent } from "@/lib/logEvent";

export function usePaywallAnalytics(
  headlineGroup: string | null,
  gateDays: number,
): {
  markCTA: (plan: "monthly" | "annual") => void;
} {
  const openedAt = useRef<number>(performance.now());
  const sentDismiss = useRef(false);

  useEffect(() => {
    logEvent("paywall_open", { headlineGroup, gateDays });
    const handleBeforeUnload = () => {
      if (sentDismiss.current) return;
      sentDismiss.current = true;
      logEvent("paywall_dismiss", {
        headlineGroup,
        latencyMs: Math.round(performance.now() - openedAt.current),
      });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [headlineGroup, gateDays]);

  const markCTA = (plan: "monthly" | "annual") => {
    if (sentDismiss.current) return;
    sentDismiss.current = true; // avoid double log
    logEvent("paywall_cta_click", {
      plan,
      headlineGroup,
      latencyMs: Math.round(performance.now() - openedAt.current),
    });
  };

  return { markCTA };
}