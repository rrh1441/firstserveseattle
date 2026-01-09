# Low-Friction User Flow: Visit to Sign Up to Subscribe

## Overview

Redesign the FirstServe Seattle conversion funnel with a "show, don't tell" approach: **Map + Yesterday's Data = Free Preview**, **Today's Data = Free Account Required**.

**Core Insight**: Instead of time-gated trials (localStorage, easily bypassed), gate access by **data freshness**. Yesterday's availability proves the product works. Today's real-time data is the premium that requires signup.

---

## The New Model

```
┌─────────────────────────────────────────────────────────────────┐
│                         FREE (No Account)                       │
├─────────────────────────────────────────────────────────────────┤
│  • Beautiful map with all facility pins                         │
│  • Facility details (location, court count, amenities)          │
│  • YESTERDAY's availability data (proves product works)         │
│  • "This was yesterday. Sign up free to see TODAY's openings"   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ One-tap signup (Google/Apple)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FREE TRIAL (7 Days)                          │
├─────────────────────────────────────────────────────────────────┤
│  • Today's real-time availability                               │
│  • All facilities                                               │
│  • Filters, favorites, alerts                                   │
│  • No credit card required                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Day 8: Payment required
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUBSCRIBED                              │
├─────────────────────────────────────────────────────────────────┤
│  • Everything above, forever                                    │
│  • $8/month or $64/year                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Why This Works

| Old Approach | New Approach |
|--------------|--------------|
| localStorage trial (bypassable) | Server-side auth (can't bypass) |
| 3 days of full access free | Yesterday's data free, today's requires account |
| Text landing page describes product | Map + real data SHOWS product |
| Paywall feels like punishment | Signup feels like upgrade |
| No email until checkout | Email captured at signup (before trial) |

**Psychology shift**: "You've used your free days" → "Want the fresh data? One tap."

---

## Problem Statement

### Current Funnel Issues

1. **localStorage Trial** - 3 calendar days, trivially bypassed (incognito, clear storage)
2. **Text Landing Page** - Describes product instead of showing it
3. **QR Codes Underutilized** - Redirect to text page, not directly to value
4. **Authentication Friction** - Passwords required, no Google OAuth
5. **Post-Checkout Login** - Manual login required after payment
6. **No Email Capture** - Anonymous users leave without contact info

### What Changes

| Before | After |
|--------|-------|
| `/` → Text landing page | `/` → Map page with yesterday's data |
| QR → Landing → Click → Courts | QR → Map with facility highlighted |
| 3-day localStorage trial | Yesterday free, today requires account |
| Password signup | Google/Apple OAuth + magic links |
| Manual post-checkout login | Auto-login after payment |

---

## Proposed Solution

### User Flows

#### Flow 1: QR Code Scan (High Intent)

```
┌──────────────────────────────────────────────────────────────────┐
│  User at Green Lake Tennis Courts                                │
│  Scans QR code on fence                                          │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  MAP PAGE (/) with Green Lake highlighted                        │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    🗺️ [MAP]                                │  │
│  │         [pins for all facilities]                          │  │
│  │              ⭐ Green Lake (highlighted)                   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  GREEN LAKE PARK TENNIS                                    │  │
│  │  6 courts • Lights • Pickleball lines                      │  │
│  │                                                            │  │
│  │  YESTERDAY'S AVAILABILITY (May 8):                         │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ 6am  7am  8am  9am  10am  11am  12pm  1pm  2pm ...  │  │  │
│  │  │  ✓    ✓    ✓    ✓    ✗     ✗     ✓    ✓    ✓  ... │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  📅 Want TODAY's availability?                       │  │  │
│  │  │                                                      │  │  │
│  │  │  [🍎 Continue with Apple]                            │  │  │
│  │  │  [🔵 Continue with Google]                           │  │  │
│  │  │  [📧 Email me a link]                                │  │  │
│  │  │                                                      │  │  │
│  │  │  Free for 7 days • No credit card required           │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ One tap (Google/Apple)
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  SAME PAGE - Now showing TODAY's data                            │
│                                                                  │
│  │  TODAY'S AVAILABILITY (May 9):                             │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ 6am  7am  8am  9am  10am  11am  12pm  1pm  2pm ...  │  │  │
│  │  │  ✓    ✓    ✗    ✗    ✗     ✓     ✓    ✓    ✓  ... │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  [Open in Maps]  [Set Alert]  [Save to Favorites]         │  │
│                                                                  │
│  Trial: 7 days remaining                                         │
└──────────────────────────────────────────────────────────────────┘
```

#### Flow 2: Web Search (Discovery)

```
┌──────────────────────────────────────────────────────────────────┐
│  User searches "seattle tennis court availability"               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  MAP PAGE (/) - No facility highlighted                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    🗺️ [MAP]                                │  │
│  │         [50+ pins across Seattle]                          │  │
│  │         "Tap a court to see availability"                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Header: [Sign In]  (for returning users)                        │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ Taps any pin
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  Facility card expands with YESTERDAY's data + signup prompt     │
│  (Same as QR flow above)                                         │
└──────────────────────────────────────────────────────────────────┘
```

#### Flow 3: Returning Subscriber

```
┌──────────────────────────────────────────────────────────────────┐
│  User visits / or scans QR                                       │
│  (Has active subscription or trial)                              │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ Auto-detected via session
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  MAP PAGE with full TODAY's data                                 │
│  No signup prompts, no "yesterday" labels                        │
│  Full access to all facilities, filters, favorites               │
└──────────────────────────────────────────────────────────────────┘
```

#### Flow 4: Trial Expired → Payment

```
┌──────────────────────────────────────────────────────────────────┐
│  Day 8: User visits, trial expired                               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  MAP PAGE with YESTERDAY's data (same as anonymous)              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Your free trial has ended                                 │  │
│  │                                                            │  │
│  │  Subscribe to keep seeing today's court availability       │  │
│  │                                                            │  │
│  │  ┌─────────────────┐  ┌─────────────────────────────────┐  │  │
│  │  │   MONTHLY       │  │  ANNUAL (Save $32)              │  │  │
│  │  │   $8/month      │  │  $64/year ($5.33/mo)            │  │  │
│  │  │   [Subscribe]   │  │  [Subscribe]                    │  │  │
│  │  └─────────────────┘  └─────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Technical Approach

