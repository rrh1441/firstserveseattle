# Migration: /testworkflow → Production Members Area

## Overview

Migrate `/testworkflow` to become the production members experience, replacing the current `/members` and `/tennis-courts` routes. Simultaneously deprecate Apple Sign-In for new users.

**Goals:**
1. `/testworkflow` style becomes the new authenticated experience
2. New users: Google + Email only (no Apple)
3. Existing Apple users: Can still sign in, encouraged to migrate
4. Clean route structure

---

## Current State

| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Static landing page | Keep for SEO/marketing |
| `/testworkflow` | New map+list UI with auth | **Ready for production** |
| `/members` | Current members area | Replace with testworkflow |
| `/tennis-courts` | Old court list with paywall | Deprecate |
| `/testc` | Test combined view | Archive |
| `/testa`, `/testb` | Earlier test pages | Archive |

---

## Target Route Structure

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/` | Landing page → redirects authenticated users to `/courts` | No |
| `/courts` | Production members area (testworkflow style) | Yes (today's data) |
| `/courts?preview=true` | Yesterday's data for non-auth users | No |
| `/members` | Redirect → `/courts` | - |
| `/billing` | Subscription management | Yes |
| `/signup` | Stripe checkout | No |
| `/login` | Sign in page | No |

---

## Apple Deprecation Strategy

### New Users (Signup)
- **Remove Apple button entirely**
- Show only: Google OAuth + Email magic link
- Simpler, no private relay email issues

### Existing Users (Login)
- **Show Apple only if they've used it before**
- Check: `localStorage.getItem('last_login_method') === 'apple'`
- Or: User has `apple_provider_id` in database

### Migration Path for Apple Users
- Keep `AppleMigrationBanner` component
- Encourage linking Google account
- Eventually: Email existing Apple users about transition

---

## Implementation Phases

### Phase 1: Create /courts Route

**Copy and clean up testworkflow:**

```
src/app/courts/
├── page.tsx          # Copy from testworkflow, cleaned up
└── loading.tsx       # Loading state
```

**Changes from testworkflow:**
1. Remove Apple from AuthModal (Google + Email only for new users)
2. Fix trial expiry bug (from testworkflow-auth-flow.md)
3. Clean up any test code/comments
4. Update redirects to use `/courts` instead of `/testworkflow`
5. **Fix mobile bottom bar:**
   - Remove Ball Machine button from bottom bar
   - Single "First Serve Seattle" FAB
   - Add Ball Machine link as first item in menu modal (blue accent)
6. **Remove 50% off first month:**
   - Don't pass `offerId: 'fifty_percent_off_first_month'` to checkout
   - Promo codes automatically enabled via `allow_promotion_codes: true`
7. **Add notifications link to menu:**
   - Add "Court Alerts" / Bell icon to menu for trial + paid users
   - Links to `/alerts` page (already exists)

**Files to modify:**
- `src/app/courts/page.tsx` (new)
- Auth callback to redirect to `/courts` instead of `/members`

---

## New Checkout Page

**Problem:** Current `/signup` page is a mess:
- Hardcodes 50% off offer
- Has password-based signup (we're going passwordless)
- Shows Apple button
- Ugly password requirements UI
- Too much going on

**Solution:** New clean checkout page for authenticated users.

### When users hit checkout

| User State | How they got here | What they need |
|------------|-------------------|----------------|
| Trial user | Clicked "Subscribe" in menu | Plan selection → Stripe |
| Expired trial | Clicked "Upgrade" CTA | Plan selection → Stripe |
| Canceled user | Clicked "Reactivate" CTA | Plan selection → Stripe |

**Key insight:** They're already authenticated. No account creation needed.

### New Checkout UI

```
┌─────────────────────────────────────────────────────┐
│                    🎾                                │
│                                                     │
│         Unlock Today's Court Availability           │
│                                                     │
│  ┌───────────────────┐  ┌───────────────────┐      │
│  │     MONTHLY       │  │      ANNUAL       │      │
│  │                   │  │    ⭐ Best Value  │      │
│  │     $8/month      │  │                   │      │
│  │                   │  │  $64/year         │      │
│  │  [Select]         │  │  ($5.33/month)    │      │
│  │                   │  │                   │      │
│  └───────────────────┘  │  [Select]         │      │
│                         └───────────────────┘      │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  Continue to Payment                    →   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ✓ Secure checkout via Stripe                      │
│  ✓ Cancel anytime                                  │
│  ✓ Promo codes accepted at checkout                │
│                                                     │
│  Signed in as ryan@example.com                     │
│  Not you? Sign out                                 │
└─────────────────────────────────────────────────────┘
```

### Implementation

**New file:** `src/app/checkout/page.tsx`

```tsx
// Minimal checkout for authenticated users
export default function CheckoutPage() {
  const [plan, setPlan] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        // Not authenticated, redirect to /courts
        router.push('/courts');
        return;
      }
      setUser(data.user);
    });
  }, []);

  const handleCheckout = async () => {
    setLoading(true);

    // Get trial_end if user is in trial (to honor remaining days)
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('trial_end')
      .eq('user_id', user.id)
      .single();

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        email: user.email,
        plan,
        userId: user.id,
        trialEnd: subscriber?.trial_end, // Honor remaining trial
        // NO offerId - allows promo codes
      }),
    });

    const { url } = await response.json();
    window.location.href = url;
  };

  return (
    // Clean UI as shown above
  );
}
```

### Route Changes

| Old | New | Notes |
|-----|-----|-------|
| `/signup` | Keep for now | Legacy, will deprecate |
| `/checkout` | **NEW** | Clean checkout for auth'd users |
| CTAs in testworkflow | Point to `/checkout` | Not `/signup` |

### What's different from /signup

| Aspect | Old /signup | New /checkout |
|--------|-------------|---------------|
| Account creation | Yes (email/password) | No (already auth'd) |
| Apple button | Yes | No |
| 50% off | Hardcoded | No (promo codes via Stripe) |
| Password requirements | Yes (ugly) | No |
| Design | Cluttered | Clean, focused |
| Auth state | Optional | Required (redirects if not) |

### Phase 2: Update Auth Flow

**AuthModal changes:**
```tsx
// BEFORE: Apple + Google + Email
// AFTER: Google + Email only (for new users)

