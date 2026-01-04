import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Court {
  id: number;
  title: string;
  address: string | null;
}

interface Facility {
  name: string;
  courtIds: number[];
  address: string | null;
}

// Extract park name - MUST match getFacilitiesWithCoords.ts exactly
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

// Display names - MUST match getFacilitiesWithCoords.ts exactly
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

// List of facility keys - only include facilities that match the map
const VALID_FACILITIES = new Set(Object.keys(FACILITY_DISPLAY_NAMES));

function getDisplayName(facilityName: string): string {
  return FACILITY_DISPLAY_NAMES[facilityName] || facilityName;
}

// GET: Fetch list of all facilities grouped to match map pins
export async function GET(): Promise<NextResponse> {
  try {
    const { data, error } = await supabase
      .from('tennis_courts')
      .select('id, title, address')
      .order('title', { ascending: true });

    if (error) {
      console.error('Error fetching courts:', error);
      return NextResponse.json(
        { facilities: [], error: 'Failed to fetch facilities' },
        { status: 500 }
      );
    }

    const courts: Court[] = (data || []).map(c => ({
      id: c.id,
      title: c.title || 'Unknown Court',
      address: c.address,
    }));

    // Group courts by facility (same logic as getFacilitiesWithCoords.ts)
    const facilityMap = new Map<string, Facility>();

    for (const court of courts) {
      const facilityName = extractParkName(court.title);

      // Only include facilities that exist on the map
      if (!VALID_FACILITIES.has(facilityName)) {
        continue;
      }

      if (facilityMap.has(facilityName)) {
        facilityMap.get(facilityName)!.courtIds.push(court.id);
      } else {
        facilityMap.set(facilityName, {
          name: getDisplayName(facilityName),
          courtIds: [court.id],
          address: court.address,
        });
      }
    }

    const facilities = Array.from(facilityMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return NextResponse.json({ facilities });
  } catch (error) {
    console.error('Error in facilities-list:', error);
    return NextResponse.json(
      { facilities: [], error: 'Failed to fetch facilities' },
      { status: 500 }
    );
  }
}