### Key Principle: Data Freshness as the Gate

```typescript
// The core logic - simple and server-side
function getAvailabilityAccess(user: User | null): 'today' | 'yesterday' {
  if (!user) return 'yesterday';
  if (user.subscriptionStatus === 'active') return 'today';
  if (user.subscriptionStatus === 'trialing' && user.trialEndsAt > new Date()) return 'today';
  return 'yesterday';  // Expired trial or no subscription
}
```

### What We Remove

- `shouldShowPaywall.ts` - No more localStorage day counting
- `fss_gate`, `fss_days`, `fss_email_extension` localStorage keys
- `DaysCounter.tsx` component
- Redirect-based paywall (no more `/signup?from=paywall`)

### What We Add

1. **Map as homepage** - Replace `StaticLandingPage.tsx` with map view
2. **Yesterday's data endpoint** - New API that returns previous day's availability
3. **Google OAuth** - Add to existing `SocialAuthButtons.tsx`
4. **Magic links** - Use Supabase's built-in `signInWithOtp`
5. **Inline auth UI** - Auth buttons embedded in facility cards, not separate page

### File Changes

```
MODIFY:
├── src/app/page.tsx                    # Render map instead of StaticLandingPage
├── src/app/q/[slug]/page.tsx           # Redirect to /?facility=slug (not /?court=)
├── src/app/components/SocialAuthButtons.tsx  # Add Google OAuth button
├── src/app/api/create-checkout-session/route.ts  # Support plan selection from OAuth

CREATE:
├── src/app/api/availability/yesterday/route.ts   # Return yesterday's data (public)
├── src/app/api/availability/today/route.ts       # Return today's data (auth required)
├── src/components/map/MapPage.tsx                # New homepage component
├── src/components/map/FacilityCard.tsx           # Expandable facility with auth prompt
├── src/components/auth/InlineAuthPrompt.tsx      # Auth buttons for facility cards

DELETE:
├── src/lib/shouldShowPaywall.ts                  # No longer needed
├── src/app/tennis-courts/components/DaysCounter.tsx  # No more day counting
├── src/app/components/StaticLandingPage.tsx      # Replaced by map
```

