// src/app/getTennisCourts.ts
import { supabase } from "@/app/supabaseClient"

// Define the type for parsed intervals
interface ParsedInterval {
  date: string
  start: string
  end: string
}

// Define the type for a row in the "tennis_courts" table
interface TennisCourt {
  id: number
  title: string
  facility_type: string
  address: string | null // Keep null possibility
  available_dates: string | null // Allow null
  last_updated: string | null // Allow null
  Maps_url: string | null // Renamed and allow null
  lights: boolean
  hitting_wall: boolean
  pickleball_lined: boolean
  ball_machine: boolean // <-- Add this property
  parsed_intervals: ParsedInterval[]
}

/**
 * Fetch and transform data from the "tennis_courts" table in Supabase.
 */
export async function getTennisCourts(): Promise<TennisCourt[]> {
  try {
    // Assuming 'ball_machine' column exists in your Supabase table
    const { data, error } = await supabase.from("tennis_courts").select("*")

    if (error) {
      console.error("[getTennisCourts] Supabase error:", error)
      // Consider throwing the error or returning a specific error object
      // instead of an empty array to differentiate between "no data" and "error"
      // For now, returning empty array as per original code.
      return []
    }
    if (!data) {
      console.log("[getTennisCourts] No data returned.")
      return []
    }

    // Type assertion for safety, assuming row structure matches expectations
    const transformed = data.map((row: any): TennisCourt => { // Use 'any' or a more specific intermediate type if needed
      const parsed_intervals = row.available_dates
        ? parseAvailableDates(row.available_dates)
        : []

      // Make sure all required fields exist, provide defaults if necessary
      return {
        id: row.id ?? -1, // Provide a default or handle missing ID
        title: row.title ?? "Unknown Court",
        facility_type: row.facility_type ?? "Unknown",
        address: row.address ?? null, // Keep null if potentially missing
        // Note: Rename Maps_url to Maps_url to match DB? Or keep interface separate?
        // Assuming interface name `Maps_url` matches usage intention.
        Maps_url: row.Maps_url ?? null, // <-- Match name used in component if different from DB
        lights: row.lights ?? false,
        hitting_wall: row.hitting_wall ?? false,
        pickleball_lined: row.pickleball_lined ?? false,
        ball_machine: row.ball_machine ?? false, // <-- Map the value, default to false if null/undefined
        parsed_intervals,
        // Include other fields if they exist and are needed
        available_dates: row.available_dates ?? null,
        last_updated: row.last_updated ?? null,
      }
    })

    // Optional: Filter out courts with invalid IDs if needed
    // const validCourts = transformed.filter(court => court.id !== -1);
    // console.log("[getTennisCourts] Transformed data:", validCourts);
    // return validCourts;

    console.log("[getTennisCourts] Transformed data:", transformed)
    return transformed
  } catch (err) {
    console.error("[getTennisCourts] Unhandled exception:", err)
    // Propagate the error or handle it more gracefully
    // throw new Error(`Failed to fetch courts: ${err.message}`);
    return [] // Return empty array as per original code
  }
}

// --- Helper Functions (parseAvailableDates, convertToAMPM) remain the same ---

/**
 * Parse the "available_dates" column into intervals of { date, start, end }.
 */
function parseAvailableDates(availableDatesStr: string): ParsedInterval[] {
    if (!availableDatesStr) return []; // Handle null or empty string case
    const lines = availableDatesStr
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean) // Remove empty lines

    const intervals = lines.map((line) => {
      // console.log("[parseAvailableDates] Raw line:", line); // Optional: Keep for debugging

      // Improved robustness: Handle potential extra spaces
      const parts = line.split(/\s+/)
      if (parts.length < 2) {
           console.warn(`[parseAvailableDates] Skipping malformed line (not enough parts): "${line}"`);
           return null;
      }

      // Assume date is the first part, time range is the last part
      const datePart = parts[0];
      const timeRangePart = parts[parts.length - 1]; // Take the last element as time range

      // Handle potential missing hyphens or incorrect format
      const timeParts = timeRangePart.split("-");
      if (timeParts.length !== 2 || !timeParts[0] || !timeParts[1]) {
          console.warn(`[parseAvailableDates] Skipping malformed time range in line: "${line}"`);
          return null;
      }

      const [startRaw, endRaw] = timeParts;

      const startFormatted = convertToAMPM(startRaw.trim());
      const endFormatted = convertToAMPM(endRaw.trim());

       // Basic validation for the converted times
      if (!startFormatted || !endFormatted) {
           console.warn(`[parseAvailableDates] Skipping line due to invalid time conversion: "${line}"`);
           return null;
      }

      return {
        date: datePart,
        start: startFormatted,
        end: endFormatted,
      }
    })

    return intervals.filter((interval): interval is ParsedInterval => interval !== null)
  }

/**
 * Convert a time string from 24-hour format to 12-hour AM/PM format.
 * E.g., "06:00:00" => "6:00 AM", "17:30:00" => "5:30 PM"
 */
function convertToAMPM(rawTime: string): string {
    // Add more robust checking
    if (!rawTime || typeof rawTime !== 'string') {
        console.warn(`[convertToAMPM] Invalid input time: ${rawTime}`);
        return "";
    }

    const timeMatch = rawTime.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/); // Match HH:MM or HH:MM:SS
    if (!timeMatch) {
        console.warn(`[convertToAMPM] Time format not recognized: ${rawTime}`);
        return ""; // Return empty string if format doesn't match
    }

    const [, hhStr, mmStr] = timeMatch;
    const hh = parseInt(hhStr, 10);
    const mm = parseInt(mmStr, 10);

    // Check if parsing resulted in valid numbers
    if (isNaN(hh) || isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
         console.warn(`[convertToAMPM] Invalid hour or minute parsed: ${rawTime}`);
         return "";
    }

    const ampm = hh >= 12 ? "PM" : "AM";
    const hour12 = hh % 12 === 0 ? 12 : hh % 12;
    // Ensure minutes are zero-padded
    const mmFormatted = mm < 10 ? `0${mm}` : `${mm}`;

    return `${hour12}:${mmFormatted} ${ampm}`;
}