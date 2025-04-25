import { supabase } from "@/app/supabaseClient";

/* ---------- local types ---------- */

export interface ParsedInterval {
  date: string;
  start: string;
  end: string;
}

interface CourtRow {
  id: number;
  title: string | null;
  facility_type: string | null;
  address: string | null;
  available_dates: string | null;
  google_map_url: string | null;
  lights: boolean | null;
  hitting_wall: boolean | null;
  pickleball_lined: boolean | null;
  ball_machine: boolean | null;
}

interface PopularityRow {
  court_id: number;
  avg_busy_score_7d: number | null;
}

export interface TennisCourt {
  id: number;
  title: string;
  facility_type: string;
  address: string | null;
  Maps_url: string | null;
  lights: boolean;
  hitting_wall: boolean;
  pickleball_lined: boolean;
  ball_machine: boolean;
  parsed_intervals: ParsedInterval[];
  avg_busy_score_7d: number | null;
}

/* ---------- main fetch ---------- */

export async function getTennisCourts(): Promise<TennisCourt[]> {
  /* 1 ── base court data (no generics on `.from`) */
  const { data: courtData, error: courtErr } = await supabase
    .from("tennis_courts")
    .select(`
      id,
      title,
      facility_type,
      address,
      available_dates,
      google_map_url,
      lights,
      hitting_wall,
      pickleball_lined,
      ball_machine
    `);

  if (courtErr) {
    console.error("[getTennisCourts] court fetch error:", courtErr);
    return [];
  }

  /* 2 ── popularity view */
  const { data: popData, error: popErr } = await supabase
    .from("v_court_popularity_7d")
    .select("court_id, avg_busy_score_7d");

  if (popErr) {
    console.error("[getTennisCourts] popularity fetch error:", popErr);
    return [];
  }

  /* 3 ── normalize results */
  const courts: CourtRow[] = (courtData ?? []) as CourtRow[];
  const pops: PopularityRow[] = (popData ?? []) as PopularityRow[];

  const popMap = new Map<number, number | null>();
  pops.forEach(({ court_id, avg_busy_score_7d }) =>
    popMap.set(court_id, avg_busy_score_7d)
  );

  return courts.map((c) => ({
    id: c.id,
    title: c.title ?? "Unknown Court",
    facility_type: c.facility_type ?? "Unknown",
    address: c.address,
    Maps_url: c.google_map_url,
    lights: c.lights ?? false,
    hitting_wall: c.hitting_wall ?? false,
    pickleball_lined: c.pickleball_lined ?? false,
    ball_machine: c.ball_machine ?? false,
    parsed_intervals: parseAvailableDates(c.available_dates ?? ""),
    avg_busy_score_7d: popMap.get(c.id) ?? null,
  }));
}

/* ---------- helpers ---------- */

function parseAvailableDates(src: string): ParsedInterval[] {
  return src
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [datePart, timeRange] = line.split(/\s+(.+)/);
      if (!datePart || !timeRange) return null;
      const [startRaw, endRaw] = timeRange.split("-");
      const start = toAMPM(startRaw.trim());
      const end = toAMPM(endRaw.trim());
      return start && end ? { date: datePart, start, end } : null;
    })
    .filter((x): x is ParsedInterval => x !== null);
}

function toAMPM(raw: string): string {
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return "";
  const hh = parseInt(m[1], 10),
    mm = m[2],
    ampm = hh >= 12 ? "PM" : "AM",
    h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${mm} ${ampm}`;
}