### Database: No Changes Needed

The existing `subscribers` table already tracks:
- `status` (active, trialing, canceled, etc.)
- `trial_end` timestamp
- `user_id` linked to Supabase auth

We just query this to determine access level. No new tables required.

### Implementation Phases

---

## Phase 1: Map Homepage + Yesterday's Data

**Goal**: Replace text landing page with map showing yesterday's availability

### Tasks

- [ ] Create `MapPage.tsx` component
  - Full-screen map with facility pins
  - Tapping pin expands facility card
  - Mobile-optimized (touch, gestures)

- [ ] Create `GET /api/availability/yesterday` endpoint
  - Returns previous day's availability data
  - Public (no auth required)
  - Cache aggressively (data doesn't change)

- [ ] Create `FacilityCard.tsx` component
  - Shows facility name, court count, amenities
  - Displays yesterday's availability grid
  - Contains inline auth prompt for today's data

- [ ] Update QR code redirect
  - Change `/q/[slug]` to redirect to `/?facility=slug`
  - Map auto-highlights and expands that facility

### Files

```
CREATE:
├── src/components/map/MapPage.tsx
├── src/components/map/FacilityCard.tsx
├── src/app/api/availability/yesterday/route.ts

MODIFY:
├── src/app/page.tsx                  # Render MapPage
├── src/app/q/[slug]/page.tsx         # Update redirect
```

### Success Criteria

- [ ] Homepage shows map with all facilities
- [ ] Yesterday's availability loads for any facility (no auth)
- [ ] QR code scan highlights correct facility on map

---

## Phase 2: Auth Flow (Google + Magic Links)

**Goal**: Make signup one tap with no passwords

### Tasks

- [ ] Add Google OAuth to Supabase
  - Configure in Google Cloud Console
  - Add provider in Supabase dashboard
  - Update redirect URIs

- [ ] Update `SocialAuthButtons.tsx`
  - Add Google button
  - Order: Apple, Google, Email
  - Consistent styling

- [ ] Implement magic link flow
  - Use Supabase's `signInWithOtp({ email })`
  - Customize email template
  - Handle return from email click

- [ ] Create `InlineAuthPrompt.tsx`
  - Embedded in FacilityCard
  - Shows when user taps "See today's availability"
  - Apple/Google buttons + email input

- [ ] Handle 7-day trial creation
  - On first signup, set `trial_end` to 7 days from now
  - Store in existing `subscribers` table
  - No payment required for trial

### Files

```
MODIFY:
├── src/app/components/SocialAuthButtons.tsx    # Add Google
├── src/app/auth/callback/route.ts              # Handle Google + trial creation

CREATE:
├── src/components/auth/InlineAuthPrompt.tsx
```

### Success Criteria

- [ ] Google OAuth works end-to-end
- [ ] Magic link emails send and work
- [ ] New users get 7-day trial automatically
- [ ] Auth happens inline (no page redirect)

---

## Phase 3: Today's Data + Trial Status

**Goal**: Show today's data to authenticated users in trial or paid status

### Tasks

- [ ] Create `GET /api/availability/today` endpoint
  - Requires authentication
  - Returns today's real-time data
  - Returns 401 if no auth or trial expired

- [ ] Add access level logic
  - Check user's subscription status
  - Check trial expiration date
  - Return appropriate data

- [ ] Update FacilityCard for authenticated users
  - Show "TODAY" label instead of "YESTERDAY"
  - Remove auth prompt
  - Show trial days remaining if trialing

- [ ] Handle trial expiration
  - When trial expires, user sees yesterday's data
  - Show upgrade prompt with plan selection
  - Link to Stripe checkout

### Files

```
CREATE:
├── src/app/api/availability/today/route.ts
├── src/lib/getAccessLevel.ts

MODIFY:
├── src/components/map/FacilityCard.tsx     # Conditional rendering
```

### Success Criteria

- [ ] Authenticated users see today's data
- [ ] Trial users see days remaining
- [ ] Expired trial users see yesterday + upgrade prompt
- [ ] No localStorage tracking anywhere

---

## Phase 4: Checkout & Auto-Login (Optional Enhancement)

**Goal**: Streamline payment and remove post-checkout login step

### Tasks

- [ ] Fix auto-login after checkout
  - Webhook sets session cookie
  - Checkout success page detects session
  - Redirect to map (not login page)

- [ ] Enable Apple Pay / Google Pay
  - Configure in Stripe dashboard
  - Test on mobile devices

- [ ] (Optional) Embedded checkout
  - Keep users on-site during payment
  - Only if redirect checkout shows drop-off

### Success Criteria

- [ ] User is logged in immediately after payment
- [ ] Mobile users can pay with Apple/Google Pay
- [ ] No manual login step required

---

## Acceptance Criteria

### Functional Requirements

- [ ] Anonymous users see map + yesterday's availability (no auth)
- [ ] Authenticated users (trial or paid) see today's availability
- [ ] Signup works with Apple, Google, or magic link (no passwords)
- [ ] New signups automatically get 7-day free trial
- [ ] Trial expiration shows yesterday's data + upgrade prompt
- [ ] QR code scan opens map with correct facility highlighted

### Non-Functional Requirements

- [ ] Map loads in under 2 seconds on mobile
- [ ] Yesterday's data is cached (doesn't re-fetch)
- [ ] Auth flow completes in under 30 seconds
- [ ] Works on Safari, Chrome, Firefox (mobile + desktop)

