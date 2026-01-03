'use client';

import { useState, useEffect, useCallback } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import type { EligibilityResponse } from '@/app/api/email-alerts/check-eligibility/route';

interface TrialEligibilityState {
  // Loading state
  isLoading: boolean;
  // Fingerprint
  fingerprint: string | null;
  // Eligibility for email capture (free trial)
  isEligibleForTrial: boolean;
  // Reason if not eligible
  ineligibilityReason: EligibilityResponse['reason'] | null;
  // Re-check eligibility (e.g., after a failed attempt)
  recheckEligibility: () => Promise<void>;
}

export function useTrialEligibility(): TrialEligibilityState {
  const [isLoading, setIsLoading] = useState(true);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [isEligibleForTrial, setIsEligibleForTrial] = useState(true);
  const [ineligibilityReason, setIneligibilityReason] = useState<EligibilityResponse['reason'] | null>(null);

  const checkEligibility = useCallback(async (fp: string | null) => {
    try {
      const response = await fetch('/api/email-alerts/check-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint: fp }),
      });

      if (response.ok) {
        const data: EligibilityResponse = await response.json();
        setIsEligibleForTrial(data.eligible);
        setIneligibilityReason(data.reason || null);
      }
    } catch (error) {
      console.error('Failed to check eligibility:', error);
      // Fail open - allow trial attempt
      setIsEligibleForTrial(true);
    }
  }, []);

  const recheckEligibility = useCallback(async () => {
    await checkEligibility(fingerprint);
  }, [fingerprint, checkEligibility]);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // Load fingerprint
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const visitorId = result.visitorId;

        if (!mounted) return;
        setFingerprint(visitorId);

        // Check eligibility with fingerprint
        await checkEligibility(visitorId);
      } catch (error) {
        console.error('Failed to initialize fingerprint:', error);
        // Still check eligibility without fingerprint (IP-only)
        await checkEligibility(null);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [checkEligibility]);

  return {
    isLoading,
    fingerprint,
    isEligibleForTrial,
    ineligibilityReason,
    recheckEligibility,
  };
}
