// Neighborhood mapping for tennis courts
// Allows users to search by neighborhood name to find relevant courts

export const COURT_NEIGHBORHOODS: Record<string, string[]> = {
  "Alki Playfield Tennis": ["Admiral", "Alki", "West Seattle"],
  "Aytc Outdoor Tennis": ["Mount Baker"],
  "Beacon Hill Playfield Tennis": ["Beacon Hill"],
  "Bitter Lake Playfield Tennis": ["Bitter Lake"],
  "Brighton Playfield Tennis": ["Hillman City", "Brighton", "Rainier Valley"],
  "Bryant Playground Tennis": ["Bryant", "Ravenna"],
  "David Rodgers Park Tennis": ["Queen Anne"],
  "Dearborn Park Tennis": ["North Beacon Hill", "Beacon Hill"],
  "Delridge Playfield Tennis": ["Delridge", "Cottage Grove", "West Seattle"],
  "Discovery Park Tennis": ["Magnolia"],
  "Froula Playground Tennis": ["Roosevelt", "Ravenna"],
  "Garfield Playfield Tennis": ["Central District", "Cherry Hill"],
  "Gilman Playfield Tennis": ["Ballard", "West Woodland"],
  "Green Lake Park West Tennis": ["Green Lake"],
  "Hiawatha Playfield Tennis": ["Admiral", "West Seattle"],
  "Jefferson Park Lid Tennis Court": ["Beacon Hill"],
  "Laurelhurst Playfield Tennis": ["Laurelhurst"],
  "Lower Woodland Playfield": ["Green Lake", "Wallingford"],
  "Lower Woodland Playfield Upper Courts": ["Wallingford", "Green Lake"],
  "Madison Park Tennis": ["Madison Park"],
  "Madrona Playground Tennis": ["Madrona"],
  "Magnolia Park Tennis": ["Magnolia"],
  "Magnolia Playfield Tennis": ["Magnolia"],
  "Meadowbrook Playfield Tennis": ["Meadowbrook", "Lake City"],
  "Miller Playfield Tennis": ["Capitol Hill", "Miller Park"],
  "Montlake Playfield Tennis": ["Montlake"],
  "Mount Baker Park Tennis": ["Mount Baker"],
  "Observatory Tennis": ["Queen Anne"],
  "Rainier Beach Playfield Tennis": ["Rainier Beach"],
  "Rainier Playfield Tennis": ["Columbia City", "Rainier Valley"],
  "Riverview Playfield Tennis": ["Riverview", "West Seattle"],
  "Rogers Playfield Tennis": ["Eastlake"],
  "Sam Smith (I-90 Lid) Park Tennis": ["Atlantic", "Central District", "Judkins Park"],
  "Seward Park Tennis": ["Seward Park"],
  "Solstice Park Tennis": ["Fauntleroy", "West Seattle"],
  "Soundview Playfield Tennis": ["Crown Hill"],
  "Volunteer Park Court 01": ["Capitol Hill"],
  "Wallingford Playfield Tennis": ["Wallingford"],
  "Walt Hundley Playfield Tennis": ["High Point", "West Seattle"]
};

/**
 * Get neighborhoods for a court by title using a more flexible prefix match.
 * This handles cases where DB titles have suffixes like "#1" that aren't in the map.
 */
export function getNeighborhoodsForCourt(courtTitle: string): string[] {
  const courtTitleLower = courtTitle.toLowerCase();
  let bestMatchKey: string | null = null;

  // Find the longest key in our mapping that is a prefix of the court title.
  for (const key in COURT_NEIGHBORHOODS) {
    if (courtTitleLower.startsWith(key.toLowerCase())) {
      // If we find a match, check if it's better than our current best match.
      if (!bestMatchKey || key.length > bestMatchKey.length) {
        bestMatchKey = key;
      }
    }
  }

  // If we found a matching key, return its neighborhoods.
  if (bestMatchKey) {
    return COURT_NEIGHBORHOODS[bestMatchKey];
  }
  
  return [];
}

/**
 * Check if a court matches a search term by neighborhood
 */
export function courtMatchesNeighborhood(courtTitle: string, searchTerm: string): boolean {
  const neighborhoods = getNeighborhoodsForCourt(courtTitle);
  const searchLower = searchTerm.toLowerCase();
  
  return neighborhoods.some(neighborhood => 
    neighborhood.toLowerCase().includes(searchLower)
  );
}

/**
 * Enhanced search that matches both court title and neighborhoods
 */
export function courtMatchesSearch(courtTitle: string, searchTerm: string): boolean {
  if (!searchTerm.trim()) return true;
  
  const searchLower = searchTerm.toLowerCase();
  
  // Check court title
  const titleMatch = courtTitle.toLowerCase().includes(searchLower);
  
  // Check neighborhoods
  const neighborhoodMatch = courtMatchesNeighborhood(courtTitle, searchTerm);
  
  return titleMatch || neighborhoodMatch;
}