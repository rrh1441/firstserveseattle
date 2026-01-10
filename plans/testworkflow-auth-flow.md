# feat: Clean Authentication Flow for /testworkflow

## Overview

Redesign the authentication and signup flow for `/testworkflow` to provide a clear, differentiated experience for different user types while keeping all interactions inline (no redirects to /login).

**Current Issues:**
1. Court popup has cluttered inline auth buttons - should be a simple CTA
2. No differentiation between new users, returning subscribers, and lapsed subscribers
3. Trial expiry logic has a bug - expired trials still get access
4. Menu modal shows same options regardless of auth state
5. `last_login_method` not stored for email magic link users

## User States

| State | `isAuthenticated` | `hasAccess` | `isTrialExpired` | Should See |
|-------|-------------------|-------------|------------------|------------|
| **Anonymous (new)** | false | false | false | Yesterday's data + "See today's availability" CTA |
| **Anonymous (returning)** | false | false | false | Yesterday's data + "Welcome back!" (AuthModal already handles via localStorage) |
| **Trial (active)** | true | true | false | Today's data + "X days left" badge |
| **Trial (expired)** | true | false | true | Yesterday's data + "Upgrade to continue" button → goes to /signup |
| **Paid subscriber** | true | true | false | Today's data + "Manage subscription" in menu |
| **Canceled** | true | false | false | Yesterday's data + "Reactivate" → goes to /signup |

## Proposed Solution

### 1. Simplify Court Popup/Card

Replace `InlineAuthPrompt` (cluttered auth buttons) with a single clean CTA button:

```
+----------------------------------+
| [Facility Name]                  |
| [Address]                        |
| [Yesterday badge]                |
|                                  |
| [Court timeline grid]            |
|                                  |
| +------------------------------+ |
| | See Today's Availability     | | <-- Single button, opens AuthModal
| +------------------------------+ |
+----------------------------------+
```

### 2. AuthModal Already Handles Returning Users

The AuthModal already shows "Welcome back!" for users with `lastLoginMethod` in localStorage. No changes needed here.

**Note:** Lapsed/canceled users are already authenticated - they don't need AuthModal. They need to go to checkout (/signup) to reactivate.

### 3. Make Menu Modal Context-Aware

**Unauthenticated:**
```
+----------------------------------+
| First Serve Seattle              |
|                                  |
| [Sign In / Sign Up]              |
|   Start your free trial          |
|                                  |
| [About]                          |
+----------------------------------+
```

**Authenticated + Active:**
```
+----------------------------------+
| First Serve Seattle              |
|                                  |
| [Account]                        |
|   Manage subscription            |
|                                  |
| [Sign Out]                       |
|                                  |
| [About]                          |
+----------------------------------+
```

**Authenticated + Expired/Canceled:**
```
+----------------------------------+
| First Serve Seattle              |
|                                  |
| [Upgrade]                        |
|   Your trial ended → /signup     |
|                                  |
| [Sign Out]                       |
|                                  |
| [About]                          |
+----------------------------------+
```

### 4. Fix Access Control Logic

Current bug in `/testworkflow/page.tsx:543-549`:
```typescript
// BUG: "trialing" in array means expired trials still get access
const isActive = ["active", "trialing", "paid"].includes(subscriber.status);
```

Fix (from `/testc/page.tsx`):
```typescript
const isPaidSubscriber = ["active", "paid"].includes(subscriber.status);
const trialEndMs = subscriber.trial_end ? subscriber.trial_end * 1000 : null;
const trialEnd = trialEndMs ? new Date(trialEndMs) : null;
const inActiveTrial = subscriber.status === "trialing" && !!trialEnd && trialEnd > new Date();
setHasAccess(isPaidSubscriber || inActiveTrial);
```

## Acceptance Criteria

### Functional

- [ ] Court popup shows single "See today's availability" button (not inline auth buttons)
- [ ] Clicking CTA in popup opens AuthModal
- [ ] AuthModal shows personalized content based on `last_login_method`
- [ ] Menu modal shows different options for auth vs non-auth users
- [ ] Expired trial users see yesterday's data and upgrade prompt
- [ ] `last_login_method` is stored for email magic link users
- [ ] Authenticated users can sign out from menu

### Non-Functional

- [ ] No page redirects during auth flow (except OAuth provider)
- [ ] Modal animations remain smooth
- [ ] Auth state changes reflect immediately (no page refresh needed)

## Implementation Phases

### Phase 1: Fix Access Control Bug + Add State Variables

**Files:** `src/app/testworkflow/page.tsx`

1. Add new state variables: `isAuthenticated`, `isTrialExpired`
2. Fix trial expiry logic (copy from testc)
3. Fix timestamp handling (epoch seconds * 1000)
4. Add `handleSignOut` function

### Phase 2: Simplify Court Popup + List View

**Files:** `src/app/testworkflow/page.tsx`

1. Remove `InlineAuthPrompt` from map popup
2. Remove `InlineAuthPrompt` from list view
3. Add contextual CTA button:
   - Not authenticated: "See today's availability" → opens AuthModal
   - Authenticated but expired: "Upgrade to continue" → goes to /signup
4. Store `last_login_method` for email magic link users in AuthModal

