import { getTennisCourts, TennisCourt } from "./getTennisCourts";

export interface FacilityWithCoords {
  name: string;
  address: string | null;
  lat: number;
  lon: number;
  courts: TennisCourt[];
  availableCount: number;
  totalCount: number;
  availableHours: number; // Total court-hours available today (7am-7pm)
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

// Display names for facilities (cleaner names for the UI)
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

// Extract and normalize park name from court title
function extractParkName(title: string): string {
  // Consolidate all Jefferson Park Lid courts
  if (title.includes("Jefferson Park Lid")) {
    return "Jefferson Park";
  }

  // Consolidate Volunteer Park Upper/Lower courts
  if (title.includes("Volunteer Park")) {
    return "Volunteer Park";
  }

  // Handle "Upper Court XX" pattern (Lower Woodland Upper Courts style)
  const upperCourtMatch = title.match(/^(.+?) Upper Court \d+$/);
  if (upperCourtMatch) {
    return `${upperCourtMatch[1]} Upper Courts`;
  }

  // Handle standard patterns
  return title
    .replace(/ Tennis Court \d+$/, "")
    .replace(/ Outdoor Tennis Court \d+$/, "")
    .replace(/ Court \d+$/, "")
    .trim();
}

// Get today's date in Pacific Time (format: "2025-01-02")
function getTodayDateString(): string {
  // Use Intl.DateTimeFormat for reliable timezone handling
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA gives us YYYY-MM-DD format directly
  return formatter.format(new Date());
}

// Convert time string to minutes since midnight
function timeToMinutes(timeStr: string): number {
  const [clock, ap] = timeStr.toUpperCase().split(" ");
  const [h, m] = clock.split(":").map(Number);
  return ((h % 12) + (ap === "PM" ? 12 : 0)) * 60 + m;
}

// Display hours for availability calculation
const DISPLAY_START_MINUTES = 7 * 60;  // 7am in minutes
const DISPLAY_END_MINUTES = 19 * 60;   // 7pm in minutes

// Check if a court has any availability TODAY within display hours (7am-7pm)
function hasAvailabilityToday(court: TennisCourt): boolean {
  const today = getTodayDateString();

  return court.parsed_intervals.some((interval) => {
    // Check if interval is for today
    if (!interval.date.startsWith(today)) return false;

    // Check if interval overlaps with display hours
    const intervalStart = timeToMinutes(interval.start);
    const intervalEnd = timeToMinutes(interval.end);

    return intervalStart < DISPLAY_END_MINUTES && intervalEnd > DISPLAY_START_MINUTES;
  });
}

// Minimum useful booking duration (60 minutes)
const MIN_USEFUL_DURATION_MINUTES = 60;

// Calculate total available hours for a court TODAY within display hours (7am-7pm)
// Only counts intervals that are at least 60 minutes (useful for actual play)
function getAvailableHoursForCourt(court: TennisCourt): number {
  const today = getTodayDateString();
  let totalMinutes = 0;

  for (const interval of court.parsed_intervals) {
    // Only count today's intervals
    if (!interval.date.startsWith(today)) continue;

    const intervalStart = timeToMinutes(interval.start);
    const intervalEnd = timeToMinutes(interval.end);

    // Clamp interval to display hours (7am-7pm)
    const clampedStart = Math.max(intervalStart, DISPLAY_START_MINUTES);
    const clampedEnd = Math.min(intervalEnd, DISPLAY_END_MINUTES);

    const duration = clampedEnd - clampedStart;

    // Only count intervals that are at least 60 minutes
    if (duration >= MIN_USEFUL_DURATION_MINUTES) {
      totalMinutes += duration;
    }
  }

  return totalMinutes / 60; // Convert to hours
}

// Calculate total available hours across all courts at a facility
function getTotalAvailableHours(courts: TennisCourt[]): number {
  return courts.reduce((total, court) => total + getAvailableHoursForCourt(court), 0);
}

// Find matching coordinates for a facility name
function findCoords(facilityName: string): { lat: number; lon: number } | null {
  // Direct match
  if (FACILITY_COORDS[facilityName]) {
    return FACILITY_COORDS[facilityName];
  }

  // Partial match - check if facility name starts with any key
  for (const [key, coords] of Object.entries(FACILITY_COORDS)) {
    if (facilityName.startsWith(key) || key.startsWith(facilityName)) {
      return coords;
    }
  }

  return null;
}

// Get display name for a facility
function getDisplayName(facilityName: string): string {
  return FACILITY_DISPLAY_NAMES[facilityName] || facilityName;
}

export async function getFacilitiesWithCoords(): Promise<FacilityWithCoords[]> {
  const courts = await getTennisCourts();

  // Group courts by facility
  const facilityMap = new Map<string, {
    courts: TennisCourt[];
    address: string | null;
  }>();

  for (const court of courts) {
    const facilityName = extractParkName(court.title);

    if (facilityMap.has(facilityName)) {
      facilityMap.get(facilityName)!.courts.push(court);
    } else {
      facilityMap.set(facilityName, {
        courts: [court],
        address: court.address,
      });
    }
  }

  // Convert to array with coordinates
  const facilities: FacilityWithCoords[] = [];

  for (const [name, data] of facilityMap.entries()) {
    const coords = findCoords(name);

    // Only include facilities with known coordinates
    if (coords) {
      const availableCount = data.courts.filter(hasAvailabilityToday).length;
      const availableHours = getTotalAvailableHours(data.courts);

      facilities.push({
        name: getDisplayName(name),
        address: data.address,
        lat: coords.lat,
        lon: coords.lon,
        courts: data.courts.sort((a, b) => a.title.localeCompare(b.title)),
        availableCount,
        totalCount: data.courts.length,
        availableHours,
      });
    }
  }

  return facilities.sort((a, b) => a.name.localeCompare(b.name));
}

// Get availability status color based on percentage of potential hours
// Potential hours = courts × 12 hours (7am-7pm window)
export function getAvailabilityColor(facility: FacilityWithCoords): string {
  const potentialHours = facility.totalCount * 12; // 12 hours per court (7am-7pm)
  const percentage = potentialHours > 0 ? facility.availableHours / potentialHours : 0;

  if (percentage >= 0.75) return "#10b981";   // emerald-500 (high: >75%)
  if (percentage >= 0.25) return "#f97316";   // orange-500 (some: 25-75%)
  return "#ef4444";                            // red-500 (low: <25%)
}
