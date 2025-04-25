// src/lib/getTennisCourts.ts
import { supabase } from "@/app/supabaseClient";
// Removed date-fns import

// --- Interfaces ---

interface ParsedInterval {
  date: string;
  start: string;
  end: string;
}

// Raw data shape expected from the Supabase query with the join
// Includes all tennis_courts fields + the nested result from the view join
interface JoinedCourtData {
  id: number | null;
  title: string | null;
  facility_type: string | null;
  address: string | null;
  available_dates: string | null;
  last_updated: string | null;
  google_map_url: string | null; // Your DB column name
  lights: boolean | null;
  hitting_wall: boolean | null;
  pickleball_lined: boolean | null;
  drive_time: number | null;
  ball_machine: boolean | null;
  // Joined data from v_court_popularity_7d (can be null or an empty array)
  v_court_popularity_7d: {
      avg_busy_score_7d: number | null;
      // days_in_avg: number | null; // Can include if needed
  }[] | null; // Supabase returns joined related data as an array
}

// Final transformed type for the application
interface TennisCourt {
  id: number;
  title: string;
  facility_type: string;
  address: string | null;
  Maps_url: string | null; // Component-facing name
  lights: boolean;
  hitting_wall: boolean;
  pickleball_lined: boolean;
  ball_machine: boolean;
  parsed_intervals: ParsedInterval[];
  avg_busy_score_7d: number | null; // The 7-day average score
}

/**
 * Fetch and transform data from the "tennis_courts" table,
 * joining with the 7-day popularity view.
 */
export async function getTennisCourts(): Promise<TennisCourt[]> {
  try {
    // Select all needed columns from tennis_courts and join the popularity view
    const columnsToSelect = `
      id,
      title,
      facility_type,
      address,
      available_dates,
      last_updated,
      google_map_url,
      lights,
      hitting_wall,
      pickleball_lined,
      drive_time,
      ball_machine,
      v_court_popularity_7d ( avg_busy_score_7d )
    `;

    const { data, error } = await supabase
      .from("tennis_courts")
      .select(columnsToSelect); // Joining the view via Supabase relationship syntax

    if (error) {
      console.error("[getTennisCourts] Supabase error joining popularity view:", error);
      return [];
    }

    // *** CORRECTED: Use the specific row type for the type assertion ***
    const rows = data as JoinedCourtData[] | null;

    if (!rows) {
      console.log("[getTennisCourts] No data returned.");
      return [];
    }

    // *** CORRECTED: Use the specific JoinedCourtData type for 'row' ***
    const transformed = rows.map((row: JoinedCourtData): TennisCourt | null => {
       if (row.id === null || typeof row.id === 'undefined') {
         console.warn("[getTennisCourts] Skipping row with missing/null ID:", row);
         return null;
       }

       const parsed_intervals = row.available_dates
         ? parseAvailableDates(row.available_dates)
         : [];

       // Extract popularity score from the joined view data
       const popularityData = Array.isArray(row.v_court_popularity_7d) && row.v_court_popularity_7d.length > 0
         ? row.v_court_popularity_7d[0]
         : null; // If join returns null or empty array, popularityData is null

       const mapsUrl = row.google_map_url ?? null;

       return {
         id: row.id,
         title: row.title ?? "Unknown Court",
         facility_type: row.facility_type ?? "Unknown",
         address: row.address ?? null,
         Maps_url: mapsUrl,
         lights: row.lights ?? false,
         hitting_wall: row.hitting_wall ?? false,
         pickleball_lined: row.pickleball_lined ?? false,
         ball_machine: row.ball_machine ?? false,
         parsed_intervals,
         avg_busy_score_7d: popularityData?.avg_busy_score_7d ?? null, // Get score or null
         // is_closed_today was removed as requested
       };
     }).filter((court): court is TennisCourt => court !== null);

    return transformed;

  } catch (err) {
      if (err instanceof Error) {
          console.error("[getTennisCourts] Unhandled exception:", err.message, err.stack);
      } else {
          console.error("[getTennisCourts] Unhandled exception:", err);
      }
      return [];
  }
}

// --- Helper Functions (parseAvailableDates, convertToAMPM) ---
function parseAvailableDates(availableDatesStr: string): ParsedInterval[] {
    if (!availableDatesStr) return [];
    const lines = availableDatesStr.split("\n").map((line) => line.trim()).filter(Boolean);
    const intervals = lines.map((line) => {
      const parts = line.split(/\s+/); if (parts.length < 2) return null;
      const datePart = parts[0]; const timeRangePart = parts[parts.length - 1];
      const timeParts = timeRangePart.split("-"); if (timeParts.length !== 2 || !timeParts[0] || !timeParts[1]) return null;
      const [startRaw, endRaw] = timeParts;
      const startFormatted = convertToAMPM(startRaw.trim()); const endFormatted = convertToAMPM(endRaw.trim());
      if (!startFormatted || !endFormatted) return null;
      return { date: datePart, start: startFormatted, end: endFormatted };
    });
    return intervals.filter((interval): interval is ParsedInterval => interval !== null);
}

function convertToAMPM(rawTime: string): string {
    if (!rawTime || typeof rawTime !== 'string') return "";
    const timeMatch = rawTime.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/); if (!timeMatch) return "";
    const [, hhStr, mmStr] = timeMatch; const hh = parseInt(hhStr, 10); const mm = parseInt(mmStr, 10);
    if (isNaN(hh) || isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return "";
    const ampm = hh >= 12 ? "PM" : "AM"; const hour12 = hh % 12 === 0 ? 12 : hh % 12;
    const mmFormatted = mm < 10 ? `0${mm}` : `${mm}`; return `${hour12}:${mmFormatted} ${ampm}`;
}