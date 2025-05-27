/* -------------------------------------------------------------------------- *
   shouldShowPaywall()
   --------------------------------------------------------------------------
   • Cohort assignment: each anonymous browser is randomly locked to 3, 5, or
     7 free-use days. Stored once in localStorage (key = "fss_gate").
   • Visitor counter : every new calendar day adds one element to the "fss_days"
     array.  No network call required.
   • Returns `true` *after* the allocation is exhausted
     (uniqueDays  >  gateDays) so the pay-wall appears on day 4 / 6 / 8.
 * -------------------------------------------------------------------------- */

const FSS_GATE_KEY = 'fss_gate';
const FSS_DAYS_KEY = 'fss_days';

export async function shouldShowPaywall(): Promise<boolean> {
  if (typeof window === 'undefined') return false; // SSR / bots

  /* ---------- 1️⃣  assign (sticky) gate cohort -------------------------- */
  let gateDays = Number(localStorage.getItem(FSS_GATE_KEY));
  if (![3, 5, 7].includes(gateDays)) {
    const roll = Math.random();
    gateDays = roll < 0.34 ? 3 : roll < 0.67 ? 5 : 7;
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
