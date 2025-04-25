// src/lib/getTennisCourts.ts
import { supabase } from "@/app/supabaseClient";

export interface ParsedInterval {
  date: string;
  start: string;
  end: string;
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

export async function getTennisCourts(): Promise<TennisCourt[]> {
  // 1) Fetch base courts
  const { data: courtRows, error: courtError } = await supabase
    .from<"tennis_courts", CourtRow, CourtRow>("tennis_courts")
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

  if (courtError || !courtRows) {
    console.error("[getTennisCourts] courts error:", courtError);
    return [];
  }

  // 2) Fetch popularity view
  const { data: popRows, error: popError } = await supabase
    .from<"v_court_popularity_7d", PopularityRow, PopularityRow>("v_court_popularity_7d")
    .select("court_id, avg_busy_score_7d");

  if (popError || !popRows) {
    console.error("[getTennisCourts] popularity error:", popError);
    return [];
  }

  const popMap = new Map<number, number | null>();
  popRows.forEach(({ court_id, avg_busy_score_7d }) => {
    popMap.set(court_id, avg_busy_score_7d);
  });

  // 3) Merge & return
  return courtRows.map((r) => ({
    id: r.id,
    title: r.title ?? "Unknown Court",
    facility_type: r.facility_type ?? "Unknown",
    address: r.address,
    Maps_url: r.google_map_url,
    lights: r.lights ?? false,
    hitting_wall: r.hitting_wall ?? false,
    pickleball_lined: r.pickleball_lined ?? false,
    ball_machine: r.ball_machine ?? false,
    parsed_intervals: parseAvailableDates(r.available_dates ?? ""),
    avg_busy_score_7d: popMap.get(r.id) ?? null,
  }));
}

// ─── Helpers ───────────────────────────────────────────────

function parseAvailableDates(input: string): ParsedInterval[] {
  return input
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [datePart, timeRange] = line.split(/\s+(.+)/);
      if (!datePart || !timeRange) return null;
      const [startRaw, endRaw] = timeRange.split("-");
      const start = convertToAMPM(startRaw.trim());
      const end = convertToAMPM(endRaw.trim());
      if (!start || !end) return null;
      return { date: datePart, start, end };
    })
    .filter((x): x is ParsedInterval => x !== null);
}

function convertToAMPM(raw: string): string {
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return "";
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${mm.toString().padStart(2, "0")} ${ampm}`;
}
