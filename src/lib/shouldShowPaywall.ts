/* -------------------------------------------------------------------------- */
/*  shouldShowPaywall – returns a promise<boolean>                            */
/*  - Assigns gate cohort (3 | 5 | 7) once                                     */
/*  - Tracks unique visit days in localStorage                                */
/* -------------------------------------------------------------------------- */

const FSS_GATE_KEY = "fss_gate";
const FSS_DAYS_KEY = "fss_days";

export async function shouldShowPaywall(): Promise<boolean> {
  /* ---------- 1. assign sticky gate -------------------------------------- */
  let gateDays = Number(localStorage.getItem(FSS_GATE_KEY));
  if (!gateDays || ![3, 5, 7].includes(gateDays)) {
    const roll = Math.random();
    gateDays = roll < 0.34 ? 3 : roll < 0.67 ? 5 : 7;
    localStorage.setItem(FSS_GATE_KEY, String(gateDays));
  }

  /* ---------- 2. record today's visit ------------------------------------ */
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const days: string[] = JSON.parse(localStorage.getItem(FSS_DAYS_KEY) ?? "[]");
  if (!days.includes(today)) {
    days.push(today);
    localStorage.setItem(FSS_DAYS_KEY, JSON.stringify(days));
  }

  /* ---------- 3. decision ------------------------------------------------- */
  return days.length >= gateDays;
}