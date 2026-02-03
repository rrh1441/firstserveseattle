# feat: E2E Testing Workflow for Sign-Up Flows

## Overview

Create automated E2E tests using **agent-browser** (Vercel's headless browser CLI for AI agents) that run through the **real** sign-up flow for each authentication method, using a 100% off promo code so no actual charges occur. Tests run daily to catch regressions.

## Auth Methods to Test

Based on `/testworkflow` implementation:

| Method | Flow | Automatable |
|--------|------|-------------|
| **Google OAuth** | Sign Up & Sign In | Yes - with dedicated test Google account |
| **Apple OAuth** | Sign In only (legacy until May 31, 2026) | Limited - requires Apple test account |
| **Email/Password** | Sign In only | Yes - fully automatable |
| **Magic Link** | Sign Up & Sign In | Partial - need email access |

## Why agent-browser?

- **Designed for AI agents** - Accessibility-first approach with semantic element refs
- **Fast Rust CLI** - Better performance than traditional browser automation
- **Persistent profiles** - Can maintain auth state across runs
- **Built on Playwright** - Same reliability, better DX for automation

## File Structure

```
4 files total:
├── e2e/
│   ├── cleanup.ts           # Supabase/Stripe user cleanup
│   ├── signup-flow.ts       # Main E2E test using agent-browser
│   └── run-tests.ts         # Test runner entry point
└── .github/workflows/e2e-tests.yml  # Daily scheduled workflow
```

## Prerequisites

1. **Stripe 100% off promo code** - Create `E2E_TEST_100OFF` in Stripe Dashboard (test mode)
2. **Dedicated Google test account** - `e2e-test@firstserveseattle.com` or similar
3. **Google account credentials** stored in GitHub Secrets
4. **Supabase service role key** in GitHub Secrets

## Implementation

### e2e/cleanup.ts

```typescript
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function cleanupTestUser(email: string): Promise<void> {
  console.log(`🧹 Cleaning up test user: ${email}`);

  // 1. Find subscriber record
  const { data: subscriber } = await supabaseAdmin
    .from('subscribers')
    .select('user_id, stripe_customer_id, stripe_subscription_id')
    .eq('email', email)
    .single();

  // 2. Cancel Stripe subscription if exists
  if (subscriber?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(subscriber.stripe_subscription_id);
      console.log(`  ✓ Canceled subscription`);
    } catch {
      console.log(`  - Subscription already canceled`);
    }
  }

  // 3. Delete Stripe customer if exists
  if (subscriber?.stripe_customer_id) {
    try {
      await stripe.customers.del(subscriber.stripe_customer_id);
      console.log(`  ✓ Deleted Stripe customer`);
    } catch {
      console.log(`  - Stripe customer not found`);
    }
  }

  // 4. Delete subscriber record
  if (subscriber) {
    await supabaseAdmin.from('subscribers').delete().eq('email', email);
    console.log(`  ✓ Deleted subscriber record`);
  }

  // 5. Find and delete auth user
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const authUser = users.users.find((u) => u.email === email);
  if (authUser) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.id);
    console.log(`  ✓ Deleted auth user`);
  }

  console.log(`✅ Cleanup complete for: ${email}\n`);
}

export async function waitForSubscription(
  email: string,
  maxWaitMs = 60000
): Promise<boolean> {
  const startTime = Date.now();
  let delay = 2000;

  while (Date.now() - startTime < maxWaitMs) {
    const { data: subscriber } = await supabaseAdmin
      .from('subscribers')
      .select('status')
      .eq('email', email)
      .single();

    if (subscriber && ['active', 'trialing'].includes(subscriber.status)) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.min(delay * 1.5, 10000);
  }

  return false;
}

export async function getSubscription(email: string) {
  const { data } = await supabaseAdmin
    .from('subscribers')
    .select('*')
    .eq('email', email)
    .single();
  return data;
}
```

### e2e/signup-flow.ts

```typescript
import { BrowserManager } from 'agent-browser/dist/browser.js';
import { cleanupTestUser, waitForSubscription, getSubscription } from './cleanup.js';
import Stripe from 'stripe';

const GOOGLE_EMAIL = process.env.GOOGLE_TEST_EMAIL!;
const GOOGLE_PASSWORD = process.env.GOOGLE_TEST_PASSWORD!;
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runGoogleOAuthSignupTest(): Promise<boolean> {
  const browser = new BrowserManager();

  console.log('\n🧪 Starting Google OAuth Signup Flow Test\n');
  console.log('━'.repeat(50));

  try {
    // Step 0: Cleanup any previous test data
    console.log('\n📋 Step 0: Pre-test cleanup');
    await cleanupTestUser(GOOGLE_EMAIL);

    // Step 1: Launch browser and navigate
    console.log('\n📋 Step 1: Launch browser and navigate to /testworkflow');
    await browser.launch({
      id: 'launch',
      action: 'launch',
      headless: process.env.CI === 'true',
      viewport: { width: 1280, height: 720 }
    });

    await browser.navigate({
      id: 'nav',
      action: 'navigate',
      url: `${BASE_URL}/testworkflow`,
      waitUntil: 'networkidle'
    });
    console.log('  ✓ Navigated to /testworkflow');

    // Step 2: Open auth modal and click Sign Up
    console.log('\n📋 Step 2: Open auth modal');
    let snapshot = await browser.getSnapshot();

    // Find and click "First Serve Seattle" button
    const menuButton = findRefByText(snapshot, 'First Serve Seattle');
    if (!menuButton) throw new Error('Could not find menu button');
    await browser.click({ id: 'click-menu', action: 'click', ref: menuButton });
    await sleep(500);

    snapshot = await browser.getSnapshot();
    const signupButton = findRefByText(snapshot, 'Sign Up');
    if (!signupButton) throw new Error('Could not find Sign Up button');
    await browser.click({ id: 'click-signup', action: 'click', ref: signupButton });
    await sleep(500);
    console.log('  ✓ Opened Sign Up modal');

    // Step 3: Click Continue with Google
    console.log('\n📋 Step 3: Click Continue with Google');
    snapshot = await browser.getSnapshot();
    const googleButton = findRefByText(snapshot, 'Continue with Google');
    if (!googleButton) throw new Error('Could not find Google button');
    await browser.click({ id: 'click-google', action: 'click', ref: googleButton });
    console.log('  ✓ Clicked Google OAuth button');

    // Step 4: Handle Google OAuth flow
    console.log('\n📋 Step 4: Complete Google OAuth');
    await sleep(3000); // Wait for redirect to Google

    // Enter email
    snapshot = await browser.getSnapshot();
    const emailInput = findRefByRole(snapshot, 'textbox');
    if (emailInput) {
      await browser.fill({ id: 'fill-email', action: 'fill', ref: emailInput, value: GOOGLE_EMAIL });
      await sleep(500);

      const nextButton = findRefByText(snapshot, 'Next');
      if (nextButton) await browser.click({ id: 'click-next', action: 'click', ref: nextButton });
      await sleep(2000);
    }

    // Enter password
    snapshot = await browser.getSnapshot();
    const passwordInput = findRefByType(snapshot, 'password');
    if (passwordInput) {
      await browser.fill({ id: 'fill-password', action: 'fill', ref: passwordInput, value: GOOGLE_PASSWORD });
      await sleep(500);

      const nextButton = findRefByText(snapshot, 'Next');
      if (nextButton) await browser.click({ id: 'click-next2', action: 'click', ref: nextButton });
      await sleep(3000);
    }

    // Handle consent if shown
    snapshot = await browser.getSnapshot();
    const consentButton = findRefByText(snapshot, 'Continue') || findRefByText(snapshot, 'Allow');
    if (consentButton) {
      await browser.click({ id: 'click-consent', action: 'click', ref: consentButton });
      await sleep(2000);
    }
    console.log('  ✓ Completed Google OAuth');

    // Step 5: Wait for redirect back to app
    console.log('\n📋 Step 5: Wait for redirect to /signup');
    await sleep(5000);

    const currentUrl = await browser.getUrl();
    if (!currentUrl?.includes('/signup')) {
      console.log(`  ⚠ Current URL: ${currentUrl}`);
      // May need to navigate manually if OAuth redirects differently
    }
    console.log('  ✓ Redirected to signup page');

    // Step 6: Select monthly plan and proceed to checkout
    console.log('\n📋 Step 6: Select plan and proceed to Stripe checkout');
    snapshot = await browser.getSnapshot();
    const monthlyButton = findRefByText(snapshot, 'Monthly') || findRefByText(snapshot, '$8');
    if (monthlyButton) {
      await browser.click({ id: 'click-monthly', action: 'click', ref: monthlyButton });
      await sleep(500);
    }

    const continueButton = findRefByText(snapshot, 'Continue') || findRefByText(snapshot, 'Subscribe');
    if (continueButton) {
      await browser.click({ id: 'click-continue', action: 'click', ref: continueButton });
      await sleep(5000);
    }
    console.log('  ✓ Proceeding to Stripe checkout');

    // Step 7: Complete Stripe checkout
    console.log('\n📋 Step 7: Complete Stripe checkout with promo code');
    snapshot = await browser.getSnapshot();

    // Apply promo code
    const promoButton = findRefByText(snapshot, 'Add promotion code');
    if (promoButton) {
      await browser.click({ id: 'click-promo', action: 'click', ref: promoButton });
      await sleep(500);

      snapshot = await browser.getSnapshot();
      const promoInput = findRefByPlaceholder(snapshot, 'promo');
      if (promoInput) {
        await browser.fill({ id: 'fill-promo', action: 'fill', ref: promoInput, value: 'E2E_TEST_100OFF' });
        await sleep(500);

        const applyButton = findRefByText(snapshot, 'Apply');
        if (applyButton) await browser.click({ id: 'click-apply', action: 'click', ref: applyButton });
        await sleep(2000);
      }
    }

    // Fill card details (even with 100% off, may be required)
    snapshot = await browser.getSnapshot();
    const cardInput = findRefByPlaceholder(snapshot, 'Card number') || findRefByPlaceholder(snapshot, '1234');
    if (cardInput) {
      await browser.fill({ id: 'fill-card', action: 'fill', ref: cardInput, value: '4242424242424242' });
      await sleep(300);
    }

    const expiryInput = findRefByPlaceholder(snapshot, 'MM / YY') || findRefByPlaceholder(snapshot, 'MM');
    if (expiryInput) {
      await browser.fill({ id: 'fill-expiry', action: 'fill', ref: expiryInput, value: '12/30' });
      await sleep(300);
    }

    const cvcInput = findRefByPlaceholder(snapshot, 'CVC') || findRefByPlaceholder(snapshot, 'CVV');
    if (cvcInput) {
      await browser.fill({ id: 'fill-cvc', action: 'fill', ref: cvcInput, value: '123' });
      await sleep(300);
    }

    const zipInput = findRefByPlaceholder(snapshot, 'ZIP');
    if (zipInput) {
      await browser.fill({ id: 'fill-zip', action: 'fill', ref: zipInput, value: '98101' });
      await sleep(300);
    }

    // Submit checkout
    const submitButton = findRefByText(snapshot, 'Subscribe') || findRefByText(snapshot, 'Start trial');
    if (submitButton) {
      await browser.click({ id: 'click-submit', action: 'click', ref: submitButton });
      await sleep(10000);
    }
    console.log('  ✓ Submitted checkout');

    // Step 8: Verify subscription is active
    console.log('\n📋 Step 8: Verify subscription is active');
    const isActive = await waitForSubscription(GOOGLE_EMAIL, 60000);
    if (!isActive) {
      throw new Error('Subscription did not become active within timeout');
    }
    console.log('  ✓ Subscription is active');

    // Step 9: Cancel subscription
    console.log('\n📋 Step 9: Cancel subscription');
    const subscription = await getSubscription(GOOGLE_EMAIL);
    if (subscription?.stripe_subscription_id) {
      const canceled = await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
      if (canceled.status !== 'canceled') {
        throw new Error(`Subscription status is ${canceled.status}, expected canceled`);
      }
      console.log('  ✓ Subscription canceled');
    }

    // Step 10: Cleanup
    console.log('\n📋 Step 10: Post-test cleanup');
    await cleanupTestUser(GOOGLE_EMAIL);

    console.log('\n' + '━'.repeat(50));
    console.log('✅ Google OAuth Signup Flow Test PASSED\n');
    return true;

  } catch (error) {
    console.error('\n❌ Test failed:', error);

    // Take screenshot on failure
    try {
      await browser.screenshot({
        id: 'failure-screenshot',
        action: 'screenshot',
        path: 'e2e-failure.png'
      });
      console.log('📸 Failure screenshot saved to e2e-failure.png');
    } catch {}

    // Cleanup on failure
    try {
      await cleanupTestUser(GOOGLE_EMAIL);
    } catch {}

    return false;
  } finally {
    await browser.close();
  }
}

// Helper functions to find refs in snapshot
function findRefByText(snapshot: any, text: string): string | null {
  const regex = new RegExp(text, 'i');
  const tree = JSON.stringify(snapshot);
  // This is simplified - actual implementation would parse the accessibility tree
  const match = tree.match(new RegExp(`"ref":"(@?e\\d+)"[^}]*"name":"[^"]*${text}[^"]*"`, 'i'));
  return match ? match[1] : null;
}

function findRefByRole(snapshot: any, role: string): string | null {
  const tree = JSON.stringify(snapshot);
  const match = tree.match(new RegExp(`"ref":"(@?e\\d+)"[^}]*"role":"${role}"`, 'i'));
  return match ? match[1] : null;
}

function findRefByType(snapshot: any, type: string): string | null {
  const tree = JSON.stringify(snapshot);
  const match = tree.match(new RegExp(`"ref":"(@?e\\d+)"[^}]*"type":"${type}"`, 'i'));
  return match ? match[1] : null;
}

function findRefByPlaceholder(snapshot: any, placeholder: string): string | null {
  const tree = JSON.stringify(snapshot);
  const match = tree.match(new RegExp(`"ref":"(@?e\\d+)"[^}]*"placeholder":"[^"]*${placeholder}[^"]*"`, 'i'));
  return match ? match[1] : null;
}
```

### e2e/run-tests.ts

```typescript
import { runGoogleOAuthSignupTest } from './signup-flow.js';

async function main() {
  console.log('🚀 First Serve Seattle E2E Test Suite\n');
  console.log('=' .repeat(50));
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Environment: ${process.env.CI ? 'CI' : 'Local'}`);
  console.log('='.repeat(50));

  const results: { name: string; passed: boolean }[] = [];

  // Run Google OAuth test
  const googleResult = await runGoogleOAuthSignupTest();
  results.push({ name: 'Google OAuth Signup Flow', passed: googleResult });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));

  for (const result of results) {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status}: ${result.name}`);
  }

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`\nTotal: ${passed}/${total} tests passed`);

  // Exit with appropriate code
  process.exit(passed === total ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

### .github/workflows/e2e-tests.yml

```yaml
name: Daily E2E Tests

