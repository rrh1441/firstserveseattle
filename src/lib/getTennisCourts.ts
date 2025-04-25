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
  // 1. Fetch courts
  const { data: courtRows, error: courtError } = await supabase
    .from<CourtRow>("tennis_courts")
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

  if (courtError) {
    console.error("[getTennisCourts] Error fetching courts:", courtError);
    return [];
  }
  if (!courtRows) {
    console.warn("[getTennisCourts] No courts returned");
    return [];
  }

  // 2. Fetch 7-day popularity view
  const { data: popRows, error: popError } = await supabase
    .from<PopularityRow>("v_court_popularity_7d")
    .select("court_id, avg_busy_score_7d");

  if (popError) {
    console.error("[getTennisCourts] Error fetching popularity metrics:", popError);
    return [];
  }

  const popMap = new Map<number, number | null>();
  popRows?.forEach(({ court_id, avg_busy_score_7d }) => {
    popMap.set(court_id, avg_busy_score_7d);
  });

  // 3. Transform into TennisCourt[]
  return courtRows.map((row) => {
    const parsed_intervals = parseAvailableDates(row.available_dates ?? "");
    const avg_busy_score_7d = popMap.get(row.id) ?? null;

    return {
      id: row.id,
      title: row.title ?? "Unknown Court",
      facility_type: row.facility_type ?? "Unknown",
      address: row.address,
      Maps_url: row.google_map_url,
      lights: row.lights ?? false,
      hitting_wall: row.hitting_wall ?? false,
      pickleball_lined: row.pickleball_lined ?? false,
      ball_machine: row.ball_machine ?? false,
      parsed_intervals,
      avg_busy_score_7d,
    };
  });
}

// ─── Helpers ─────────────────────────────────────────────

function parseAvailableDates(availableDatesStr: string): ParsedInterval[] {
  if (!availableDatesStr) {
    return [];
  }
  return availableDatesStr
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [datePart, timeRange] = line.split(/\s+(.+)/);
      if (!datePart || !timeRange) {
        return null;
      }
      const [startRaw, endRaw] = timeRange.split("-");
      const start = convertToAMPM(startRaw);
      const end = convertToAMPM(endRaw);
      if (!start || !end) {
        return null;
      }
      return { date: datePart, start, end };
    })
    .filter((i): i is ParsedInterval => i !== null);
}

function convertToAMPM(raw: string): string {
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) {
    return "";
  }
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  const mmStr = mm.toString().padStart(2, "0");
  return `${h12}:${mmStr} ${ampm}`;
}
