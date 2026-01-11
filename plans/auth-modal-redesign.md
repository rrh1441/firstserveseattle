# feat: Auth Modal Redesign for /testworkflow

## Overview

Redesign the AuthModal on `/testworkflow` to support dual Sign Up / Sign In modes with Google OAuth as the primary authentication method, while maintaining backward compatibility for legacy password and Apple Sign In users until May 31, 2026.

## Problem Statement

The current AuthModal only supports Magic Link authentication, which:
1. Has friction (email context switch, potential spam folder issues)
2. Doesn't support returning users with passwords
3. Doesn't offer Google OAuth (lowest friction option per research)
4. Apple Sign In costs $99/year and causes Private Relay email issues

## Proposed Solution

### Authentication Strategy

**Sign Up (new users):**
- Google OAuth (primary, one-click)
- Magic Link via email (secondary)
- No password creation, no Apple

**Sign In (existing users):**
- Google OAuth
- Magic Link
- Email + Password (legacy - users with saved passwords find this easier than magic link)
- Apple Sign In (legacy until May 31, 2026)

### Additional UI Changes

1. **KEEP Ball Machine footer button** (revenue generator)
2. Update menu modal with value prop and about highlights
3. Improve CTA button styling in court popup
4. Add Apple user migration banner (REQUIRED - only way to reach Private Relay users)

## Technical Approach

### Phase 1: AuthModal Dual-Mode Implementation

**Files to modify:**
- `src/app/testworkflow/page.tsx` (lines 197-333)

**Implementation:**

```typescript
// src/app/testworkflow/page.tsx

type AuthMode = 'signup' | 'signin';

function AuthModal({ open, onClose, supabase }) {
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google OAuth handler
  const handleGoogleSignIn = async () => {
    setLoading(true);
    localStorage.setItem('last_login_method', 'google');

    const finalRedirect = mode === 'signup' ? '/signup' : '/testworkflow';

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(finalRedirect)}&mode=${mode}`,
      },
    });

    if (error) setError(error.message);
    setLoading(false);
  };

  // Apple OAuth handler (Sign In only, legacy until May 31, 2026)
  const handleAppleSignIn = async () => {
    setLoading(true);
    localStorage.setItem('last_login_method', 'apple');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect_to=/testworkflow&mode=signin`,
      },
    });

    if (error) setError(error.message);
    setLoading(false);
  };

  // Magic Link handler
  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    localStorage.setItem('last_login_method', 'email');

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect_to=/testworkflow&mode=${mode}`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }
    setLoading(false);
  };

  // Password Sign In handler (Sign In mode only)
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    localStorage.setItem('last_login_method', 'email');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "Incorrect email or password."
        : error.message);
    }
    setLoading(false);
  };

  // ... render logic per mode
}
```

**Sign Up Mode UI Structure:**
```
┌──────────────────────────────────┐
│                              [X] │
│                                  │
│  Start your free trial           │
│  7 days free, then $8/month      │
│                                  │
│  [G] Continue with Google        │  <- Primary, top position
│                                  │
│  ─────────── or ───────────      │
│                                  │
│  [____Enter your email_______]   │
│  [    Continue with email    ]   │  <- Magic link
│                                  │
│  Already have an account?        │
│  [Sign In]                       │  <- Mode switch
└──────────────────────────────────┘
```

**Sign In Mode UI Structure:**
```
┌──────────────────────────────────┐
│                              [X] │
│                                  │
│  Welcome back                    │
│  Sign in to see today's courts   │
│                                  │
│  [G] Continue with Google        │
│  [🍎] Continue with Apple        │  <- Legacy until May 31, 2026
│                                  │
│  ─────────── or ───────────      │
│                                  │
│  [____Email_________________]    │
│  [____Password______________]    │
│  [        Sign In           ]    │
│                                  │
│  [Send me a magic link instead]  │  <- Secondary option
│                                  │
│  Don't have an account?          │
│  [Sign Up]                       │
└──────────────────────────────────┘
```

### Phase 2: Apple User Migration Banner

**Detection Logic:**
```typescript
// Check if user is Apple-only (needs migration)
const isAppleOnlyUser = useMemo(() => {
  if (!user?.identities) return false;
  return user.identities.length === 1 &&
         user.identities[0].provider === 'apple';
}, [user]);
```

**Banner Component:**
```typescript
// src/app/testworkflow/page.tsx

function AppleMigrationBanner({ onSetupPassword, onDismiss }) {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-600" />
          <p className="text-sm text-amber-800">
            <span className="font-medium">Apple Sign In retiring May 31.</span>
            {" "}Add a password to keep your account.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSetupPassword}
            className="px-3 py-1 text-sm font-medium text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200"
          >
            Set up password
          </button>
          <button
            onClick={onDismiss}
            className="p-1 text-amber-400 hover:text-amber-600"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Password Setup Flow:**
