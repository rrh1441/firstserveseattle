// src/lib/getTennisCourts.ts
import { supabase } from "@/app/supabaseClient"

// Define the type for parsed intervals (remains the same)
interface ParsedInterval {
  date: string
  start: string
  end: string
}

// --- Define the shape of the raw data expected from Supabase ---
// Use the actual column names from your 'tennis_courts' table
// Allow null for fields that might be null in the database
interface SupabaseTennisCourtRow {
  id: number | null;
  title: string | null;
  facility_type: string | null;
  address: string | null;
  available_dates: string | null;
  last_updated: string | null; // Assuming TIMESTAMPTZ or similar string representation
  Maps_url: string | null; // Or Maps_url, match your DB column name
  lights: boolean | null;
  hitting_wall: boolean | null;
  pickleball_lined: boolean | null;
  ball_machine: boolean | null; // Add the ball_machine column
  // Add any other columns you are selecting with '*' that you might use
}


// --- Define the final transformed type for the application (remains the same) ---
interface TennisCourt {
  id: number // Assuming ID is non-nullable in the final object
  title: string
  facility_type: string
  address: string | null // Keep null possibility based on usage
  Maps_url: string | null // Match property name used in component
  lights: boolean
  hitting_wall: boolean
  pickleball_lined: boolean
  ball_machine: boolean
  parsed_intervals: ParsedInterval[]
  // Include other transformed fields if needed (e.g., available_dates, last_updated if kept)
  // available_dates?: string | null; // Optional: include if needed downstream
  // last_updated?: string | null;    // Optional: include if needed downstream
}

/**
 * Fetch and transform data from the "tennis_courts" table in Supabase.
 */
export async function getTennisCourts(): Promise<TennisCourt[]> {
  try {
    // Select specific columns if '*' is too broad, otherwise '*' is fine
    // Ensure the select includes all fields defined in SupabaseTennisCourtRow
    const { data, error } = await supabase
        .from("tennis_courts")
        .select("id, title, facility_type, address, available_dates, last_updated, Maps_url, lights, hitting_wall, pickleball_lined, ball_machine") // Explicit select is safer than '*'
        // Or keep using .select("*") if you prefer

    if (error) {
      console.error("[getTennisCourts] Supabase error:", error)
      // Consider throwing error for better upstream handling
      // throw new Error(`Supabase query failed: ${error.message}`);
      return [] // Return empty array as per original fallback
    }
    // Type assertion: Tell TypeScript data is an array of our expected raw row type
    // This assumes the Supabase client might return 'any[]' or a generic type
    const rows = data as SupabaseTennisCourtRow[] | null;

    if (!rows) {
      console.log("[getTennisCourts] No data returned.")
      return []
    }

    // FIX: Use the specific SupabaseTennisCourtRow type for 'row' instead of 'any'
    const transformed = rows.map((row: SupabaseTennisCourtRow): TennisCourt | null => {
      // Perform null check on essential fields like id if needed for filtering invalid rows
      if (row.id === null) {
          console.warn("[getTennisCourts] Skipping row with null ID:", row);
          return null; // Skip transforming rows with null ID
      }

      const parsed_intervals = row.available_dates
        ? parseAvailableDates(row.available_dates)
        : []

      // Transform the raw row into the application's TennisCourt type
      return {
        id: row.id, // ID is confirmed non-null here
        title: row.title ?? "Unknown Court", // Default value if null
        facility_type: row.facility_type ?? "Unknown",
        address: row.address ?? null, // Preserve null if address can be missing
        Maps_url: row.Maps_url ?? null, // Use the name expected by component
        lights: row.lights ?? false, // Default to false if null
        hitting_wall: row.hitting_wall ?? false,
        pickleball_lined: row.pickleball_lined ?? false,
        ball_machine: row.ball_machine ?? false, // Default to false if null
        parsed_intervals,
        // Optional: pass through other fields if needed
        // available_dates: row.available_dates,
        // last_updated: row.last_updated,
      }
    }).filter((court): court is TennisCourt => court !== null); // Filter out any null results from mapping

    // console.log("[getTennisCourts] Transformed data:", transformed) // Keep for debugging if needed
    return transformed

  } catch (err) {
    // Catch specific errors if possible, otherwise log the generic error
    if (err instanceof Error) {
        console.error("[getTennisCourts] Unhandled exception:", err.message, err.stack);
    } else {
        console.error("[getTennisCourts] Unhandled exception:", err);
    }
    // Consider throwing the error to be handled by the calling component
    // throw err;
    return [] // Return empty array as per original fallback
  }
}

// --- Helper Functions (parseAvailableDates, convertToAMPM) ---
// Keep the improved helper functions from the previous step
// (including checks for null/empty strings, format validation)

/**
 * Parse the "available_dates" column into intervals of { date, start, end }.
 */
function parseAvailableDates(availableDatesStr: string): ParsedInterval[] {
    // (Keep the robust implementation from the previous response)
    if (!availableDatesStr) return [];
    const lines = availableDatesStr
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const intervals = lines.map((line) => {
      const parts = line.split(/\s+/);
      if (parts.length < 2) {
           console.warn(`[parseAvailableDates] Skipping malformed line (not enough parts): "${line}"`);
           return null;
      }
      const datePart = parts[0];
      const timeRangePart = parts[parts.length - 1];
      const timeParts = timeRangePart.split("-");
      if (timeParts.length !== 2 || !timeParts[0] || !timeParts[1]) {
          console.warn(`[parseAvailableDates] Skipping malformed time range in line: "${line}"`);
          return null;
      }
      const [startRaw, endRaw] = timeParts;
      const startFormatted = convertToAMPM(startRaw.trim());
      const endFormatted = convertToAMPM(endRaw.trim());
      if (!startFormatted || !endFormatted) {
           console.warn(`[parseAvailableDates] Skipping line due to invalid time conversion: "${line}"`);
           return null;
      }
      return { date: datePart, start: startFormatted, end: endFormatted };
    });

    return intervals.filter((interval): interval is ParsedInterval => interval !== null);
}

/**
 * Convert a time string from 24-hour format to 12-hour AM/PM format.
 */
function convertToAMPM(rawTime: string): string {
    // (Keep the robust implementation from the previous response)
    if (!rawTime || typeof rawTime !== 'string') return "";
    const timeMatch = rawTime.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!timeMatch) return "";
    const [, hhStr, mmStr] = timeMatch;
    const hh = parseInt(hhStr, 10);
    const mm = parseInt(mmStr, 10);
    if (isNaN(hh) || isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return "";
    const ampm = hh >= 12 ? "PM" : "AM";
    const hour12 = hh % 12 === 0 ? 12 : hh % 12;
    const mmFormatted = mm < 10 ? `0${mm}` : `${mm}`;
    return `${hour12}:${mmFormatted} ${ampm}`;
}