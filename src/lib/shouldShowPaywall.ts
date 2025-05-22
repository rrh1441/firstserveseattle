// src/lib/shouldShowPaywall.ts

export async function shouldShowPaywall(): Promise<boolean> {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) return false;

    const res = await fetch(`/api/check-paywall?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.showPaywall;
  } catch (err) {
    console.warn('[shouldShowPaywall] failed to check paywall state', err);
    return false;
  }
}