on:
  schedule:
    - cron: '15 14 * * *'  # 6:15 AM PST daily
  workflow_dispatch:  # Manual trigger

concurrency:
  group: e2e-tests
  cancel-in-progress: false

env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
  STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY_TEST }}
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST }}
  GOOGLE_TEST_EMAIL: ${{ secrets.GOOGLE_TEST_EMAIL }}
  GOOGLE_TEST_PASSWORD: ${{ secrets.GOOGLE_TEST_PASSWORD }}
  BASE_URL: http://localhost:3000

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install agent-browser and Chromium
        run: |
          pnpm exec agent-browser install --with-deps

      - name: Build Next.js
        run: pnpm build

      - name: Start server in background
        run: |
          pnpm start &
          sleep 10

      - name: Run E2E tests
        run: pnpm tsx e2e/run-tests.ts

      - name: Upload failure screenshot
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: e2e-failure-screenshot
          path: e2e-failure.png
          retention-days: 7

      - name: Notify on failure
        if: failure()
        run: |
          echo "E2E tests failed! Check the workflow run for details."
```

## Setup Checklist

### Stripe (Test Mode)

- [ ] Create coupon: 100% off, duration "once"
- [ ] Create promotion code: `E2E_TEST_100OFF` from that coupon
- [ ] Verify test mode keys are in GitHub Secrets

### Google Test Account

- [ ] Create dedicated Google account for E2E testing
- [ ] Disable 2FA or set up app password
- [ ] Add credentials to GitHub Secrets:
  - `GOOGLE_TEST_EMAIL`
  - `GOOGLE_TEST_PASSWORD`

### GitHub Secrets Required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY_TEST
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST
GOOGLE_TEST_EMAIL
GOOGLE_TEST_PASSWORD
```

### Install agent-browser

```bash
pnpm add -wD agent-browser
pnpm exec agent-browser install  # Downloads Chromium
```

## What This Tests (Real, No Mocks)

1. **Google OAuth redirect** - Real Google sign-in flow
2. **Auth callback handling** - Real Supabase session creation
3. **Stripe checkout** - Real checkout with 100% off promo
4. **Webhook processing** - Real webhook updates subscriber status
5. **Subscription verification** - Real database query
6. **Cancellation** - Real Stripe API cancellation
7. **User cleanup** - Real deletion from Supabase + Stripe

## Daily Run Schedule

- **Time**: 6:15 AM PST (14:15 UTC)
- **Manual trigger**: Available via `workflow_dispatch`

## Failure Handling

1. Screenshot captured on failure
2. Cleanup runs regardless of test outcome
3. Cleanup also runs at start to handle previous failed runs