### Phase 3: Make Menu Modal Context-Aware

**Files:** `src/app/testworkflow/page.tsx`

1. Show different options based on `isAuthenticated` and `hasAccess`
2. Unauthenticated: "Sign In / Sign Up" → opens AuthModal
3. Authenticated + hasAccess: "Account" → /billing, "Sign Out"
4. Authenticated + expired: "Upgrade" → /signup, "Sign Out"
5. Always show "About"

## MVP Implementation

### Changes to `src/app/testworkflow/page.tsx`

#### 1. Add new state variables:

```typescript
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [isTrialExpired, setIsTrialExpired] = useState(false);
```

#### 2. Fix checkAuth logic (~line 543):

```typescript
// In checkAuth function
const { data: { user } } = await supabase.auth.getUser();

if (user) {
  setIsAuthenticated(true);  // User has a session

  const { data: subscriber } = await supabase
    .from("subscribers")
    .select("status, trial_end")
    .eq("user_id", user.id)
    .single();

  if (subscriber) {
    const isPaidSubscriber = ["active", "paid"].includes(subscriber.status);
    const trialEndMs = subscriber.trial_end ? subscriber.trial_end * 1000 : null;
    const trialEnd = trialEndMs ? new Date(trialEndMs) : null;
    const now = new Date();

    const inActiveTrial = subscriber.status === "trialing" && !!trialEnd && trialEnd > now;
    const trialExpired = subscriber.status === "trialing" && !!trialEnd && trialEnd <= now;

    setHasAccess(isPaidSubscriber || inActiveTrial);
    setIsTrialExpired(trialExpired);

    if (inActiveTrial && trialEnd) {
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      setTrialDaysRemaining(daysLeft);
    }
  }
} else {
  setIsAuthenticated(false);
  setHasAccess(false);
}
```

#### 3. Add handler functions:

```typescript
const handleSignOut = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem('last_login_method');
  setIsAuthenticated(false);
  setHasAccess(false);
  setIsTrialExpired(false);
  setShowMenuModal(false);
};
```

#### 4. Replace InlineAuthPrompt in popup with contextual CTA:

```tsx
{/* Contextual CTA based on auth state */}
{!hasAccess && (
  <div className="mt-3 pt-3 border-t border-gray-200">
    {isAuthenticated && isTrialExpired ? (
      // Authenticated but expired - go to checkout
      <>
        <button
          onClick={() => router.push('/signup')}
          className="w-full py-2.5 px-4 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors"
        >
          Upgrade to continue
        </button>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Your trial has ended
        </p>
      </>
    ) : (
      // Not authenticated - open auth modal
      <>
        <button
          onClick={() => setShowAuthModal(true)}
          className="w-full py-2.5 px-4 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors"
        >
          See today's availability
        </button>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          Free 7-day trial
        </p>
      </>
    )}
  </div>
)}
```

#### 5. Store `last_login_method` for email users in AuthModal:

```typescript
// In handleSendMagicLink, before supabase.auth.signInWithOtp
localStorage.setItem('last_login_method', 'email');
```

#### 6. Update Menu Modal to be context-aware:

```tsx
<div className="space-y-2">
  {isAuthenticated ? (
    hasAccess ? (
      // Active subscriber
      <>
        <button
          onClick={() => { setShowMenuModal(false); router.push('/billing'); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <CreditCard size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Account</p>
            <p className="text-sm text-gray-500">Manage subscription</p>
          </div>
        </button>
        <button onClick={handleSignOut} className="...">
          <LogOut /> Sign Out
        </button>
      </>
    ) : (
      // Expired trial or canceled
      <>
        <button
          onClick={() => { setShowMenuModal(false); router.push('/signup'); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50"
        >
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Zap size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Upgrade</p>
            <p className="text-sm text-gray-500">Your trial has ended</p>
          </div>
        </button>
        <button onClick={handleSignOut} className="...">
          <LogOut /> Sign Out
        </button>
      </>
    )
  ) : (
    // Not authenticated
    <button
      onClick={() => { setShowMenuModal(false); setShowAuthModal(true); }}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50"
    >
      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
        <LogIn size={20} className="text-emerald-600" />
      </div>
      <div>
        <p className="font-semibold text-gray-900">Sign In / Sign Up</p>
        <p className="text-sm text-gray-500">Start your free trial</p>
      </div>
    </button>
  )}

  {/* About - always shown */}
  <button onClick={() => { setShowMenuModal(false); router.push('/about'); }} className="...">
    <Info /> About
  </button>
</div>
```

## References

### Internal

- Current implementation: `src/app/testworkflow/page.tsx`
- Working access logic: `src/app/testc/page.tsx:339-343`
- Auth callback: `src/app/auth/callback/route.ts`
- Subscriber schema: `sql/add_identity_columns.sql`

### Best Practices Applied

- Bottom sheet modal pattern for mobile (Material Design 3)
- Progressive disclosure - simple CTA first, full auth options in modal
- "Last used" indicator for returning users
- Lazy registration - show value (yesterday's data) before requiring signup

### User Research Insights

- 88% of users won't return after bad auth UX
- Bottom sheets get 25-30% higher engagement than traditional modals
- Single-field email entry reduces friction vs showing all options
