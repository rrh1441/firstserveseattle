// src/lib/getTennisCourts.ts
import { supabase } from "@/app/supabaseClient";
import { format } from 'date-fns'; // Using date-fns for reliable date formatting

// --- Interfaces ---

interface ParsedInterval {
  date: string;
  start: string;
  end: string;
}

// Raw data shape from Supabase (adjust based on actual columns)
// Includes fields needed for mapping and metrics join
interface SupabaseTennisCourtRow {
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
  drive_time: number | null; // Assuming it exists as per your list
  ball_machine: boolean | null;
  // Joined data from court_daily_metrics (will be an array or null)
  court_daily_metrics: {
      busy_score: number;
      is_closed_today: boolean;
   }[] | null;
}

// Final transformed type for the application
// Includes busy_score and is_closed_today
interface TennisCourt {
  id: number;
  title: string;
  facility_type: string;
  address: string | null;
  Maps_url: string | null; // Component-facing name (ensure consistency with TennisCourtList.tsx)
  lights: boolean;
  hitting_wall: boolean;
  pickleball_lined: boolean;
  ball_machine: boolean;
  parsed_intervals: ParsedInterval[];
  busy_score: number | null; // Today's busy score
  is_closed_today: boolean;
}

/**
 * Fetch and transform data from the "tennis_courts" table in Supabase,
 * joining with today's metrics.
 */
export async function getTennisCourts(): Promise<TennisCourt[]> {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');

    // Select base columns and join court_daily_metrics for today
    // Ensure all selected column names exactly match your database schema
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
      court_daily_metrics ( busy_score, is_closed_today )
    `;

    const { data, error } = await supabase
      .from("tennis_courts")
      .select(columnsToSelect)
      // Filter the joined metrics for today's date
      // This relies on a correctly set up relationship or Supabase automatically handling it.
      // If issues persist, check relationship or use explicit filtering on the join if possible.
      .eq('court_daily_metrics.play_date', today);

    if (error) {
      console.error("[getTennisCourts] Supabase error:", error);
      return [];
    }

     const rows = data as any[] | null; // Use any for simplicity, refine if needed

    if (!rows) {
      console.log("[getTennisCourts] No data returned.");
      return [];
    }

    const transformed = rows.map((row): TennisCourt | null => {
       if (row.id === null || typeof row.id === 'undefined') {
         console.warn("[getTennisCourts] Skipping row with missing/null ID:", row);
         return null;
       }

       const parsed_intervals = row.available_dates
         ? parseAvailableDates(row.available_dates)
         : [];

       // Extract metrics for today
       const todaysMetric = Array.isArray(row.court_daily_metrics) && row.court_daily_metrics.length > 0
         ? row.court_daily_metrics[0]
         : null;

       // Ensure component interface matches the name used here (e.g., Maps_url)
       const mapsUrl = row.google_map_url ?? null; // Use the correct DB column name

       return {
         id: row.id,
         title: row.title ?? "Unknown Court",
         facility_type: row.facility_type ?? "Unknown",
         address: row.address ?? null,
         Maps_url: mapsUrl, // Assign to the prop name expected by component
         lights: row.lights ?? false,
         hitting_wall: row.hitting_wall ?? false,
         pickleball_lined: row.pickleball_lined ?? false,
         ball_machine: row.ball_machine ?? false,
         parsed_intervals,
         busy_score: todaysMetric?.busy_score ?? null, // Get score or null
         is_closed_today: todaysMetric?.is_closed_today ?? false, // Default to false
       };
     }).filter((court): court is TennisCourt => court !== null);

    // console.log("[getTennisCourts] Transformed data:", transformed); // Optional debug log
    return transformed;

  } catch (err) {
      if (err instanceof Error) {
          console.error("[getTennisCourts] Unhandled exception:", err.message, err.stack);
      } else {
          console.error("[getTennisCourts] Unhandled exception:", err);
      }
      return []; // Return empty array as per original fallback
  }
}

// --- Helper Functions (parseAvailableDates, convertToAMPM) ---
// Ensure these functions handle potential errors gracefully
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