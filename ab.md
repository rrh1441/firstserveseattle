# A/B Test Plan: 5-Day Trial vs. $4 Paid-Upfront

## Hypothesis

A low-friction paid offer ($4 for first month, 50% off, no trial) will convert
more *paying* users than the current 5-day free trial, because:

- Trial users churn before billing.
- A $4 commitment filters for genuine intent without scaring price-sensitive users.

## Test design: day-bucketed (not per-user) A/B

Each calendar day, **every new visitor sees the same variant.** A returning
user within the same UTC day always sees the same offer. The variant only
governs what *new visitors* see on `/signup` and `/checkout`. Existing
trials/subscribers are unaffected.

### Why day-bucketed instead of classic per-user A/B

- Avoids the "I saw $4 yesterday, why is it $0 today?" problem on shared
  devices, incognito sessions, and cross-device returns.
- Simpler — no cookie/localStorage cohort management, no hydration flicker.
- Tradeoff: noisier (weather, news, day-of-week confounds), so we run for
  multiple weeks with an interleaved schedule.

### Schedule

Two-week interleaved rotation that balances day-of-week:

```
        Mon Tue Wed Thu Fri Sat Sun
Week 1:  T   P   P   T   T   P   P
Week 2:  P   T   T   P   P   T   T
```

Repeat for **4 weeks minimum** (2 full rotations). Target ≥ 200 signups per
variant before reading the result.

## Implementation sketch

### 1. Variant helper — `src/lib/dailyVariant.ts` (new)

```ts
export type Variant = 'trial' | 'paid';

const EXPERIMENT_START = '2026-05-12'; // Monday — set when launching
const SCHEDULE: Variant[] = [
  'trial', 'paid',  'paid',  'trial', 'trial', 'paid',  'paid',  // wk 1
  'paid',  'trial', 'trial', 'paid',  'paid',  'trial', 'trial', // wk 2
];

export function variantForDate(d = new Date()): Variant {
  const [y, m, day] = EXPERIMENT_START.split('-').map(Number);
  const start = Date.UTC(y, m - 1, day);
  const today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const idx = Math.floor((today - start) / 86_400_000);
  if (idx < 0) return 'trial'; // pre-experiment default
  return SCHEDULE[idx % SCHEDULE.length];
}
```

Pure function, no I/O — safe to call from server components, route handlers,
and (if needed) the client.

### 2. Copy — `src/lib/paywallCopy.ts` (extend existing)

```ts
export const VARIANT_COPY = {
  trial: {
    cta: 'Start 5-Day Free Trial',
    sub: 'No charge today. Cancel anytime.',
    headline: 'Try it free for 5 days',
  },
  paid: {
    cta: 'Get First Month for $4',
    sub: '50% off your first month. Renews at $8/mo. Cancel anytime.',
    headline: 'First month $4 — half off',
  },
} as const;
```

### 3. Signup page — `src/app/signup/page.tsx`

Currently a client component. To avoid hydration flicker, either:

- **Option A (preferred):** Convert the page shell to a Server Component that
  reads `variantForDate()` and passes `variant` + copy as props to a smaller
  client form. The form behavior branches on `variant`.
- **Option B:** Keep client, read variant via a tiny `/api/variant` route on
  mount and gate the render. Simpler diff, but causes a flash.

Branching behavior:

- `variant === 'trial'` → existing flow. Submit creates Supabase user +
  trial subscriber via `/api/link-subscriber`, redirects to `/?welcome=true`.
- `variant === 'paid'` → submit creates Supabase user, then **immediately**
  posts to `/api/create-checkout-session` with `variant: 'paid'`. Skip the
  trial-creation step entirely. Redirect to Stripe.

`PlanSelector` should hide annual when `variant === 'paid'` (annual doesn't
make sense as a paid-trial alternative; keeps the comparison clean).

### 4. API — `src/app/api/link-subscriber/route.ts`

Re-derive the variant server-side (don't trust the client):

```ts
const variant = variantForDate();
if (variant === 'paid') {
  return NextResponse.json({ skipTrial: true, variant: 'paid' });
}
// existing trial-creation logic continues...
```

Stamp `signup_variant` on the new `subscribers` row. **Required for
attribution** — without this we can't tell post-hoc which variant a paying
user signed up under.

### 5. API — `src/app/api/create-checkout-session/route.ts`

Accept `variant` from the body, but also re-derive `variantForDate()` and
require they match (defense against tampering). When `variant === 'paid'`:

- Attach the 50%-off Stripe coupon (one-time, first invoice).
- Omit `subscription_data.trial_period_days`.
- Force `payment_method_collection: 'always'`.

When `variant === 'trial'`:

- Set `subscription_data.trial_period_days: 5`.
- No coupon.

### 6. Database

Add column to `subscribers`:

```sql
alter table subscribers add column signup_variant text check (signup_variant in ('trial','paid'));
```

Backfill existing rows to `'trial'` (that's what they all got).

### 7. Analytics

Fire two events, both including `{ variant, signup_date_utc }`:

- `signup_variant_assigned` — in `/signup` server render.
- `subscription_activated` — in Stripe webhook on first successful payment.

Reading the test: group `subscription_activated` by `signup_variant` from
the `subscribers` row, divide by `signup_variant_assigned` impressions for
that day. Compare paid-conversion rate and 30-day retention per variant.

## Open questions before implementation

1. **Stripe coupon** — does a 50%-off-once coupon already exist in Stripe?
   If not, create one (`once` duration, 50% off, restrict to monthly price).
2. **Start date** — when do you want the rotation to begin? `EXPERIMENT_START`
   needs to be a Monday for the schedule above to align cleanly.
3. **Duration / stop criteria** — minimum 4 weeks. Stop earlier only if the
   gap is huge (e.g. one variant is 3× the other on paid conversion across
   ≥ 200 signups each).
4. **Annual plan during `paid` days** — hide it entirely, or show it as a
   secondary option without the discount? Hiding keeps the test clean.
5. **What counts as the success metric** — paid conversion at day 7?
   30-day retained revenue? Pick before launching so we don't p-hack.

## Risks

- **Day-of-week confound** — interleaved schedule mitigates but doesn't
  eliminate. 4-week minimum is the hedge.
- **Word-of-mouth contamination** — someone tells a friend "it's $4!", they
  visit on a trial day, get confused. Low volume, probably fine.
- **Calendar effects** — holidays, weather, viral moments. If something big
  happens (heat wave, news mention), tag those days and consider excluding.
- **Sticky-variant edge case** — if a `paid`-day visitor abandons checkout
  and returns on a `trial` day, they'll see the trial offer. That's
  acceptable — they self-selected by abandoning.
