// src/lib/initLocalStorage.ts
// Runs once, early on the client.
// - Bumps schema version
// - Validates / repairs every key used by First Serve Seattle
/* -------------------------------------------------------------------------- */

// Increment this version number when ANY localStorage key's expected structure
// or meaning changes in a way that might break older clients.
const SCHEMA_VERSION = 3; // <-- Increment to 3 (from 2) to force a full reset/repair

type Repairs = {
  key: string;
  reason: string;
  valueAtTimeOfRepair?: string | null; // Added for more debug info
};

export function initLocalStorage(): void {
  if (typeof window === 'undefined') return; // SSR guard

  const currentSchemaVersion = Number(localStorage.getItem('fss_schema_ver') ?? '0');
  const repairs: Repairs[] = [];
  let repairPerformed = false;

  // If schema version is outdated or invalid, perform aggressive cleanup
  if (currentSchemaVersion < SCHEMA_VERSION || isNaN(currentSchemaVersion)) {
    console.warn(`[storage-repair] Schema mismatch: current ${currentSchemaVersion}, expected ${SCHEMA_VERSION}. Performing full reset of FSS keys.`);
    
    // List all FSS-related keys to clear
    const keysToClear = ['fss_days', 'fss_gate', 'abGroup', 'userId', 'visitorId', 'visitNumber', 'stripeCustomerId'];
    
    keysToClear.forEach(key => {
        const oldValue = localStorage.getItem(key);
        if (oldValue !== null) {
            repairs.push({ key, reason: `Schema upgrade from v${currentSchemaVersion} to v${SCHEMA_VERSION}`, valueAtTimeOfRepair: oldValue });
            localStorage.removeItem(key);
            repairPerformed = true;
        }
    });

    // userId, visitorId, visitNumber, abGroup will be re-initialized by ClientIdsInit
    // fss_gate will be re-assigned by shouldShowPaywall if missing.
  }

  /* ---------- helpers -------------------------------------------------- */
  const safeJSON = <T>(key: string, fallback: T, validator?: (v: T) => boolean): T => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw) as T;
      if (validator && !validator(parsed)) {
        throw new Error('validation failed');
      }
      return parsed;
    } catch (e) {
      const oldValue = localStorage.getItem(key);
      repairs.push({ key, reason: `corrupt JSON or invalid structure: ${e instanceof Error ? e.message : String(e)}`, valueAtTimeOfRepair: oldValue });
      localStorage.removeItem(key); // Clear bad key
      repairPerformed = true;
      return fallback;
    }
  };

  /* ---------- validate / re-initialize FSS keys if not already cleared by schema bump -------------------------- */
  // 1. fss_days → must be string[]
  // This will be empty after a schema bump, and that's okay.
  const days = safeJSON<string[]>('fss_days', [], (a) => Array.isArray(a) && a.every((s) => typeof s === 'string'));
  localStorage.setItem('fss_days', JSON.stringify(days)); // Ensure it's a valid empty array if cleared

  // 2. fss_gate → must be "3" | "5" | "7"
  // This will be null after a schema bump, and `shouldShowPaywall` will re-assign.
  const gateRaw = localStorage.getItem('fss_gate');
  if (gateRaw !== null && !['3', '5', '7'].includes(gateRaw)) { // Only if exists and is bad
    repairs.push({ key: 'fss_gate', reason: 'unexpected value' });
    localStorage.removeItem('fss_gate');
    repairPerformed = true;
  }

  // 3. abGroup → optional but must be "A" | "B"
  // This will be null after a schema bump, and `ClientIdsInit` will re-assign.
  const ab = localStorage.getItem('abGroup');
  if (ab !== null && !['A', 'B'].includes(ab)) { // Only if exists and is bad
    repairs.push({ key: 'abGroup', reason: 'unexpected value' });
    localStorage.removeItem('abGroup');
    repairPerformed = true;
  }
  
  // No explicit validation needed for userId, visitorId, visitNumber here
  // as ClientIdsInit handles their creation/presence.

  /* ---------- stamp new schema version if repairs were performed or version updated --------------------------------- */
  if (repairPerformed || currentSchemaVersion < SCHEMA_VERSION) {
    localStorage.setItem('fss_schema_ver', String(SCHEMA_VERSION));
    console.log(`[storage-repair] LocalStorage schema version updated to ${SCHEMA_VERSION}.`);
  }

  /* ---------- optional: telemetry -------------------------------------- */
  if (repairs.length) {
    console.warn('[storage-repair]', repairs);
    // fire-and-forget log
    fetch('/api/log-event', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        event    : 'local_storage_repair_details', // Use a new event name for details
        metadata : { repairs, newSchemaVersion: SCHEMA_VERSION, oldSchemaVersion: currentSchemaVersion },
      }),
    }).catch((e) => console.error("Failed to log storage repair event:", e));
  }
}