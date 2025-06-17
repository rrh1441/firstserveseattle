import { useEffect, useRef } from "react";
import { logEvent } from "@/lib/logEvent";
import { PaywallAnalytics } from "@/lib/eventLogging";

export function usePaywallAnalytics(
  headlineGroup: string | null,
  gateDays: number,
): {
  markCTA: (plan: "monthly" | "annual") => void;
} {
  const openedAt = useRef<number>(performance.now());
  const sentDismiss = useRef(false);

  useEffect(() => {
    // Enhanced paywall tracking
    PaywallAnalytics.trackPaywallHit();
    
    // Also track the specific headline experiment
    logEvent("paywall_open", { 
      headlineGroup, 
      gateDays,
      // Add additional context for better analysis
      uniqueDays: JSON.parse(localStorage.getItem('fss_days') ?? '[]').length,
      daysUntilPaywall: Math.max(0, gateDays - JSON.parse(localStorage.getItem('fss_days') ?? '[]').length),
      userJourneyStage: 'paywall_hit',
    });
    
    const handleBeforeUnload = () => {
      if (sentDismiss.current) return;
      sentDismiss.current = true;
      
      const latencyMs = Math.round(performance.now() - openedAt.current);
      
      logEvent("paywall_dismiss", {
        headlineGroup,
        gateDays,
        latencyMs,
        // Enhanced dismiss tracking
        dismissType: latencyMs < 3000 ? 'immediate' : latencyMs < 10000 ? 'quick' : 'considered',
        uniqueDays: JSON.parse(localStorage.getItem('fss_days') ?? '[]').length,
        userJourneyStage: 'paywall_hit',
      });
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [headlineGroup, gateDays]);

  const markCTA = (plan: "monthly" | "annual") => {
    if (sentDismiss.current) return;
    sentDismiss.current = true; // avoid double log
    
    const latencyMs = Math.round(performance.now() - openedAt.current);
    const uniqueDays = JSON.parse(localStorage.getItem('fss_days') ?? '[]').length;
    
    logEvent("paywall_cta_click", {
      plan,
      headlineGroup,
      latencyMs,
      gateDays,
      uniqueDays,
      // Enhanced CTA tracking
      clickSpeed: latencyMs < 5000 ? 'immediate' : latencyMs < 15000 ? 'quick' : 'deliberate',
      userJourneyStage: 'conversion',
      conversionIntent: 'subscribing',
      daysUntilPaywall: Math.max(0, gateDays - uniqueDays),
    });
  };

  return { markCTA };
}