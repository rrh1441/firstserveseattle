import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ParsedInterval {
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

interface HistoryRow {
  history_id: number;
  original_court_id: number;
  snapshot_timestamp: string;
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

// Get today's date in Pacific Time
function getTodayPacific(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

// Precise coordinates for Seattle tennis facilities
const FACILITY_COORDS: Record<string, { lat: number; lon: number }> = {
  "AYTC Outdoor": { lat: 47.584092, lon: -122.297682 },
  "Alki Playfield": { lat: 47.579263, lon: -122.407729 },
  "Beacon Hill Playfield": { lat: 47.586724, lon: -122.315635 },
  "Bitter Lake Playfield": { lat: 47.723488, lon: -122.349825 },
  "Brighton Playfield": { lat: 47.547907, lon: -122.282902 },
  "Bryant Playground": { lat: 47.675062, lon: -122.284000 },
  "David Rodgers Park": { lat: 47.644756, lon: -122.358702 },
  "Dearborn Park": { lat: 47.552221, lon: -122.295150 },
  "Delridge Playfield": { lat: 47.563254, lon: -122.364916 },
  "Discovery Park": { lat: 47.656755, lon: -122.404834 },
  "Froula Playground": { lat: 47.680638, lon: -122.315351 },
  "Garfield Playfield": { lat: 47.607707, lon: -122.300384 },
  "Gilman Playfield": { lat: 47.666910, lon: -122.370273 },
  "Green Lake Park West": { lat: 47.681271, lon: -122.342662 },
  "Hiawatha Playfield": { lat: 47.578909, lon: -122.385238 },
  "Jefferson Park": { lat: 47.570164, lon: -122.308281 },
  "Laurelhurst Playfield": { lat: 47.659033, lon: -122.278887 },
  "Lower Woodland Playfield": { lat: 47.669402, lon: -122.343276 },
  "Lower Woodland Playfield Upper Courts": { lat: 47.665260, lon: -122.343358 },
  "Madison Park": { lat: 47.634839, lon: -122.278179 },
  "Madrona Playground": { lat: 47.611327, lon: -122.290100 },
  "Magnolia Park": { lat: 47.635637, lon: -122.397603 },
  "Magnolia Playfield": { lat: 47.640913, lon: -122.400417 },
  "Meadowbrook Playfield": { lat: 47.706129, lon: -122.295508 },
  "Miller Playfield": { lat: 47.620922, lon: -122.306993 },
  "Montlake Playfield": { lat: 47.641360, lon: -122.310420 },
  "Mount Baker Park": { lat: 47.579627, lon: -122.288587 },
  "Observatory": { lat: 47.631153, lon: -122.355319 },
  "Rainier Beach Playfield": { lat: 47.524101, lon: -122.273591 },
  "Rainier Playfield": { lat: 47.562379, lon: -122.286807 },
  "Riverview Playfield": { lat: 47.540026, lon: -122.350000 },
  "Rogers Playfield": { lat: 47.642901, lon: -122.325421 },
  "Sam Smith (I90 Lid) Park": { lat: 47.590039, lon: -122.296192 },
  "Seward Park": { lat: 47.548019, lon: -122.257782 },
  "Solstice Park": { lat: 47.536372, lon: -122.391677 },
  "Soundview Playfield": { lat: 47.695836, lon: -122.380556 },
  "Volunteer Park": { lat: 47.631991, lon: -122.318018 },
  "Wallingford Playfield": { lat: 47.658344, lon: -122.336542 },
  "Walt Hundley Playfield": { lat: 47.540100, lon: -122.374743 },
};

// Display names for facilities
const FACILITY_DISPLAY_NAMES: Record<string, string> = {
  "AYTC Outdoor": "AYTC Outdoor Courts",
  "Alki Playfield": "Alki Courts",
  "Beacon Hill Playfield": "Beacon Hill Courts",
  "Bitter Lake Playfield": "Bitter Lake Courts",
  "Brighton Playfield": "Brighton Courts",
  "Bryant Playground": "Bryant Courts",
  "David Rodgers Park": "David Rodgers Courts",
  "Dearborn Park": "Dearborn Courts",
  "Delridge Playfield": "Delridge Courts",
  "Discovery Park": "Discovery Park Courts",
  "Froula Playground": "Froula Courts",
  "Garfield Playfield": "Garfield Courts",
  "Gilman Playfield": "Gilman Playground Courts",
  "Green Lake Park West": "Green Lake Park West Courts",
  "Hiawatha Playfield": "Hiawatha Courts",
  "Jefferson Park": "Jefferson Park Courts",
  "Laurelhurst Playfield": "Laurelhurst Courts",
  "Lower Woodland Playfield": "Lower Woodland Courts",
  "Lower Woodland Playfield Upper Courts": "Upper Woodland Courts",
  "Madison Park": "Madison Park Courts",
  "Madrona Playground": "Madrona Courts",
  "Magnolia Park": "Magnolia Park Courts",
  "Magnolia Playfield": "Magnolia Playfield Courts",
  "Meadowbrook Playfield": "Meadowbrook Park Courts",
  "Miller Playfield": "Miller Courts",
  "Montlake Playfield": "Montlake Playfield Courts",
  "Mount Baker Park": "Mount Baker Park Courts",
  "Observatory": "Observatory Courts",
  "Rainier Beach Playfield": "Rainier Beach Playfield Courts",
  "Rainier Playfield": "Rainier Playfield Courts",
  "Riverview Playfield": "Riverview Playfield Courts",
  "Rogers Playfield": "Rogers Tennis Courts",
  "Sam Smith (I90 Lid) Park": "Sam Smith Tennis Courts",
  "Seward Park": "Seward Park Courts",
  "Solstice Park": "Solstice Park Tennis Courts",
  "Soundview Playfield": "Soundview Playfield Courts",
  "Volunteer Park": "Volunteer Park Courts",
  "Wallingford Playfield": "Wallingford Playfield Courts",
  "Walt Hundley Playfield": "Walt Hundley Playfield Courts",
};

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

function extractParkName(title: string): string {
  if (title.includes("Jefferson Park Lid")) return "Jefferson Park";
  if (title.includes("Volunteer Park")) return "Volunteer Park";
  const upperCourtMatch = title.match(/^(.+?) Upper Court \d+$/);
  if (upperCourtMatch) return `${upperCourtMatch[1]} Upper Courts`;
  return title
    .replace(/ Tennis Court \d+$/, "")
    .replace(/ Outdoor Tennis Court \d+$/, "")
    .replace(/ Court \d+$/, "")
    .trim();
}

function findCoords(facilityName: string): { lat: number; lon: number } | null {
  if (FACILITY_COORDS[facilityName]) return FACILITY_COORDS[facilityName];
  for (const [key, coords] of Object.entries(FACILITY_COORDS)) {
    if (facilityName.startsWith(key) || key.startsWith(facilityName)) return coords;
  }
  return null;
}

function getDisplayName(facilityName: string): string {
  return FACILITY_DISPLAY_NAMES[facilityName] || facilityName;
}

function toMin(t: string): number {
  const [clock, ap] = t.toUpperCase().split(" ");
  const [h, m] = clock.split(":").map(Number);
  return ((h % 12) + (ap === "PM" ? 12 : 0)) * 60 + m;
}

const DISPLAY_START_MINUTES = 7 * 60;
const DISPLAY_END_MINUTES = 19 * 60;
const MIN_USEFUL_DURATION_MINUTES = 60;

function hasAvailabilityForDate(intervals: ParsedInterval[], targetDate: string): boolean {
  return intervals.some((interval) => {
    if (!interval.date.startsWith(targetDate)) return false;
    const intervalStart = toMin(interval.start);
    const intervalEnd = toMin(interval.end);
    return intervalStart < DISPLAY_END_MINUTES && intervalEnd > DISPLAY_START_MINUTES;
  });
}

function getAvailableHoursForDate(intervals: ParsedInterval[], targetDate: string): number {
  let totalMinutes = 0;
  for (const interval of intervals) {
    if (!interval.date.startsWith(targetDate)) continue;
    const intervalStart = toMin(interval.start);
    const intervalEnd = toMin(interval.end);
    const clampedStart = Math.max(intervalStart, DISPLAY_START_MINUTES);
    const clampedEnd = Math.min(intervalEnd, DISPLAY_END_MINUTES);
    const duration = clampedEnd - clampedStart;
    if (duration >= MIN_USEFUL_DURATION_MINUTES) {
      totalMinutes += duration;
    }
  }
  return totalMinutes / 60;
}

function getAvailabilityColor(availableHours: number, totalCourts: number): string {
  const potentialHours = totalCourts * 12;
  const percentage = potentialHours > 0 ? availableHours / potentialHours : 0;
  if (percentage >= 0.75) return "#10b981";
  if (percentage >= 0.25) return "#f97316";
  return "#ef4444";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD" },
      { status: 400 }
    );
  }

  const today = getTodayPacific();
  const isToday = date === today;
  const isPast = date < today;

  try {
    let courts: CourtRow[] = [];

    if (isToday) {
      // For today, use current tennis_courts table
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
        console.error("[availability] court fetch error:", courtErr);
        return NextResponse.json({ error: "Failed to fetch courts" }, { status: 500 });
      }
      courts = (courtData ?? []) as CourtRow[];
    } else if (isPast) {
      // For past dates, use tennis_courts_history for availability
      // but fetch current amenities from tennis_courts (amenities are static metadata)
      const startOfDay = `${date}T00:00:00.000Z`;
      const endOfDay = `${date}T23:59:59.999Z`;

      // Run both queries in parallel for performance
      const [historyResult, amenitiesResult] = await Promise.all([
        supabase
          .from("tennis_courts_history")
          .select(`
            history_id,
            original_court_id,
            snapshot_timestamp,
            title,
            facility_type,
            address,
            available_dates,
            google_map_url
          `)
          .gte("snapshot_timestamp", startOfDay)
          .lte("snapshot_timestamp", endOfDay),
        supabase
          .from("tennis_courts")
          .select("id, lights, hitting_wall, pickleball_lined, ball_machine"),
      ]);

      if (historyResult.error) {
        console.error("[availability] history fetch error:", historyResult.error);
        return NextResponse.json({ error: "Failed to fetch historical data" }, { status: 500 });
      }

      if (amenitiesResult.error) {
        console.error("[availability] amenities fetch error:", amenitiesResult.error);
        return NextResponse.json({ error: "Failed to fetch amenities" }, { status: 500 });
      }

      // Build amenities lookup map
      const amenitiesMap = new Map<number, { lights: boolean; hitting_wall: boolean; pickleball_lined: boolean; ball_machine: boolean }>();
      for (const row of amenitiesResult.data ?? []) {
        amenitiesMap.set(row.id, {
          lights: row.lights ?? false,
          hitting_wall: row.hitting_wall ?? false,
          pickleball_lined: row.pickleball_lined ?? false,
          ball_machine: row.ball_machine ?? false,
        });
      }

      // Convert history rows to court rows format
      // If multiple snapshots exist for a court on that day, use the latest one
      const latestByCourtId = new Map<number, HistoryRow>();
      for (const row of (historyResult.data ?? []) as HistoryRow[]) {
        const existing = latestByCourtId.get(row.original_court_id);
        if (!existing || row.snapshot_timestamp > existing.snapshot_timestamp) {
          latestByCourtId.set(row.original_court_id, row);
        }
      }

      // Merge historical availability with current amenities
      courts = Array.from(latestByCourtId.values()).map((h) => {
        const amenities = amenitiesMap.get(h.original_court_id);
        return {
          id: h.original_court_id,
          title: h.title,
          facility_type: h.facility_type,
          address: h.address,
          available_dates: h.available_dates,
          google_map_url: h.google_map_url,
          lights: amenities?.lights ?? false,
          hitting_wall: amenities?.hitting_wall ?? false,
          pickleball_lined: amenities?.pickleball_lined ?? false,
          ball_machine: amenities?.ball_machine ?? false,
        };
      });
    } else {
      // Future dates not supported
      return NextResponse.json(
        { error: "Future dates not available" },
        { status: 400 }
      );
    }

    // Group courts by facility
    const facilityMap = new Map<
      string,
      {
        courts: Array<{
          id: number;
          title: string;
          intervals: ParsedInterval[];
          lights: boolean;
          hitting_wall: boolean;
          pickleball_lined: boolean;
          ball_machine: boolean;
        }>;
        address: string | null;
      }
    >();

    for (const court of courts) {
      const facilityName = extractParkName(court.title ?? "Unknown");
      const intervals = parseAvailableDates(court.available_dates ?? "");

      const courtData = {
        id: court.id,
        title: court.title ?? "Unknown Court",
        intervals,
        lights: court.lights ?? false,
        hitting_wall: court.hitting_wall ?? false,
        pickleball_lined: court.pickleball_lined ?? false,
        ball_machine: court.ball_machine ?? false,
      };

      if (facilityMap.has(facilityName)) {
        facilityMap.get(facilityName)!.courts.push(courtData);
      } else {
        facilityMap.set(facilityName, {
          courts: [courtData],
          address: court.address,
        });
      }
    }

    // Convert to array with coordinates and availability for the requested date
    const facilities = [];

    for (const [name, data] of facilityMap.entries()) {
      const coords = findCoords(name);
      if (!coords) continue;

      const courtsWithAvailability = data.courts.map((court) => ({
        ...court,
        hasAvailability: hasAvailabilityForDate(court.intervals, date),
        // Filter intervals to only include the requested date
        intervals: court.intervals.filter((i) => i.date.startsWith(date)),
      }));

      const availableCount = courtsWithAvailability.filter((c) => c.hasAvailability).length;
      const totalAvailableHours = data.courts.reduce(
        (sum, court) => sum + getAvailableHoursForDate(court.intervals, date),
        0
      );

      facilities.push({
        name: getDisplayName(name),
        address: data.address,
        lat: coords.lat,
        lon: coords.lon,
        courts: courtsWithAvailability.sort((a, b) => a.title.localeCompare(b.title)),
        availableCount,
        totalCount: data.courts.length,
        availableHours: totalAvailableHours,
        color: getAvailabilityColor(totalAvailableHours, data.courts.length),
      });
    }

    return NextResponse.json({
      date,
      facilities: facilities.sort((a, b) => a.name.localeCompare(b.name)),
    });
  } catch (error) {
    console.error("[availability] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
