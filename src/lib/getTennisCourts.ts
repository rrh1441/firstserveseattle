// src/lib/getTennisCourts.ts

import { supabase } from "@/app/supabaseClient"

/**
 * We handle "available_dates" that can look like:
 *   "2024-12-30  06:00:00-17:30:00"
 * single-line or multi-line:
 *   "2024-12-30  06:00:00-17:30:00
 *    2024-12-30  20:30:00-22:00:00"
 * We'll parse each line into { date, start, end } intervals,
 * then convert "start"/"end" from "06:00:00" to "6:00 AM", etc.
 *
 * We'll store them in row.parsed_intervals: an array of intervals.
 * The front-end can do further logic or just rely on them if needed.
 */

export async function getTennisCourts() {
  try {
    const { data, error } = await supabase
      .from("tennis_courts")
      .select("*")

    if (error) {
      console.error("[getTennisCourts] Supabase error:", error)
      return []
    }
    if (!data) {
      console.log("[getTennisCourts] No data returned.")
      return []
    }

    const transformed = data.map((row) => {
      // parse the multiline or single-line available_dates
      let parsed_intervals = []
      if (typeof row.available_dates === "string") {
        parsed_intervals = parseAvailableDates(row.available_dates)
      }

      return {
        ...row,
        parsed_intervals, // array of { date, start, end } after time conversion
      }
    })

    console.log("[getTennisCourts] transformed data:", transformed)
    return transformed
  } catch (err) {
    console.error("[getTennisCourts] unhandled exception:", err)
    return []
  }
}

/**
 * parseAvailableDates: handles single or multiple lines like:
 *   "2024-12-30  06:00:00-17:30:00"
 * or:
 *   "2024-12-30  06:00:00-17:30:00
 *    2024-12-30  20:30:00-22:00:00"
 */
function parseAvailableDates(availableDatesStr: string) {
  const lines = availableDatesStr
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)

  const intervals = lines.map((line) => {
    // e.g. "2024-12-30  06:00:00-17:30:00"
    console.log("[parseAvailableDates] raw line:", line)
    const parts = line.split(/\s+/)
    let datePart = ""
    let timeRangePart = ""
    if (parts.length >= 2) {
      datePart = parts[0] 
      timeRangePart = parts[1]
    }

    const [startRaw, endRaw] = timeRangePart.split("-") 
    const startFormatted = convertToAMPM(startRaw)
    const endFormatted = convertToAMPM(endRaw)

    return {
      date: datePart,
      start: startFormatted,
      end: endFormatted,
    }
  })

  console.log("[parseAvailableDates] intervals:", intervals)
  return intervals
}

/**
 * convertToAMPM("06:00:00") => "6:00 AM"
 * convertToAMPM("17:30:00") => "5:30 PM"
 * If it already has "AM"/"PM" we unify spacing, e.g. "6:00AM" => "6:00 AM"
 */
function convertToAMPM(rawTime: string) {
  if (!rawTime) return ""

  const upper = rawTime.toUpperCase()
  // If it includes AM or PM, unify spacing
  if (upper.includes("AM") || upper.includes("PM")) {
    // e.g. "6:00AM" => "6:00 AM"
    const replaced = upper.replace(/(AM|PM)/, " $1")
    return replaced.trim()
  }

  // Otherwise assume it's HH:MM:SS in 24-hour
  const [hhStr, mmStr, ssStr] = rawTime.split(":")
  const hh = parseInt(hhStr, 10) || 0
  const mm = parseInt(mmStr, 10) || 0
  const ampm = hh >= 12 ? "PM" : "AM"
  const hour12 = hh % 12 === 0 ? 12 : hh % 12
  const mmPadded = mm < 10 ? `0${mm}` : mm
  return `${hour12}:${mmPadded} ${ampm}`
}
