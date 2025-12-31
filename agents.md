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

---

## Email Alerts & Extended Trial System (DONE - Dec 30, 2024)

### Overview
Dual-path paywall funnel:
- **Path A**: Subscribe now ($8/month or $64/year)
- **Path B**: Get 7 free days + personalized email alerts (email capture) ← Primary CTA

### User Flow
```
Day 1-3: Anonymous free access
    ↓
Day 4: Paywall appears
    ↓
[Get 7 Free Days + Court Alerts]  ← Primary CTA (email capture)
Or subscribe now — $8/mo          ← Secondary link
    ↓
Email captured → 7-day extension granted
    ↓
User sets preferences (parks, days, hours, alert time)
    ↓
Day 4-10: Free access + daily alert emails
    ↓
Day 11+: Hard paywall (must subscribe)
```

### Database Schema
**Table: `email_alert_subscribers`**
- `email`, `name`
- `extension_granted_at`, `extension_expires_at` (7 days)
- `selected_courts[]` - array of court IDs
- `selected_days[]` - 0-6 (Sun-Sat)
- `preferred_start_hour`, `preferred_end_hour` - time window
- `alert_hour` - when to send daily email (PT)
- `alerts_enabled`, `unsubscribe_token`
- `converted_to_paid`, `converted_at` - conversion tracking

**Table: `email_alert_logs`**
- Tracks sent emails to prevent duplicates

SQL file: `sql/email_alert_subscribers.sql`

### Files Created
| File | Purpose |
|------|---------|
| `src/app/api/email-alerts/subscribe/route.ts` | Email capture endpoint |
| `src/app/api/email-alerts/preferences/route.ts` | GET/PUT preferences |
| `src/app/api/email-alerts/unsubscribe/route.ts` | Unsubscribe handler |
| `src/app/api/email-alerts/send/route.ts` | Cron trigger for sending alerts |
| `src/app/api/courts-list/route.ts` | Parks list for preferences |
| `src/app/components/EmailCaptureModal.tsx` | Email capture modal UI |
| `src/app/alerts/page.tsx` | Preferences page (searchable parks) |
| `src/app/alerts/unsubscribe/page.tsx` | Unsubscribe confirmation |
| `src/lib/emailAlerts/types.ts` | TypeScript types |

### Files Modified
| File | Changes |
|------|---------|
| `src/app/lptest/page.tsx` | Email trial as primary CTA, subscribe as secondary |
| `src/app/paywalltest/page.tsx` | Copy of paywall for testing |
| `src/lib/shouldShowPaywall.ts` | Added email extension check |
| `src/lib/resend/templates.ts` | Added alert email templates |
| `src/lib/gmail/email-service.ts` | Added alert email methods |

### Cron Job Setup
Uses **cron-job.org** (not GitHub Actions for reliability)
- **URL**: `https://www.firstserveseattle.com/api/email-alerts/send`
- **Method**: POST
- **Header**: `Authorization: Bearer <CRON_SECRET>`
- **Schedule**: Every hour (`0 * * * *`)

The endpoint filters by:
1. Current PT hour matches subscriber's `alert_hour`
2. Current day of week is in subscriber's `selected_days`
3. Their selected courts have availability in their time window
4. Not already sent today

### Conversion Flow
Email trial user → Subscribe link includes their email:
```
/signup?plan=monthly&email=their@email.com
```
- Email pre-filled on signup page
- Just needs password, then Stripe checkout
- After payment, they're a paid subscriber

---

## Next Steps

### High Priority
1. **Mark conversions** - Update `converted_to_paid = true` in `email_alert_subscribers` when they subscribe (add to Stripe webhook)

2. **Post-trial expiration messaging** - Different paywall for expired trial users ("Your free trial ended...")

3. **Profile/Settings section** - Currently no place for users to:
   - View/edit favorite courts
   - Manage alert preferences (for paid users)
   - See subscription status

### Medium Priority
4. **Referral system** - 50% off first month for referred users
   - Unique referral codes
   - Track referrer for rewards
   - URL param: `/signup?ref=FRIEND50`

5. **Email trial → Paid analytics**
   - Conversion rate tracking
   - Which parks/preferences correlate with conversion
   - Email engagement (opens, clicks)

### Test URLs
- `/lptest` - Landing page with email trial as primary CTA
- `/paywalltest` - Paywall test page
- `/alerts?token=<token>` - Preferences page (need token from DB)

### Environment Variables Needed
```
CRON_SECRET=<random-string>
GMAIL_CLIENT_ID=<from-google-cloud>
GMAIL_CLIENT_SECRET=<from-google-cloud>
GMAIL_REFRESH_TOKEN=<from-oauth-flow>
```