- Click "Set up password" → Redirect to `/request-password-reset`
- User receives email with password reset link
- User sets password → Now has email+password as fallback

### Phase 3: Menu Modal Updates

**Footer buttons remain unchanged** - Ball Machine button is a revenue generator and stays.

**Update Menu Modal with Value Prop & About:**
```typescript
// src/app/testworkflow/page.tsx - Menu Modal content

{showMenuModal && (
  <div className="fixed inset-0 z-50 flex items-end justify-center">
    <div className="absolute inset-0 bg-black/40" onClick={() => setShowMenuModal(false)} />
    <div className="relative bg-white rounded-t-2xl w-full max-w-md p-6 pb-8 animate-slide-up">
      {/* Header with value prop */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900">First Serve Seattle</h2>
          <p className="text-sm text-gray-500">The only place to see today's open courts</p>
        </div>
        <button onClick={() => setShowMenuModal(false)} className="...">
          <X size={20} />
        </button>
      </div>

      {/* About highlights - always visible */}
      <div className="mb-4 p-4 bg-gray-50 rounded-xl">
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            <span>Every unreserved court across 100+ Seattle locations</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            <span>Updated daily before the overnight lock</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            <span>Filter by lights, pickleball lines, practice walls</span>
          </div>
        </div>
      </div>

      {/* Menu items based on auth state */}
      <div className="space-y-2">
        {/* ... existing menu items ... */}
      </div>
    </div>
  </div>
)}
```

### Phase 4: Court Popup CTA Styling

**Current (lines 719-730):**
```tsx
<button className="w-full py-2.5 px-4 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors">
  See today's availability
</button>
```

**Improved:**
```tsx
<button className="w-full py-3 px-4 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2">
  <Zap size={16} />
  See today's availability
</button>
```

Changes:
- Increased padding (`py-3`)
- Rounded corners (`rounded-xl`)
- Added shadow
- Added icon for visual interest
- Smoother transitions

## Acceptance Criteria

### Functional Requirements
- [ ] AuthModal displays Sign Up mode by default for unauthenticated users
- [ ] AuthModal Sign Up mode shows: Google OAuth (primary) + Magic Link
- [ ] AuthModal Sign In mode shows: Google OAuth + Apple + Password + Magic Link option
- [ ] Mode toggle switches between Sign Up and Sign In
- [ ] Google OAuth redirects correctly and creates/restores session
- [ ] Apple OAuth works for Sign In mode (legacy support)
- [ ] Password sign in works for existing users
- [ ] Magic link sends and completes auth flow
- [ ] Apple-only users see migration banner prompting password setup
- [ ] Banner dismisses and respects dismissal (localStorage)
- [ ] Menu modal shows value prop and about highlights
- [ ] Ball Machine button KEPT in footer (unchanged)
- [ ] Court popup CTA has improved styling

### Non-Functional Requirements
- [ ] All auth methods complete in < 3 seconds (excluding OAuth redirects)
- [ ] Error states display user-friendly messages
- [ ] Loading states show for all async operations
- [ ] Modal animations are smooth (60fps)

## Success Metrics

1. **Conversion rate**: Measure sign-up completion rate before/after (expect +20-30% with Google OAuth)
2. **Apple migration rate**: Track % of Apple-only users who add password before May 31
3. **Support tickets**: Monitor for auth-related issues

## Dependencies & Risks

### Dependencies
- Google OAuth must be configured in Supabase Dashboard
- Google Cloud Console OAuth credentials needed
- Supabase redirect URLs must include the callback path

### Risks

| Risk | Mitigation |
|------|------------|
| Google OAuth not configured in Supabase | Verify setup before deployment |
| Existing Apple users locked out | Migration banner + 5 month runway |
| Magic link emails going to spam | Google OAuth as primary reduces reliance |

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/testworkflow/page.tsx` | AuthModal redesign, menu modal updates, banner, footer |
| `src/app/auth/callback/route.ts` | Verify Google OAuth handling (likely no changes needed) |

## References

### Internal
- Current AuthModal: `src/app/testworkflow/page.tsx:197-333`
- SocialAuthButtons (Apple): `src/app/components/SocialAuthButtons.tsx:1-74`
- Google OAuth example: `src/app/testlogin/page.tsx:31-43`
- Login form (password): `src/app/login/LoginFormClient.tsx:56-82`
- Landing page highlights: `src/app/components/StaticLandingPage.tsx:150-172`

### External
- [Supabase Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase signInWithOAuth](https://supabase.com/docs/reference/javascript/auth-signinwithoauth)
- [Google Branding Guidelines](https://developers.google.com/identity/branding-guidelines)