### Quality Gates

- [ ] E2E test: Anonymous → see yesterday's data
- [ ] E2E test: Signup → see today's data
- [ ] E2E test: Trial expires → see yesterday's data
- [ ] Analytics events for: map_load, facility_tap, auth_start, auth_complete, trial_start

---

## Success Metrics

| Metric | Current (Est.) | Target | Measurement |
|--------|----------------|--------|-------------|
| Map → Facility Tap | Unknown | 60%+ | Analytics |
| Facility Tap → Signup Start | Unknown | 30%+ | Analytics |
| Signup Start → Trial Started | Unknown | 80%+ | Analytics |
| Trial → Paid | Unknown | 20%+ | Stripe |
| Overall: Visit → Paid | ~2-3% | 6%+ | End-to-end |

---

## Dependencies

### External Services

- [ ] Google Cloud Console: Create OAuth credentials
- [ ] Supabase dashboard: Add Google as OAuth provider
- [ ] Stripe dashboard: Enable Apple Pay / Google Pay (optional)

### Environment Variables

```env
# Add to .env.local
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Google OAuth approval delay | Launch with Apple + magic link first |
| Yesterday's data not compelling | Show specific times, not just ✓/✗ |
| Users confused by "yesterday" | Clear labeling + prominent "Get today's" CTA |
| Magic link emails to spam | Use Supabase managed email; test deliverability |

---

## Future Considerations

After validating this model works:

1. **Embedded checkout** - If redirect checkout shows drop-off
2. **Push notifications** - "Courts just opened at your favorite facility"
3. **Historical data** - "This court is usually free at 7am on Tuesdays"
4. **Annual plan incentives** - Better value prop for committed users

---

## References

### Internal Files to Modify/Remove

| File | Action | Reason |
|------|--------|--------|
| `src/lib/shouldShowPaywall.ts` | DELETE | Replaced by server-side auth check |
| `src/app/components/StaticLandingPage.tsx` | REPLACE | Map becomes homepage |
| `src/app/q/[slug]/page.tsx` | MODIFY | Redirect to `/?facility=` |
| `src/app/components/SocialAuthButtons.tsx` | MODIFY | Add Google OAuth |
| `src/app/auth/callback/route.ts` | MODIFY | Handle Google + create trial |

### External Docs

- [Supabase Magic Link Auth](https://supabase.com/docs/guides/auth/auth-magic-link)
- [Supabase Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [RevenueCat: Hard vs Soft Paywall](https://www.revenuecat.com/blog/growth/hard-paywall-vs-soft-paywall/)

### Key Insight

> "82% of trial starts happen on Day 0. Hard paywalls convert 5.5x better than soft paywalls (12.1% vs 2.2%)."
> — RevenueCat State of Subscription Apps 2025

Our approach gates by **data freshness** rather than **time**:
- Yesterday's data = proves product works (free)
- Today's data = the value worth paying for (requires account)

This is effectively a hard paywall with a compelling demo built in.

---

*Plan created: January 2026*
*Last updated: January 2026*
