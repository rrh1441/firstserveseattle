import { getTennisCourts, TennisCourt } from "./getTennisCourts";

export interface FacilityWithCoords {
  name: string;
  address: string | null;
  lat: number;
  lon: number;
  courts: TennisCourt[];
  availableCount: number;
  totalCount: number;
}

// Sample coordinates for Seattle tennis facilities
// These are hardcoded for now - in production, store in database
const FACILITY_COORDS: Record<string, { lat: number; lon: number }> = {
  // North Seattle
  "Lower Woodland Playfield": { lat: 47.6686, lon: -122.3426 },
  "Lower Woodland Playfield Upper Courts": { lat: 47.6686, lon: -122.3426 },
  "Green Lake Park": { lat: 47.6805, lon: -122.3403 },
  "Bitter Lake Playfield": { lat: 47.7262, lon: -122.3468 },
  "Meadowbrook Playfield": { lat: 47.7049, lon: -122.3086 },

  // Central Seattle
  "Volunteer Park Upper Courts": { lat: 47.6308, lon: -122.3148 },
  "Volunteer Park Lower Courts": { lat: 47.6302, lon: -122.3148 },
  "Miller Playfield": { lat: 47.6215, lon: -122.3139 },
  "Bobby Morris Playfield": { lat: 47.6183, lon: -122.3207 },
  "Garfield Playfield": { lat: 47.6145, lon: -122.3090 },

  // West Seattle / Magnolia
  "Magnolia Playfield": { lat: 47.6398, lon: -122.3994 },
  "Alki Playfield": { lat: 47.5766, lon: -122.4097 },
  "Hiawatha Playfield": { lat: 47.5609, lon: -122.3821 },
  "Delridge Playfield": { lat: 47.5555, lon: -122.3632 },

  // South Seattle
  "Jefferson Park": { lat: 47.5711, lon: -122.3106 },
  "Rainier Playfield": { lat: 47.5671, lon: -122.2896 },
  "Mount Baker Park": { lat: 47.5789, lon: -122.2876 },
  "Columbia Park": { lat: 47.5498, lon: -122.2859 },
  "Brighton Playfield": { lat: 47.5464, lon: -122.2809 },
  "Genesee Park": { lat: 47.5686, lon: -122.2812 },
  "Rainier Beach Playfield": { lat: 47.5136, lon: -122.2646 },

  // Queen Anne / Fremont
  "Gilman Playfield": { lat: 47.6600, lon: -122.3739 },

  // Ballard
  "Loyal Heights Playfield": { lat: 47.6824, lon: -122.3888 },
  "Soundview Playfield": { lat: 47.6924, lon: -122.3959 },

  // Northeast
  "Laurelhurst Playfield": { lat: 47.6631, lon: -122.2747 },
  "Ravenna Park": { lat: 47.6748, lon: -122.3024 },
  "View Ridge Playfield": { lat: 47.6854, lon: -122.2750 },
  "Bryant Playground": { lat: 47.6742, lon: -122.2800 },
  "Magnuson Park": { lat: 47.6850, lon: -122.2587 },

  // Beacon Hill
  "Georgetown Playfield": { lat: 47.5452, lon: -122.3212 },
  "Amy Yee Tennis Center": { lat: 47.5711, lon: -122.3120 },
};

// Extract park name from court title
function extractParkName(title: string): string {
  // Handle "Court XX - Upper/Lower" pattern (Volunteer Park style)
  const upperLowerMatch = title.match(/^(.+?) Court \d+ - (Upper|Lower)$/);
  if (upperLowerMatch) {
    return `${upperLowerMatch[1]} ${upperLowerMatch[2]} Courts`;
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

// Check if a court has any availability today
function hasAvailability(court: TennisCourt): boolean {
  return court.parsed_intervals.length > 0;
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
      const availableCount = data.courts.filter(hasAvailability).length;

      facilities.push({
        name,
        address: data.address,
        lat: coords.lat,
        lon: coords.lon,
        courts: data.courts.sort((a, b) => a.title.localeCompare(b.title)),
        availableCount,
        totalCount: data.courts.length,
      });
    }
  }

  return facilities.sort((a, b) => a.name.localeCompare(b.name));
}

// Get availability status color
export function getAvailabilityColor(facility: FacilityWithCoords): string {
  const ratio = facility.availableCount / facility.totalCount;
  if (ratio >= 0.5) return "#10b981"; // emerald-500 (high availability)
  if (ratio > 0) return "#f97316";    // orange-500 (partial)
  return "#ef4444";                    // red-500 (none)
}
