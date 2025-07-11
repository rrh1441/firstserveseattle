Hello! I've reviewed your codebase and your goal to improve conversion by introducing a landing page. The previous setup of immediately showing the courts was great for demonstrating value, but as you've seen, it can indeed lead to low conversion if users don't understand the long-term value proposition or feel prematurely blocked.

I've refactored your application's entry flow to address this. Here’s a summary of the changes and my reasoning:

### Core Problem & Solution

The main issue was the user flow. Dropping users directly into the app is confusing and doesn't give you a chance to sell the benefits before they hit a paywall.

My solution reorganizes the site structure:

1.  **New Landing Page (`/`)**: The root of your site is now a dedicated landing page. This page explains what your app does and why it's valuable. It's the first thing new visitors see.
2.  **Dedicated Courts Page (`/courts`)**: The court searching functionality has been moved to its own page. This is where users go after deciding they want to try your service from the landing page.
3.  **Intelligent Redirects**: The landing page now pre-checks the user's paywall status. When they click to see the courts, they are sent directly to the correct view (`/courts` or `/paywall`), ensuring a smooth and fast transition without any content flashing.
4.  **Cleaned Up Logic**: The `shouldShowPaywall` logic has been streamlined by removing the now-obsolete "first-time visitor" check, simplifying the codebase.

These changes create a more traditional and effective conversion funnel: attract, educate, and then convert.

Here are the code changes to implement this new flow.

### 1. The New Landing Page

I've converted `src/app/page.tsx` to be the site's main entry point, which now renders the landing page. It intelligently handles where to send users when they click the main call-to-action.

<file path="src/app/page.tsx">
```typescript
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from './components/LandingPage';
import { shouldShowPaywall } from '@/lib/shouldShowPaywall';
import { useRandomUserId } from './randomUserSetup';

function PageContent() {
  useRandomUserId();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isPaywalled, setIsPaywalled] = useState(false);

  useEffect(() => {
    // Pre-load the paywall check for the CTA, making the redirect instant.
    shouldShowPaywall().then(show => {
      setIsPaywalled(show);
      setIsLoading(false);
    });
  }, []);

  const handleGetFreeViews = () => {
    // On click, send the user to the correct page based on the pre-loaded check.
    router.push(isPaywalled ? '/paywall' : '/courts');
  };

  return (
    <LandingPage
      isLoading={isLoading}
      onGetFreeViews={handleGetFreeViews}
    />
  );
}

// The root of the app is now the landing page.
export default function HomePage() {
  return (
    // Suspense is a good practice for pages that handle routing or data fetching.
    <Suspense>
      <PageContent />
    </Suspense>
  );
}
```
</file>

### 2. Refactored Landing Page Component

I've updated `src/app/components/LandingPage.tsx` to be a "presentational" component. It no longer contains complex logic and instead takes instructions from `src/app/page.tsx`, making it more reusable and easier to understand.

