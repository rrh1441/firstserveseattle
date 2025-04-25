// src/lib/getTennisCourts.ts
import { supabase } from "@/app/supabaseClient"

// Define the type for parsed intervals (remains the same)
interface ParsedInterval {
  date: string
  start: string
  end: string
}

// --- Define the shape of the raw data EXACTLY matching your Supabase columns ---
interface SupabaseTennisCourtRow {
  id: number | null;
  title: string | null;
  facility_type: string | null;
  address: string | null;
  available_dates: string | null;
  last_updated: string | null; // Assuming TIMESTAMPTZ or similar string representation
  google_map_url: string | null; // <-- CORRECTED column name
  lights: boolean | null;
  hitting_wall: boolean | null;
  pickleball_lined: boolean | null;
  drive_time: number | null; // Added drive_time based on your list
  ball_machine: boolean | null;
}


// --- Define the final transformed type for the application ---
// We can keep 'Maps_url' here if the component expects it,
// and map it during transformation. Or change it here and in the component.
// Let's keep it as Maps_url for now to minimize component changes.
interface TennisCourt {
  id: number
  title: string
  facility_type: string
  address: string | null
  Maps_url: string | null // Component-facing name (plural 'maps')
  lights: boolean
  hitting_wall: boolean
  pickleball_lined: boolean
  ball_machine: boolean
  parsed_intervals: ParsedInterval[]
  // drive_time?: number | null; // Add if needed by the component
}

/**
 * Fetch and transform data from the "tennis_courts" table in Supabase.
 */
export async function getTennisCourts(): Promise<TennisCourt[]> {
  try {
    // --- CORRECTED Select list based on your column names ---
    const columnsToSelect = "id, title, facility_type, address, available_dates, last_updated, google_map_url, lights, hitting_wall, pickleball_lined, drive_time, ball_machine";

    const { data, error } = await supabase
        .from("tennis_courts")
        .select(columnsToSelect) // Use the corrected select list

    if (error) {
      console.error("[getTennisCourts] Supabase error:", error);
      return []
    }

    // Type assertion using the corrected raw row type
    const rows = data as SupabaseTennisCourtRow[] | null;

    if (!rows) {
      console.log("[getTennisCourts] No data returned.")
      return []
    }

    // Use the specific SupabaseTennisCourtRow type for 'row'
    const transformed = rows.map((row: SupabaseTennisCourtRow): TennisCourt | null => {
      if (row.id === null) {
          console.warn("[getTennisCourts] Skipping row with null ID:", row);
          return null; // Skip transforming rows with null ID
      }

      const parsed_intervals = row.available_dates
        ? parseAvailableDates(row.available_dates)
        : []

      // Transform the raw row into the application's TennisCourt type
      return {
        id: row.id,
        title: row.title ?? "Unknown Court",
        facility_type: row.facility_type ?? "Unknown",
        address: row.address ?? null,
        // --- Map the correct DB column (google_map_url) to the app's property (Maps_url) ---
        Maps_url: row.google_map_url ?? null,
        lights: row.lights ?? false,
        hitting_wall: row.hitting_wall ?? false,
        pickleball_lined: row.pickleball_lined ?? false,
        ball_machine: row.ball_machine ?? false,
        parsed_intervals,
        // drive_time: row.drive_time ?? null, // Include drive_time if needed by component
      }
    }).filter((court): court is TennisCourt => court !== null); // Filter out any null results

    return transformed

  } catch (err) {
    if (err instanceof Error) {
        console.error("[getTennisCourts] Unhandled exception:", err.message, err.stack);
    } else {
        console.error("[getTennisCourts] Unhandled exception:", err);
    }
    return []
  }
}

// --- Helper Functions (parseAvailableDates, convertToAMPM) ---
// Keep the robust helper functions from before
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