// In AuthModal:
const showAppleButton = localStorage.getItem('last_login_method') === 'apple';

{showAppleButton && (
  <AppleSignInButton />
)}
<GoogleSignInButton />  {/* Always show */}
<EmailMagicLink />      {/* Always show */}
```

**Auth callback (`src/app/auth/callback/route.ts`):**
- Change default redirect from `/members` to `/courts`
- Keep Apple identity handling for existing users

### Phase 3: Route Redirects

**Update redirects:**

| Old Route | New Route | Method |
|-----------|-----------|--------|
| `/members` | `/courts` | Next.js redirect in page.tsx |
| `/tennis-courts` | `/courts` | Next.js redirect |
| `/testworkflow` | `/courts` | Next.js redirect |

**In `src/app/members/page.tsx`:**
```tsx
import { redirect } from 'next/navigation';
export default function MembersPage() {
  redirect('/courts');
}
```

### Phase 4: Landing Page Updates

**Update `/` (landing page):**
- Authenticated users → redirect to `/courts`
- Keep current landing for non-auth users
- Update CTAs to point to `/signup` or `/login`

**Update signup flow:**
- Remove Apple from `/signup` page
- Post-checkout redirect to `/courts` instead of `/members`

### Phase 5: Cleanup

**Archive/delete old routes:**
```
DELETE:
- src/app/testa/
- src/app/testb/
- src/app/testc/
- src/app/testworkflow/ (after /courts is stable)
- src/app/tennis-courts/ (after redirects work)

