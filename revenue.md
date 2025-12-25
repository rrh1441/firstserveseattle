# First Serve Seattle: Year 2 Revenue Growth Plan

## Year 1 Performance Summary

| Metric | Value |
|--------|-------|
| Visitors | 16,675 |
| Page Views | 33,239 |
| Paying Customers | ~100 |
| Conversion Rate | 0.6% |
| Peak Traffic | April - September (2,000+ visitors/month) |
| Court Price (Seattle) | $16/hr |

---

## Strategic Changes for Year 2

### 1. Trial Model Overhaul

#### Current State
- 3-day anonymous gate (localStorage tracked)
- 50% off first month for all new subscribers
- No email capture from free users

#### New Model

| User Type | Site Access | Email Alerts | Discount |
|-----------|-------------|--------------|----------|
| Anonymous (IP/localStorage tracked) | 7 days from first visit | None | - |
| Email signup | +7 additional days (can overlap with anonymous period) | Daily morning alerts during trial | - |
| Referred + email signup | Same as email signup | Same | 50% off first month |
| Paid subscriber | Unlimited | Unlimited | - |

#### Email Signup Flow
1. User clicks "Get free morning alerts" CTA
2. Captures: email, name, preferred courts (3-5), preferred days/times
3. User receives morning email each day showing availability for their preferred courts
4. After 7 days of email trial, emails stop unless subscribed
5. Paywall shows on day 8 (or day 15 if they started email signup on day 1 of anonymous trial)

#### Morning Alert Email Content
- Subject: "Courts open today: [Court Name] and 2 others"
- Body:
  - Their preferred courts with availability for that day
  - Color-coded time slots (same as website)
  - Clear CTA: "View all courts" (links to site)
  - After day 5: "Your free alerts end in X days. Subscribe to keep them."

#### Why This Works
- Captures email on day 1 (currently capturing nothing from free users)
- Demonstrates value in their inbox without requiring return visits
- Creates habit/dependency before paywall hits
- Loss aversion: taking away alerts feels worse than blocking new access
- Extended trial (7 days vs 3) gives more time to experience value
- Email list enables re-engagement campaigns during peak season

---

### 2. Referral Program

#### Structure
- **Referred users**: 50% off first month ($4 instead of $8)
- **Referrers**: Entry into monthly lottery for each successful referral

#### Lottery Prizes
| Prize | Your Cost | Perceived Value | Notes |
|-------|-----------|-----------------|-------|
| Ball machine rental (1 session) | ~$0 | $40-60 | You own the machine, pure margin |
| Merch pack | $20-30 | $40+ | Already have inventory |

#### Recommended Prize Structure
- Monthly drawing: 1 free ball machine rental session
- More referrals = more entries per person
- Announce winner via email to all referrers (social proof + FOMO)

#### Implementation
- Referral code in member dashboard
- Unique code per user (e.g., "RYAN2024" or auto-generated)
- Track via URL parameter: `?ref=RYAN2024`
- Store referral in Stripe metadata or database
- Count successful conversions (paid first month) for lottery entries

---

### 3. Pricing Changes

#### Current
- Monthly: $8/month (50% off first month = $4)
- Annual: $64/year

#### New
- Monthly: $8/month (full price, no automatic discount)
- Annual: $64/year (no change)
- Referred users only: 50% off first month

#### Rationale
- 50% off discount becomes a referral incentive, not a default
- Email trial provides enough value to convert at full price
- Creates reason for users to seek out referral codes (word of mouth)

---

### 4. SEO Expansion: Pickleball

#### Opportunity
- Pickleball is fastest-growing sport in US
- Seattle has significant pickleball community
- You already track pickleball-lined courts as an amenity
- Different search audience than tennis

#### Current SEO State
- Main metadata mentions "pickleball" but tennis-first: "Seattle Tennis Court Availability"
- Keywords include: "pickleball courts Seattle"
- No dedicated pickleball landing page
- robots.txt references sitemap.xml (needs to include /pickleball)

#### Target Keywords (by search volume priority)

| Keyword | Intent | Competition |
|---------|--------|-------------|
| seattle pickleball courts | Discovery | Medium |
| public pickleball courts seattle | Discovery | Low |
| pickleball courts near me seattle | Local | Medium |
| free pickleball courts seattle | Value-seeking | Low |
| open pickleball courts seattle | Same-day play | Low |
| where to play pickleball seattle | Beginner | Low |
| seattle parks pickleball | Discovery | Low |
| drop-in pickleball seattle | Social play | Low |

