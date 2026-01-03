# Agent Notes

## Current State

### /testa - Micro-Timeline View (DONE)
Compact court availability view showing all courts with:
- Two horizontal rows per court: morning (6 AM - 2 PM) + evening (3 PM - 10 PM)
- Small pill segments for each hour, no text inside
- Colors: `bg-emerald-500` (open), `bg-gray-200` (booked)
- Tap interaction shows selected time details
- Sorted alphabetically by court name

### /testb - Map View (DONE - Jan 2, 2025)
Interactive Mapbox map showing tennis court locations with:
- 39 facilities with precise coordinates
- Color-coded markers: green (available), orange (partial), red (booked)
- Badge showing "X/Y" (available/total courts)
- Click marker → popup with facility name, address, micro-timelines
- Search by court name or neighborhood (auto-zooms to results)
- Click outside popup to dismiss

**Files:**
- `/src/app/testb/page.tsx` - Map view page
- `/src/lib/getFacilitiesWithCoords.ts` - Data layer with coordinates
- `/src/app/components/MicroTimeline.tsx` - Reusable timeline component

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
1. **Push new views to main page** - Replace current homepage with:
   - `/testa` micro-timeline view as default court list
   - `/testb` map view as alternate view (tab or toggle)

2. **Mark conversions** - Update `converted_to_paid = true` in `email_alert_subscribers` when they subscribe (add to Stripe webhook)

3. **Post-trial expiration messaging** - Different paywall for expired trial users ("Your free trial ended...")

4. **Profile/Settings section** - Currently no place for users to:
   - View/edit favorite courts
   - Manage alert preferences (for paid users)
   - See subscription status

### Medium Priority
5. **QR code direct linking to map** - After pushing new views to main:
   - Add `?court=` URL param support to map view
   - QR scan → `/q/[slug]` → redirects to map with court pre-selected and zoomed
   - Auto-open popup for that facility
   - Existing QR infrastructure in `/src/app/q/[slug]/page.tsx` already passes `?court=` param

6. **Referral system** - 50% off first month for referred users
   - Unique referral codes
   - Track referrer for rewards
   - URL param: `/signup?ref=FRIEND50`

7. **Email trial → Paid analytics**
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