KEEP:
- src/app/members/ (as redirect only)
```

**Remove old components:**
```
DELETE (after migration):
- src/app/tennis-courts/components/DaysCounter.tsx
- src/app/tennis-courts/components/paywall.tsx
- src/lib/shouldShowPaywall.ts (localStorage trial logic)
```

---

## AuthModal Specification

### For Unauthenticated Users (Signup)

```
┌─────────────────────────────────────┐
│  See Today's Court Availability     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🔵 Continue with Google     │    │
│  └─────────────────────────────┘    │
│                                     │
│  ──────── or ────────               │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 📧 Email me a sign-in link  │    │
│  └─────────────────────────────┘    │
│                                     │
│  Free 7-day trial • No card needed  │
└─────────────────────────────────────┘
```

### For Returning Apple Users (Login)

```
┌─────────────────────────────────────┐
│  Welcome back!                      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🍎 Continue with Apple      │    │  ← Only if last_login_method === 'apple'
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🔵 Continue with Google     │    │
│  └─────────────────────────────┘    │
│                                     │
│  ──────── or ────────               │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 📧 Email me a sign-in link  │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

---

## Session & Access Control

**Key principle: Separate authentication from authorization.**

| Concept | What it means | How often |
|---------|---------------|-----------|
| **Authentication** | "Who are you?" | Long-lived (weeks/months) |
| **Authorization** | "What can you see?" | Every page load |

**Implementation:**
- Supabase sessions stay active for extended periods (no constant re-login)
- On every page load, `checkAuth()` queries `subscribers` table for current status
- Canceled/expired users remain signed in but see yesterday's data
- No sensitive data = no need for frequent re-auth

```typescript
// checkAuth runs on mount - checks BOTH auth AND access
const { data: { user } } = await supabase.auth.getUser();  // Auth (cached)

if (user) {
  setIsAuthenticated(true);

  // Authorization check - always fresh from DB
  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("status, trial_end")
    .eq("user_id", user.id)
    .single();

  // Determine access based on current subscription state
  const hasAccess = isPaidOrActiveTrial(subscriber);
  setHasAccess(hasAccess);  // Controls today vs yesterday data
}
```

**User experience by state:**

| State | Signed In | Sees Today's Data | Action Shown |
|-------|-----------|-------------------|--------------|
| Anonymous | No | No (yesterday) | "See today's availability" → AuthModal |
| Active trial | Yes | Yes | Trial days remaining badge |
| Expired trial | Yes | No (yesterday) | "Upgrade to continue" → /signup |
| Paid subscriber | Yes | Yes | "Manage subscription" in menu |
| Canceled | Yes | No (yesterday) | "Reactivate" → /signup |

---

## Win-Back UI for Canceled/Expired Users

**Key insight:** These users are already signed in and see the product working with yesterday's data. They just need a nudge to resubscribe.

### Court Card/Popup CTA (instead of AuthModal)

```
┌─────────────────────────────────────┐
│  Green Lake Tennis Courts           │
│  6 courts • Lights                  │
│                                     │
│  ⚠️ YESTERDAY'S AVAILABILITY        │
│  [Timeline showing yesterday]       │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🎾 Get Today's Openings    │    │  ← Green, prominent
│  └─────────────────────────────┘    │
│  Just $8/month • Cancel anytime     │
└─────────────────────────────────────┘
```

### Menu Modal for Canceled/Expired

```
┌─────────────────────────────────────┐
│  First Serve Seattle            ✕   │
│  Welcome back!                      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🎾 Reactivate Subscription  │    │  ← Primary, green
│  │    See today's court times  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ⚡ Seattle Ball Machine     │    │
│  │    Rent a ball machine      │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Sign Out]                         │
│  [About]                            │
└─────────────────────────────────────┘
```

### Menu Modal for Active Trial/Paid Users

```
┌─────────────────────────────────────┐
│  First Serve Seattle            ✕   │
│  [Trial badge: 5 days left]         │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🔔 Court Alerts             │    │  ← Links to /alerts
│  │    Get notified of openings │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 💳 Manage Subscription      │    │  ← Links to /billing
│  │    Update payment, cancel   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ⚡ Seattle Ball Machine     │    │
│  │    Rent a ball machine      │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Sign Out]                         │
│  [About]                            │
└─────────────────────────────────────┘
```

### Copy Variations

**For expired trial:**
- "Your free trial ended"
- "Pick up where you left off — $8/month"
- "Upgrade to see today's courts"

**For canceled subscriber:**
- "Welcome back!"
- "We've missed you — reactivate for $8/month"
- "Ready to play? See today's openings"