<file path="src/app/components/LandingPage.tsx">
```typescript
"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"

interface LandingPageProps {
  isLoading: boolean;
  onGetFreeViews: () => void;
}

export default function LandingPage({ isLoading, onGetFreeViews }: LandingPageProps) {
  const router = useRouter()

  const handleSignIn = () => {
    router.push("/login")
  }

  const handleSignUp = () => {
    router.push("/signup")
  }

  return (
    <div className="min-h-screen bg-white max-w-4xl mx-auto">
      {/* Header */}
      <header className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
              alt="First Serve Seattle Logo"
              width={32}
              height={32}
              priority
            />
            <h1 className="text-lg font-semibold text-[#0c372b] md:text-xl">First Serve Seattle</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSignIn}
              className="text-sm font-medium text-gray-700 px-3 py-1.5"
            >
              Sign In
            </button>
            <button
              onClick={handleSignUp}
              className="text-sm font-medium text-white bg-[#0c372b] px-4 py-1.5 rounded"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 md:px-8">
        {/* Hero */}
        <div className="pt-8 pb-6 text-center md:pt-12 md:pb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 md:text-5xl md:mb-6">
            Where can I<br />walk up and play?
          </h2>
          <p className="text-gray-600 text-lg mb-6 md:text-xl md:mb-8 max-w-2xl mx-auto">
            Daily updates on unreserved tennis and pickleball courts.<br />
            No more driving around guessing.
          </p>

          <button
            onClick={onGetFreeViews}
            disabled={isLoading}
            className="w-full md:w-auto md:px-12 bg-[#0c372b] text-white py-3.5 px-6 text-base font-medium rounded hover:bg-[#0a2e21] transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Checking status...
              </div>
            ) : (
              "Get Free Views"
            )}
          </button>
          <p className="text-sm text-gray-500 mt-2 text-center md:text-base">No credit card required for free views</p>
        </div>

        {/* Trust */}
        <div className="py-4 border-t border-gray-100 text-center md:py-6">
          <p className="text-sm text-gray-600 md:text-base">
            <span className="font-semibold text-gray-900">Used by 2,500+ players</span> every month
          </p>
        </div>

        {/* How it works */}
        <div className="py-6 md:py-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center md:text-2xl md:mb-6">The problem we solve</h3>
          
          <div className="space-y-4 mb-6 max-w-sm mx-auto md:max-w-2xl md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
            <div className="text-center">
              <p className="font-medium text-gray-900">Seattle locks court reservations daily</p>
              <p className="text-sm text-gray-600">You can&apos;t see which courts are actually free for walk-up play</p>
            </div>
            
            <div className="text-center">
              <p className="font-medium text-gray-900">We check every morning at 5 AM</p>
              <p className="text-sm text-gray-600">Know exactly where you can play before you leave home</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="py-6 border-t border-gray-100 md:py-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center md:text-2xl md:mb-6">What you get</h3>
          
          <div className="space-y-3 max-w-xs mx-auto md:max-w-2xl md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-[#0c372b] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">All 100+ Seattle courts</p>
                <p className="text-sm text-gray-600">Tennis and pickleball</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-[#0c372b] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">Updated by 5 AM daily</p>
                <p className="text-sm text-gray-600">Fresh info every morning</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-[#0c372b] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">Feature view</p>
                <p className="text-sm text-gray-600">Find courts with lights, pickleball lines, hitting walls, or nearby ball machine rentals</p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="py-6 border-t border-gray-100 md:py-8">
          <blockquote className="text-gray-700 text-center max-w-sm mx-auto md:max-w-2xl">
            <p className="mb-2 md:text-lg">&quot;Used to waste 30 minutes driving between courts. Now I know exactly where to go.&quot;</p>
            <cite className="text-sm text-gray-600 not-italic md:text-base">— Mike R., Capitol Hill</cite>
          </blockquote>
        </div>

        {/* CTA */}
        <div className="py-6 md:py-8 flex flex-col items-center">
          <button
            onClick={onGetFreeViews}
            className="w-full md:w-auto md:px-12 bg-[#0c372b] text-white py-3.5 px-6 text-base font-medium rounded hover:bg-[#0a2e21] transition-colors mb-3"
          >
            Start Free Trial
          </button>
          
          <p className="text-sm text-gray-600 text-center md:text-base">
            $4 first month, then $8/month • Cancel anytime
          </p>
        </div>

        {/* Footer */}
        <div className="py-6 border-t border-gray-100 text-center md:py-8">
          <p className="text-sm text-gray-600 md:text-base">
            Have an account? <button onClick={handleSignIn} className="text-[#0c372b] font-medium">Sign in</button>
          </p>
        </div>
      </main>
    </div>
  )
}
```
</file>

### 3. The New Courts Page

`src/app/courts/page.tsx` is now the destination for users who want to see court availability. It houses the paywall logic, ensuring that users who have exhausted their free views see the paywall, while others see the court list.

