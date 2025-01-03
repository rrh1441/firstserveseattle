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
  address: string
  available_dates: string
  last_updated: string
  google_maps_url: string
  lights: boolean
  hitting_wall: boolean
  pickleball_lined: boolean
  parsed_intervals: ParsedInterval[]
}

/**
 * Fetch and transform data from the "tennis_courts" table in Supabase.
 */
export async function getTennisCourts(): Promise<TennisCourt[]> {
  try {
    const { data, error } = await supabase.from("tennis_courts").select("*")

    if (error) {
      console.error("[getTennisCourts] Supabase error:", error)
      return []
    }
    if (!data) {
      console.log("[getTennisCourts] No data returned.")
      return []
    }

    const transformed = data.map((row) => {
      const parsed_intervals = row.available_dates
        ? parseAvailableDates(row.available_dates)
        : []

      return {
        id: row.id,
        title: row.title,
        facility_type: row.facility_type,
        address: row.address,
        available_dates: row.available_dates,
        last_updated: row.last_updated,
        google_maps_url: row.google_maps_url,
        lights: row.lights,
        hitting_wall: row.hitting_wall,
        pickleball_lined: row.pickleball_lined,
        parsed_intervals,
      }
    })

    console.log("[getTennisCourts] Transformed data:", transformed)
    return transformed
  } catch (err) {
    console.error("[getTennisCourts] Unhandled exception:", err)
    return []
  }
}

/**
 * Parse the "available_dates" column into intervals of { date, start, end }.
 */
function parseAvailableDates(availableDatesStr: string): ParsedInterval[] {
  const lines = availableDatesStr
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean) // Remove empty lines

  const intervals = lines.map((line) => {
    console.log("[parseAvailableDates] Raw line:", line)

    const parts = line.split(/\s+/)
    if (parts.length < 2) return null

    const [datePart, timeRangePart] = parts
    const [startRaw, endRaw] = timeRangePart.split("-")

    if (!startRaw || !endRaw) return null

    const startFormatted = convertToAMPM(startRaw)
    const endFormatted = convertToAMPM(endRaw)

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
  if (!rawTime) return ""

  const [hhStr, mmStr] = rawTime.split(":")
  const hh = parseInt(hhStr, 10) || 0
  const mm = parseInt(mmStr, 10) || 0
  const ampm = hh >= 12 ? "PM" : "AM"
  const hour12 = hh % 12 === 0 ? 12 : hh % 12
  return `${hour12}:${mm < 10 ? `0${mm}` : mm} ${ampm}`
}