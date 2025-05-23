/* -------------------------------------------------------------------------- */
/*  src/lib/initLocalStorage.ts                                               */
/*  Runs once, early on the client.                                           */
/*  - Bumps schema version                                                    */
/*  - Validates / repairs every key used by First Serve Seattle               */
/* -------------------------------------------------------------------------- */

const SCHEMA_VERSION = 2;           // ← increment every breaking change

type Repairs = {
  key: string;
  reason: string;
};

export function initLocalStorage(): void {
  if (typeof window === 'undefined') return;           // SSR guard

  const current = Number(localStorage.getItem('fss_schema_ver') ?? '0');
  if (current === SCHEMA_VERSION) return;              // already sane

  const repairs: Repairs[] = [];

  /* ---------- helpers -------------------------------------------------- */
  const safeJSON = <T>(key: string, fallback: T, validator?: (v: T) => boolean): T => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw) as T;
      if (validator && !validator(parsed)) throw new Error('validation');
      return parsed;
    } catch {
      repairs.push({ key, reason: 'corrupt JSON or invalid structure' });
      return fallback;
    }
  };

  /* ---------- validate each key we care about -------------------------- */
  // 1. fss_days → must be string[]
  const days = safeJSON<string[]>('fss_days', [], (a) => Array.isArray(a) && a.every((s) => typeof s === 'string'));
  localStorage.setItem('fss_days', JSON.stringify(days));

  // 2. fss_gate → must be "3" | "5" | "7"
  const gateRaw = localStorage.getItem('fss_gate');
  if (!['3', '5', '7'].includes(gateRaw ?? '')) {
    repairs.push({ key: 'fss_gate', reason: 'unexpected value' });
    localStorage.removeItem('fss_gate');               // will be reassigned later
  }

  // 3. abGroup → optional but must be "A" | "B"
  const ab = localStorage.getItem('abGroup');
  if (ab && !['A', 'B'].includes(ab)) {
    repairs.push({ key: 'abGroup', reason: 'unexpected value' });
    localStorage.removeItem('abGroup');
  }

  // 4. userId – keep as-is (string UUID) – no validation

  /* ---------- stamp new schema version --------------------------------- */
  localStorage.setItem('fss_schema_ver', String(SCHEMA_VERSION));

  /* ---------- optional: telemetry -------------------------------------- */
  if (repairs.length) {
    console.warn('[storage-repair]', repairs);
    // fire-and-forget log
    fetch('/api/log-event', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        event   : 'local_storage_repair',
        metadata: { repairs },
      }),
    }).catch(() => {});
  }
}