/* -------------------------------------------------------------------------- *
   shouldShowPaywall()
   --------------------------------------------------------------------------
   • First checks for email extension (7-day trial from email capture)
   • Cohort assignment: each anonymous browser is randomly locked to 3 free-use
     days. Stored once in localStorage (key = "fss_gate").
   • Visitor counter: every new calendar day adds one element to the "fss_days"
     array. No network call required.
   • Returns `true` *after* the allocation is exhausted
     (uniqueDays > gateDays) so the pay-wall appears on day 4.
 * -------------------------------------------------------------------------- */

import type { EmailExtensionData } from '@/lib/emailAlerts/types';

const FSS_GATE_KEY = 'fss_gate';
const FSS_DAYS_KEY = 'fss_days';
const FSS_EMAIL_EXTENSION_KEY = 'fss_email_extension';

export async function shouldShowPaywall(): Promise<boolean> {
  if (typeof window === 'undefined') return false; // SSR / bots

  /* ---------- 0️⃣  check for email extension first ---------------------- */
  const extensionData = localStorage.getItem(FSS_EMAIL_EXTENSION_KEY);
  if (extensionData) {
    try {
      const extension: EmailExtensionData = JSON.parse(extensionData);
      const expiresAt = new Date(extension.expiresAt);
      if (expiresAt > new Date()) {
        // Email extension is still valid - no paywall
        return false;
      }
      // Extension expired - show hard paywall (don't check day count)
      return true;
    } catch {
      // Invalid extension data, remove it and continue with normal gate
      localStorage.removeItem(FSS_EMAIL_EXTENSION_KEY);
    }
  }

  /* ---------- 1️⃣  assign (sticky) gate cohort -------------------------- */
  let gateDays = Number(localStorage.getItem(FSS_GATE_KEY));
  if (![3].includes(gateDays)) {
    // All users get a 3-day gate
    gateDays = 3;
    localStorage.setItem(FSS_GATE_KEY, String(gateDays));
  }

  /* ---------- 2️⃣  record today's visit -------------------------------- */
  const today = new Date().toISOString().slice(0, 10);          // YYYY-MM-DD
  const days: string[] = JSON.parse(localStorage.getItem(FSS_DAYS_KEY) ?? '[]');

  if (!days.includes(today)) {
    days.push(today);
    localStorage.setItem(FSS_DAYS_KEY, JSON.stringify(days));
  }

  /* ---------- 3️⃣  show pay-wall on the day AFTER the cap -------------- */
  return days.length > gateDays;
}

/* -------------------------------------------------------------------------- *
   Helper: Check extension status without side effects
 * -------------------------------------------------------------------------- */
export function getEmailExtensionStatus(): {
  hasExtension: boolean;
  daysRemaining: number;
  email?: string;
  token?: string;
} {
  if (typeof window === 'undefined') {
    return { hasExtension: false, daysRemaining: 0 };
  }

  const extensionData = localStorage.getItem(FSS_EMAIL_EXTENSION_KEY);
  if (!extensionData) {
    return { hasExtension: false, daysRemaining: 0 };
  }

  try {
    const extension: EmailExtensionData = JSON.parse(extensionData);
    const expiresAt = new Date(extension.expiresAt);
    const now = new Date();

    if (expiresAt <= now) {
      return { hasExtension: false, daysRemaining: 0 };
    }

    const msRemaining = expiresAt.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    return {
      hasExtension: true,
      daysRemaining,
      email: extension.email,
      token: extension.token,
    };
  } catch {
    return { hasExtension: false, daysRemaining: 0 };
  }
}

/* -------------------------------------------------------------------------- *
   Helper: Grant email extension (called after successful API signup)
 * -------------------------------------------------------------------------- */
export function grantEmailExtension(
  email: string,
  expiresAt: string,
  token: string
): void {
  if (typeof window === 'undefined') return;

  const extensionData: EmailExtensionData = {
    email,
    expiresAt,
    grantedAt: new Date().toISOString(),
    token,
  };

  localStorage.setItem(FSS_EMAIL_EXTENSION_KEY, JSON.stringify(extensionData));
}