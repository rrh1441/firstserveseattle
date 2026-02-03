x# Fix: Google OAuth "transactional" Error

## Overview

Google OAuth from `/testworkflow` is broken. Users see "Continue to transactional" on the consent screen and get blocked with error: "Access blocked: transactional can only be used within its organization."

**Root Cause:** This is a **Google Cloud Console configuration issue**, not a code issue. The OAuth consent screen is:
1. Named "transactional" (wrong app name)
2. Set to "Internal" user type (restricts to organization members only)

## Problem Statement

When users click "Continue with Google" on the `/testworkflow` page:
1. Google OAuth consent screen displays "Continue to transactional" instead of "First Serve Seattle"
2. Login fails with: "Access blocked: transactional can only be used within its organization"
3. All Google OAuth flows are affected (signup, signin, re-auth)

## Affected User Flows

| Entry Point | Flow | Currently Broken |
|-------------|------|------------------|
| `/testworkflow` AuthModal | New user signup | Yes |
| `/testworkflow` AuthModal | Returning user signin | Yes |
| `/testlogin` | Google auth | Yes |
| `/members` ReAuthModal | Re-authentication | Yes |

**Code locations using Google OAuth:**
- `src/app/testworkflow/page.tsx:226-244`
- `src/app/testlogin/page.tsx:31-43`
- `src/app/components/ReAuthModal.tsx:61-87`
- `src/app/auth/callback/route.ts` (callback handler)

## Proposed Solution

### Phase 1: Verify Current Configuration

Before making changes, verify the OAuth credentials:

1. **Get the Client ID from Supabase Dashboard:**
   - Go to: `https://supabase.com/dashboard/project/mqoqdddzrwvonklsprgb/auth/providers`
   - Find Google provider settings
   - Copy the Client ID configured there

2. **Locate the matching OAuth client in Google Cloud Console:**
   - Go to: `https://console.cloud.google.com/`
   - Find the project containing that Client ID
   - This is likely the "transactional" project

### Phase 2: Fix Google Cloud Console Settings

In Google Cloud Console for the identified project:

**Step 1: Update OAuth Consent Screen**
1. Navigate to **APIs & Services > OAuth consent screen**
2. Change **User Type** from "Internal" to **"External"**
3. Update **App name** from "transactional" to **"First Serve Seattle"**
4. Ensure **User support email** is set correctly
5. Add **Developer contact information** if missing
6. Save changes

**Step 2: Verify Publishing Status**
1. Check if app is in "Testing" or "Production" mode
2. If in Testing mode with >100 users, either:
   - Add test users manually, OR
   - Click "Publish App" to go to Production

**Step 3: Verify Authorized Domains & Redirect URIs**
1. Go to **APIs & Services > Credentials**
2. Click on the OAuth 2.0 Client ID
3. Verify these are present:

**Authorized JavaScript Origins:**
```
https://firstserveseattle.com
http://localhost:3000
```

**Authorized Redirect URIs:**
```
https://mqoqdddzrwvonklsprgb.supabase.co/auth/v1/callback
http://localhost:54321/auth/v1/callback
```

### Phase 3: Verification Testing

After making changes, test each flow:

| Test | Steps | Expected Result |
|------|-------|-----------------|
| New signup | Go to `/testworkflow` > Sign Up > Continue with Google | See "First Serve Seattle" consent screen, complete signup, redirect to `/testc` |
| Returning signin | Go to `/testworkflow` > Sign In > Continue with Google | Complete signin without "Access blocked" error |
| Re-auth | Go to `/members` > Manage Subscription > Google | Complete re-auth, billing portal opens |
| Testlogin | Go to `/testlogin` > Continue with Google | Complete auth, redirect works |

## Acceptance Criteria

- [ ] Google OAuth consent screen displays "First Serve Seattle" (not "transactional")
- [ ] Any Google account can authenticate (not just organization members)
- [ ] New user signup via Google works on `/testworkflow`
- [ ] Returning user signin via Google works on `/testworkflow`
- [ ] Re-authentication via Google works on `/members`
- [ ] OAuth callback properly redirects users

## Technical Considerations

### What Could Go Wrong

| Risk | Mitigation |
|------|------------|
| Wrong OAuth client modified | Verify Client ID matches Supabase config before making changes |
| Users mid-OAuth when change happens | Make change during low-traffic period |
| App needs Google verification (>100 users) | Check user count first; may need to complete verification |
| Cached consent screens | Users may need to clear browser cache or wait |

### No Code Changes Required

The fix is entirely in Google Cloud Console. Current code is correct:

```typescript
// src/app/testworkflow/page.tsx:226-244 - Works correctly
const { error: oauthError } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(finalRedirect)}&mode=${mode}`,
  },
});
```

### Environment Variables

The `GMAIL_CLIENT_ID` values in `.env` and `.env.local` are for the **Gmail API** (sending emails), NOT for user authentication. User authentication credentials are stored in Supabase Dashboard, not in environment variables.

## Checklist

### Pre-Change
- [ ] Screenshot current Google Cloud Console OAuth consent screen settings
- [ ] Verify the OAuth Client ID in Supabase Dashboard matches the GCP project being modified
- [ ] Check number of users with Google OAuth (for verification requirements)

### During Change
- [ ] Change User Type from "Internal" to "External"
- [ ] Update App name to "First Serve Seattle"
- [ ] Verify authorized redirect URIs are correct
- [ ] Save all changes

### Post-Change
- [ ] Test new user signup with Google
- [ ] Test returning user signin with Google
- [ ] Test re-authentication flow
- [ ] Verify consent screen shows correct app name
- [ ] Monitor for any OAuth errors in Supabase logs

## Future Considerations

1. **Add Google to SocialAuthButtons:** The `SocialAuthButtons.tsx` component only has Apple Sign-In. Consider adding Google for consistency on `/signup` and `/login` pages.

2. **Brand Verification:** For the app name and logo to display without warnings for all users, complete Google's brand verification process (takes 2-3 business days).

3. **Error Handling:** Consider adding specific error handling for OAuth configuration errors to provide better user feedback during issues.

## References

### Internal Files
- `src/app/testworkflow/page.tsx:226-244` - Main Google OAuth implementation
- `src/app/testlogin/page.tsx:31-43` - Alternative login page
- `src/app/components/ReAuthModal.tsx:61-87` - Re-auth modal
- `src/app/auth/callback/route.ts` - OAuth callback handler

### External Documentation
- [Supabase Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth Consent Screen Setup](https://support.google.com/cloud/answer/10311615)
- [Google Brand Verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification)

### Supabase Dashboard Links
- Auth Providers: `https://supabase.com/dashboard/project/mqoqdddzrwvonklsprgb/auth/providers`
- URL Configuration: `https://supabase.com/dashboard/project/mqoqdddzrwvonklsprgb/auth/url-configuration`
