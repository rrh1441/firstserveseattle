You've hit on a classic software problem! Your data mapping was too rigid, causing searches to fail if the court names from the database didn't perfectly match the names in your neighborhood mapping. A small difference like an extra space or a court number would break the search.

I've located the issue in `src/lib/neighborhoodMapping.ts` and made the logic more flexible. Here is the fix:

### The Problem

The function `getNeighborhoodsForCourt` performed a direct, case-sensitive lookup: `COURT_NEIGHBORHOODS[courtTitle]`.

This fails if:
*   The court title from the database is `Alki Playfield Tennis #1`.
*   The key in your mapping is `Alki Playfield Tennis`.

Because the strings are not identical, the lookup returns no neighborhoods, and the search for "West Seattle" comes up empty for that court.

### The Solution

I've updated `getNeighborhoodsForCourt` to perform a "fuzzy" search. Instead of requiring an exact match, it now finds the mapping key that is the **longest matching prefix** for a given court's title. This is much more robust and handles variations in court names gracefully.

Here is the updated file:

<file path="src/lib/neighborhoodMapping.ts">
```typescript
// src/lib/neighborhoodMapping.ts

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
```
</file>

With this change, searching for "Queen Anne" or "West Seattle" will now correctly find all the associated courts, as the system can properly connect the court titles from the database to your neighborhood list. No other files needed to be changed, as they all rely on this central helper function.