### Implementation

```tsx
// In court popup/card
{!hasAccess && isAuthenticated && (
  <div className="mt-3 pt-3 border-t border-gray-200">
    <p className="text-xs text-amber-600 font-medium mb-2">
      {isTrialExpired ? "Your free trial ended" : "Welcome back!"}
    </p>
    <button
      onClick={() => router.push('/signup')}
      className="w-full py-2.5 px-4 bg-emerald-600 text-white rounded-lg font-semibold text-sm"
    >
      {isTrialExpired ? "Upgrade to continue" : "Reactivate subscription"}
    </button>
    <p className="text-[10px] text-gray-400 text-center mt-2">
      $8/month • Cancel anytime
    </p>
  </div>
)}
```

---

## Mobile UI: Bottom Button

**Problem:** Two buttons ("First Serve Seattle" + "Ball Machine") overflow on narrow phones.

**Solution:** Single branded button with Ball Machine link in menu.

### Before (broken on mobile)
```
[First Serve Seattle ↑] [⚡ Ball Machine]
```

### After (clean single FAB)
```
[🎾 First Serve Seattle ↑]
```

**Menu modal contents:**
```
┌─────────────────────────────────────┐
│  First Serve Seattle            ✕   │
│  The only place to see today's...   │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ⚡ Seattle Ball Machine     │    │  ← Prominent placement
│  │    Rent a ball machine      │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Account / Sign In options...]     │
│  [About]                            │
└─────────────────────────────────────┘
```

**Implementation:**
1. Remove Ball Machine button from bottom bar
2. Add Ball Machine as first item in menu modal (with blue accent to stand out)
3. Keep "First Serve Seattle" text on FAB (not "Menu") for branding

---

## Database Considerations

**No schema changes needed.** Existing tables support everything:
- `subscribers.apple_provider_id` - Already tracks Apple users
- `subscribers.google_provider_id` - Already tracks Google users
- `subscribers.status`, `trial_end` - Trial logic already works

---

## Environment Variables

No changes needed. Current variables support both providers:
```
# Keep these (for existing Apple users)
APPLE_CLIENT_ID
APPLE_CLIENT_SECRET

# Primary auth going forward
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

---

## Pre-Launch: Test Google Auth Flow

**Before pushing /testworkflow live, verify Google OAuth account creation works end-to-end.**

### Test Steps

1. **Use incognito/private window** (no existing session)

2. **Go to `/testworkflow`** and click "See today's availability"

3. **Click "Continue with Google"**
   - Should redirect to Google OAuth consent screen
   - Select a Google account (use a test email you control)

4. **After Google redirect, verify:**
   - [ ] Redirected back to `/testworkflow` (or `/auth/callback` then to testworkflow)
   - [ ] User is now authenticated (check `hasAccess` state)
   - [ ] `subscribers` table has new row with:
     - `user_id` matching Supabase auth user
     - `email` = your Google email
     - `status` = 'trialing'
     - `trial_end` = 7 days from now (epoch seconds)
     - `google_provider_id` populated

5. **Verify trial access:**
   - [ ] See today's data (not yesterday's)
   - [ ] Trial badge shows "7 days left"
   - [ ] Menu shows "Court Alerts" and "Manage Subscription"

6. **Test checkout flow:**
   - [ ] Click "Manage Subscription" or go to `/signup`
   - [ ] Email should be pre-filled
   - [ ] Promo code field should be visible (not auto-applied 50% off)
   - [ ] Complete checkout with Stripe test card

### Quick DB Check

```sql
-- After Google signup, verify subscriber record
SELECT
  email,
  status,
  to_timestamp(trial_end) as trial_ends_at,
  google_provider_id,
  apple_provider_id
FROM subscribers
WHERE email = 'your-test@gmail.com';
```

### Common Issues

| Issue | Likely Cause | Fix |
|-------|--------------|-----|
| "Callback URL mismatch" | Google OAuth redirect URI not configured | Add `https://yoursite.com/auth/callback` to Google Cloud Console |
| User created but no subscriber row | Auth callback not creating subscriber | Check `src/app/auth/callback/route.ts` |
| Trial not starting | `trial_end` not being set | Check callback logic for trialing status |

