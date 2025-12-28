# Agent Notes

## Current State

### /testa - Micro-Timeline View (DONE)
Compact court availability view showing all courts with:
- Two horizontal rows per court: morning (6 AM - 2 PM) + evening (3 PM - 10 PM)
- Small pill segments for each hour, no text inside
- Colors: `bg-emerald-500` (open), `bg-gray-200` (booked)
- Tap interaction shows selected time details
- Sorted alphabetically by court name

### /testb - Needs Replacement
Current capacity bar view is not intuitive. Will be replaced with map view.

---

## Next Steps: Map View

### Concept
Interactive Mapbox map showing tennis court locations as pins. Each pin indicates availability at a glance, tapping shows the micro-timeline for all courts at that facility.

### Prerequisites
1. **Mapbox account + access token** (free tier: 50k map loads/month)
   - Add to `.env.local`: `NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxxx`
2. **Populate lat/lon in database** - `tennis_facilities` table has `lat`/`lon` columns but they're currently NULL

### Dependencies to Install
```bash
pnpm add -w react-map-gl mapbox-gl
pnpm add -wD @types/mapbox-gl
```

### Implementation Plan

**1. Data Layer** (`/src/lib/getTennisCourts.ts`)
- Add `getFacilitiesWithCoords()` function that groups courts by facility and includes lat/lon

**2. Shared Component** (`/src/app/components/MicroTimeline.tsx`)
- Extract timeline rendering from `/testa` into reusable component
- Props: `court`, `onSlotSelect`, `selectedHour`, `compact` (for popup variant)

**3. Map View** (`/src/app/testb/page.tsx`)
- Mapbox map centered on Seattle
- Custom markers per facility with availability indicator:
  - Green dot: Most courts available
  - Yellow dot: Some courts available
  - Red dot: Few/no courts available
  - Badge showing "3/6" (available/total)
- Tap marker → popup with micro-timelines for all courts at facility

### Component Structure
```
/testb (Map View)
├── MapContainer (react-map-gl)
│   └── FacilityMarker[] (custom markers)
│       ├── Availability indicator (colored dot + count)
│       └── onClick → setSelectedFacility
├── FacilityPopup (when facility selected)
│   ├── Facility name + address
│   └── MicroTimeline[] (one per court)
└── Legend
```

### Sample Coordinates for Testing
Until real data is added:
```typescript
const SAMPLE_COORDS = {
  "Lower Woodland Playfield": { lat: 47.6686, lon: -122.3426 },
  "Green Lake Park West": { lat: 47.6805, lon: -122.3403 },
  "Volunteer Park": { lat: 47.6308, lon: -122.3148 },
  "Jefferson Park": { lat: 47.5711, lon: -122.3106 },
  "Magnolia Playfield": { lat: 47.6398, lon: -122.3994 },
};
```

### Notes
- Mapbox GL CSS must be imported for map to render
- Consider lazy-loading map component to reduce initial bundle
- Mobile: popup as bottom sheet works better than floating popup