<file path="src/app/courts/page.tsx">
```typescript
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import type { ReactElement } from 'react';
import TennisCourtList from '@/app/tennis-courts/components/TennisCourtList';
import DaysCounter from '@/app/tennis-courts/components/DaysCounter';
import Paywall from '@/app/tennis-courts/components/paywall';
import { shouldShowPaywall } from '@/lib/shouldShowPaywall';
import { logEvent } from '@/lib/logEvent';
import { ConversionTracker } from '@/lib/eventLogging';

const LoadingIndicator = (): ReactElement => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <p className="animate-pulse text-lg text-gray-600">Loading Courts…</p>
  </div>
);

interface ViewState {
  uniqueDays: number;
  gateDays: number;
  showPaywall: boolean;
}

export default function CourtsPage(): ReactElement | null {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewData, setViewData] = useState<ViewState | null>(null);

  useEffect(() => {
    async function decide() {
      setIsLoading(true);
      try {
        const show = await shouldShowPaywall();
        
        logEvent('visit_courts_page', { showPaywall: show });
        ConversionTracker.trackVisit('/courts', show);

        if (show) {
          // If paywall should be shown, we don't need day counts.
          setViewData({ showPaywall: true, uniqueDays: 0, gateDays: 0 });
        } else {
          // Otherwise, get the data for the counter display.
          setViewData({
            uniqueDays: JSON.parse(localStorage.getItem('fss_days') ?? '[]').length,
            gateDays: Number(localStorage.getItem('fss_gate') ?? 3),
            showPaywall: false,
          });
        }
      } catch {
        // Fail safe: if anything goes wrong, send to signup.
        router.replace('/signup');
      } finally {
        setIsLoading(false);
      }
    }
    decide();
  }, [router]);

  if (isLoading) {
    return <LoadingIndicator />;
  }

  // If paywall is active, render the paywall component directly.
  if (viewData?.showPaywall) {
    return <Paywall />;
  }

  // Otherwise, show the main courts list view.
  if (viewData) {
    return (
      <div className="container mx-auto max-w-4xl bg-white px-4 pt-8 pb-6 text-black md:pt-10 md:pb-8">
        <header className="mb-8 flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-6">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
              alt="First Serve Seattle Logo"
              width={80}
              height={80}
              priority
            />
            <div>
              <h1 className="mb-1 text-3xl font-extrabold text-[#0c372b] md:text-4xl">
                First Serve Seattle
              </h1>
              <p className="text-base font-semibold md:text-lg">
                Today&apos;s Open Tennis and Pickleball Courts
              </p>
            </div>
          </div>
        </header>

        <DaysCounter
          uniqueDays={viewData.uniqueDays}
          gateDays={viewData.gateDays}
        />

        <Suspense fallback={<LoadingIndicator />}>
          <TennisCourtList />
        </Suspense>
      </div>
    );
  }

  return null;
}
```
</file>

### 4. Simplified Paywall Logic

Finally, I've cleaned up `src/lib/shouldShowPaywall.ts` by removing functions related to the old "first-time visit" flow, which are no longer necessary.

<file path="src/lib/shouldShowPaywall.ts">
```typescript
/* -------------------------------------------------------------------------- *
   shouldShowPaywall()
   --------------------------------------------------------------------------
   • Cohort assignment: each anonymous browser is randomly locked to 3, 5, or
     7 free-use days. Stored once in localStorage (key = "fss_gate").
   • Visitor counter : every new calendar day adds one element to the "fss_days"
     array.  No network call required.
   • Returns `true` *after* the allocation is exhausted
     (uniqueDays  >  gateDays) so the pay-wall appears on day 4 / 6 / 8.
 * -------------------------------------------------------------------------- */

const FSS_GATE_KEY = 'fss_gate';
const FSS_DAYS_KEY = 'fss_days';

export async function shouldShowPaywall(): Promise<boolean> {
  if (typeof window === 'undefined') return false; // SSR / bots

  /* ---------- 1️⃣  assign (sticky) gate cohort -------------------------- */
  let gateDays = Number(localStorage.getItem(FSS_GATE_KEY));
  if (![3].includes(gateDays)) {
    // For now, all users get a 3-day gate. This can be expanded for A/B testing.
    gateDays = 3;
    localStorage.setItem(FSS_GATE_KEY, String(gateDays));
  }

  /* ---------- 2️⃣  record today's visit -------------------------------- */
  const today = new Date().toISOString().slice(0, 10);          // YYYY-MM-DD
  const days: string[] = JSON.parse(localStorage.getItem(FSS_DAYS_KEY) ?? '[]');

  if (!days.includes(today)) {
    days.push(today);
    localStorage.setItem(FSS_DAYS_KEY, JSON.stringify(days));
  }

  /* ---------- 3️⃣  show pay-wall on the day AFTER the cap -------------- */
  return days.length > gateDays;
}
```
</file>

### Further Suggestions for Conversion

*   **Emphasize "Cancel Anytime"**: Make this promise more prominent near the CTA button. It reduces the perceived risk of subscribing.
*   **Add Testimonials to the Paywall**: You have a testimonial on the landing page; add one or two short, powerful ones directly to the paywall screen to build trust at the moment of decision.

This new structure provides a much clearer path for new users and should have a positive impact on your conversion rates. Let me know if you have any other questions