#### Implementation: /pickleball Landing Page

**Route:** `src/app/pickleball/page.tsx`

**Metadata:**
```typescript
export const metadata = {
  title: 'Seattle Pickleball Courts – Open Courts Today | First Serve Seattle',
  description: 'Find open pickleball courts in Seattle right now. See real-time availability for 40+ public pickleball courts. Updated daily by 5 AM.',
  keywords: 'seattle pickleball courts, public pickleball courts seattle, open pickleball courts, free pickleball seattle, drop-in pickleball seattle',
  openGraph: {
    title: 'Seattle Pickleball Courts – Open Courts Today',
    description: 'Find open pickleball courts in Seattle right now. Real-time availability for 40+ public courts.',
    url: 'https://www.firstserveseattle.com/pickleball',
  },
};
```

**Page Content Structure:**
1. H1: "Find Open Pickleball Courts in Seattle"
2. Subhead: "See which public courts are free for walk-up play right now"
3. CTA: "See today's open courts" → links to /tennis-courts?filter=pickleball
4. Section: "Why Seattle players use First Serve"
5. Section: "Popular pickleball courts" (list top 5-10 courts with pickleball lines)
6. Section: FAQ with pickleball-specific questions
7. Footer CTA: Subscribe

**Pickleball-Specific FAQ Content:**
- "How many pickleball courts are in Seattle?" → 40+ courts with pickleball lines
- "Are Seattle pickleball courts free?" → Yes, public courts are free for walk-up
- "What time do pickleball courts open?" → Most open 6 AM - 10 PM
- "Do I need to reserve a pickleball court?" → Reservations available but unreserved = walk-up
- "Where is the best pickleball in Seattle?" → List top courts by neighborhood

#### Sitemap Update
Add to sitemap.xml:
```xml
<url>
  <loc>https://www.firstserveseattle.com/pickleball</loc>
  <changefreq>weekly</changefreq>
  <priority>0.9</priority>
</url>
```

#### Internal Linking Strategy
- Homepage: Add "Looking for pickleball?" link in features section
- Tennis court list: "Also showing pickleball-lined courts" badge
- Footer: Add "Pickleball Courts" link
- Facility pages: Cross-link to /pickleball for courts with pickleball lines

#### Link to Court Pages with Pickleball (15 facilities, 30+ courts)

The /pickleball landing page should include a "Seattle Pickleball Courts" section linking to individual facility pages. These are the courts with `pickleball_lined: true` in the database:

| Court | Slug | Neighborhood |
|-------|------|--------------|
| Alki Playfield | `/courts/alki_playfield_tennis` | West Seattle |
| Beacon Hill Playfield | `/courts/beacon_hill_playfield_tennis` | Beacon Hill |
| Bitter Lake Playfield | `/courts/bitter_lake_playfield_tennis` | Bitter Lake |
| Brighton Playfield | `/courts/brighton_playfield_tennis` | Rainier Valley |
| Dearborn Park | `/courts/dearborn_park_tennis` | Beacon Hill |
| Delridge Playfield | `/courts/delridge_playfield_tennis` | Delridge |
| Discovery Park | `/courts/discovery_park_tennis` | Magnolia |
| Gilman Playfield | `/courts/gilman_playfield_tennis` | Ballard |
| Magnolia Playfield | `/courts/magnolia_playfield_tennis` | Magnolia |
| Miller Playfield | `/courts/miller_playfield_tennis` | Capitol Hill |
| Mount Baker Park | `/courts/mount_baker_park_tennis` | Mount Baker |
| Observatory Courts | `/courts/observatory_tennis` | Queen Anne |
| Rainier Beach Playfield | `/courts/rainier_beach_playfield_tennis` | Rainier Beach |
| Soundview Playfield | `/courts/soundview_playfield` | Crown Hill |
| Walt Hundley Playfield | `/courts/walt_hundley_playfield` | West Seattle |

**SEO Benefit:** These internal links:
1. Help Google understand site structure
2. Pass page authority to facility pages
3. Keep users on site longer (reduces bounce)
4. Each facility page can rank for "[court name] pickleball" searches

---

### 5. Social Proof: Testimonials

#### Placement
- Paywall page (primary)
- Homepage (secondary) - already has one: "Used to waste 30 minutes driving between courts..."
- Email trial signup confirmation

#### Format
- 2-3 short quotes from real users
- Include first name + neighborhood (e.g., "Ryan, Capitol Hill")
- Focus on specific benefits:
  - Time saved
  - Courts found
  - Convenience of morning routine