---

## Testing Checklist

### New User Flow (No Apple)
- [ ] Visit `/courts` → see yesterday's data
- [ ] Click "See today's availability" → AuthModal shows Google + Email only
- [ ] Sign up with Google → 7-day trial starts
- [ ] Sign up with Email magic link → 7-day trial starts
- [ ] No Apple button visible anywhere in signup flow

### Existing Apple User Flow
- [ ] Visit `/courts` → AuthModal shows Apple + Google + Email
- [ ] Sign in with Apple → works, sees today's data
- [ ] AppleMigrationBanner appears encouraging Google link
- [ ] Can link Google account from settings

### Redirects
- [ ] `/members` → redirects to `/courts`
- [ ] `/tennis-courts` → redirects to `/courts`
- [ ] `/testworkflow` → redirects to `/courts`
- [ ] Auth callback redirects to `/courts`
- [ ] Post-checkout redirects to `/courts`

### Trial/Access Logic
- [ ] Active trial → sees today's data
- [ ] Expired trial → sees yesterday's data + upgrade prompt
- [ ] Paid subscriber → sees today's data
- [ ] Canceled subscriber → sees yesterday's data + reactivate prompt

### Session Persistence
- [ ] Close browser, reopen → still signed in (no re-auth needed)
- [ ] Canceled user → stays signed in but sees yesterday's data
- [ ] Expired trial → stays signed in but sees upgrade prompt

### Win-Back Flow
- [ ] Expired trial user sees "Your free trial ended" + "Upgrade" CTA in popup
- [ ] Canceled user sees "Welcome back!" + "Reactivate" CTA in popup
- [ ] Menu modal shows "Reactivate Subscription" as primary for lapsed users
- [ ] CTA links to /signup (not AuthModal - they're already signed in)
- [ ] /signup pre-fills their email from session

### Mobile UI
- [ ] Bottom bar shows single "First Serve Seattle" button (no overflow)
- [ ] Menu modal opens with Ball Machine link
- [ ] Ball Machine link works (opens seattleballmachine.com)
- [ ] Test on 320px width (iPhone SE)

### New Checkout Page (/checkout)
- [ ] `/checkout` requires authentication (redirects to /courts if not)
- [ ] Shows user's email ("Signed in as...")
- [ ] Plan selector works (monthly/annual toggle)
- [ ] "Continue to Payment" goes to Stripe
- [ ] No 50% off auto-applied
- [ ] Promo code field visible on Stripe checkout
- [ ] Trial users: remaining trial days honored
- [ ] Clean, modern design (not cluttered like old /signup)

### Court Alerts (Notifications)
- [ ] Trial users see "Court Alerts" in menu
- [ ] Paid users see "Court Alerts" in menu
- [ ] Clicking "Court Alerts" goes to `/alerts`
- [ ] Can set up alert preferences
- [ ] Canceled/expired users do NOT see Court Alerts (or it prompts to resubscribe)

---

## Rollback Plan

If issues arise:
1. Keep `/testworkflow` running in parallel
2. Revert auth callback to redirect to `/members`
3. Remove `/courts` route
4. Re-enable Apple in signup flow

---

## Timeline

| Phase | Tasks | Dependencies |
|-------|-------|--------------|
| 1 | Create `/courts` route | None |
| 2 | Update auth flow (remove Apple for new users) | Phase 1 |
| 3 | Add redirects | Phase 2 |
| 4 | Update landing page | Phase 3 |
| 5 | Cleanup old routes | Phase 4 stable for 1 week |

---

## Success Metrics

- [ ] No new Apple signups after migration
- [ ] Existing Apple users can still sign in
- [ ] No increase in auth-related support requests
- [ ] Trial conversion rate maintained or improved

---

## References

- `plans/testworkflow-auth-flow.md` - Auth flow details
- `plans/low-friction-user-flow-visit-to-subscribe.md` - UX strategy
- `src/app/testworkflow/page.tsx` - Source for new /courts
- `src/app/components/AppleMigrationBanner.tsx` - Existing migration UI