#### Draft Testimonials for Paywall

**Option 1: Time-Saving Focus**
> "I check First Serve every morning with my coffee. Saves me from driving to a packed court."
> — *Sarah T., Ballard*

**Option 2: Discovery Focus**
> "Found three courts I didn't even know existed near my house. Game changer for weekday evenings."
> — *James L., Wallingford*

**Option 3: Reliability Focus**
> "The 5 AM updates mean I always know where to go before I leave. Worth every penny."
> — *David M., Queen Anne*

**Option 4: Pickleball Focus**
> "Finally a way to find open pickleball courts without driving around Green Lake three times."
> — *Michelle K., Fremont*

**Option 5: Weekend Warrior Focus**
> "Saturday mornings used to be a gamble. Now I know exactly which courts are free by 7 AM."
> — *Tom R., Capitol Hill*

**Option 6: Casual Player Focus**
> "I only play once a week but hate wasting time. This pays for itself in one saved trip."
> — *Karen P., Ravenna*

#### Recommended Selection for Paywall
Use 2-3 testimonials that cover different use cases:
1. **Morning routine** (Option 1 or 3) - shows daily value
2. **Discovery** (Option 2) - shows breadth of data
3. **Weekend/casual** (Option 5 or 6) - addresses objection "do I play enough to justify $8?"

#### Implementation in paywallCopy.ts
```typescript
export const TESTIMONIALS = [
  {
    quote: "I check First Serve every morning with my coffee. Saves me from driving to a packed court.",
    author: "Sarah T.",
    neighborhood: "Ballard"
  },
  {
    quote: "Saturday mornings used to be a gamble. Now I know exactly which courts are free by 7 AM.",
    author: "Tom R.",
    neighborhood: "Capitol Hill"
  },
  {
    quote: "I only play once a week but hate wasting time. This pays for itself in one saved trip.",
    author: "Karen P.",
    neighborhood: "Ravenna"
  }
];
```

#### Note
These are draft testimonials. Replace with real customer quotes when available. To collect real testimonials:
1. Email current subscribers asking for feedback
2. Add "Leave a review" link in member dashboard
3. Monitor facility reviews for quotable feedback

---

### 6. Post-Signup Revenue (Lower Priority)

#### Coaching Directory
- "Find a coach" section for paid subscribers
- Coaches pay $20-50/month for listing
- Revenue potential: 5 coaches × $30/month = $1,800/year

#### Stringing Services
- Partner with local stringers
- Affiliate commission or listing fee
- Post-signup feature only (don't distract from conversion)

#### Ball Machine Rentals
- Already successful on homepage (keep as-is)
- 100% margin, machine paid off
- No changes needed

---

## Implementation Priority

### Immediate (January)
1. [ ] Create `/pickleball` landing page with SEO optimization
2. [ ] Add testimonials to paywall page
3. [ ] Extend anonymous gate from 3 days to 7 days

### Q1 (January - March)
4. [ ] Build email signup flow (capture email + preferences)
5. [ ] Build morning alert email system (daily cron job)
6. [ ] Implement email trial logic (+7 days with email)
7. [ ] Remove automatic 50% off first month

### Q2 (April - June, before peak season)
8. [ ] Build referral system (codes, tracking, lottery)
9. [ ] Launch referral program with lottery
10. [ ] Re-engagement email campaign to unconverted trial emails

### Future
11. [ ] Coaching directory (post-signup)
12. [ ] Stringing partnerships

---

## Projected Impact

### Conservative Estimates

| Initiative | New Customers | Revenue Impact |
|------------|---------------|----------------|
| Email trial (better conversion) | +50 | +$4,000/year |
| Referral program | +30 | +$2,400/year |
| Pickleball SEO | +20 | +$1,600/year |
| Reduced churn (annual push) | - | +$500/year |
| **Total** | **+100** | **+$8,500/year** |

### Optimistic Estimates

| Initiative | New Customers | Revenue Impact |
|------------|---------------|----------------|
| Email trial (better conversion) | +100 | +$8,000/year |
| Referral program | +75 | +$6,000/year |
| Pickleball SEO | +40 | +$3,200/year |
| Reduced churn (annual push) | - | +$1,000/year |
| **Total** | **+215** | **+$18,200/year** |

---

## Key Metrics to Track

- Email signup rate (% of visitors who sign up for email trial)
- Email trial → paid conversion rate
- Referral codes generated vs. used
- Pickleball page traffic and conversions
- Morning email open rate and click rate
- Churn rate (monthly vs. annual)
