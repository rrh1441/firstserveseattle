/* --------------------------------------------------------------------------
   Public landing page
   • Anonymous users receive 3 / 5 / 7 free unique days (sticky cohort).
   • On the day *after* that cap, redirect to /paywall.
   -------------------------------------------------------------------------- */

'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter }                     from 'next/navigation';
import Image                                          from 'next/image';

import type { ReactElement } from 'react';
import Paywall             from './tennis-courts/components/paywall';
import TennisCourtList     from './tennis-courts/components/TennisCourtList';
import DaysCounter         from './tennis-courts/components/DaysCounter';
import LandingPage         from './components/LandingPage';

import { shouldShowPaywall, isFirstTimeVisitor } from '@/lib/shouldShowPaywall';
import { logEvent }          from '@/lib/logEvent';
import { useRandomUserId }   from './randomUserSetup';
import { ConversionTracker } from '@/lib/eventLogging';

/* ---------- constants -------------------------------------------------- */
const EXEMPT_PATHS = new Set<string>([
  '/paywall',
  '/reset-password',
  '/login',
  '/signup',
  '/members',
  '/privacy-policy',
  '/terms-of-service',
  '/courts',
  '/request-password-reset',
  '/admin',
]);

const LoadingIndicator = (): ReactElement => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <p className="animate-pulse text-lg text-gray-600">Loading Courts…</p>
  </div>
);

interface ViewState {
  uniqueDays : number;
  gateDays   : number;
  showPaywall: boolean;
  isFirstTime: boolean;
}

/* ---------------------------------------------------------------------- */
export default function HomePage(): ReactElement | null {
  const pathname  = usePathname();
  const router    = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewData,  setViewData]  = useState<ViewState | null>(null);

  useRandomUserId();                                   // assigns anon ID once

  const pathIsExempt = useCallback(
    (p: string): boolean => p.startsWith('/courts/') || EXEMPT_PATHS.has(p),
    [],
  );

  /* ---------- decide on every navigation ------------------------------ */
  useEffect(() => {
    async function decide(): Promise<void> {
      if (pathIsExempt(pathname)) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const show = await shouldShowPaywall();
        const isFirstTime = isFirstTimeVisitor();

        setViewData({
          uniqueDays : JSON.parse(localStorage.getItem('fss_days') ?? '[]').length,
          gateDays   : Number(localStorage.getItem('fss_gate') ?? 3),
          showPaywall: show,
          isFirstTime: isFirstTime,
        });

        logEvent('visit_home', { pathname, showPaywall: show });
        
        // Enhanced visit tracking with better paywall context
        ConversionTracker.trackVisit(pathname, show);

        // Don't auto-redirect to signup - let them see the paywall first
        // if (show) {
        //   router.replace('/signup');
        //   return;
        // }
      } catch {
        router.replace('/signup');
        return;
      } finally {
        setIsLoading(false);
      }
    }

    decide().catch(() => router.replace('/signup'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* ---------- guards --------------------------------------------------- */
  if (pathIsExempt(pathname)) return null;
  if (isLoading)              return <LoadingIndicator />;
  if (viewData?.showPaywall)  return <Paywall />;
  if (viewData?.isFirstTime)  return <LandingPage />;

  /* ---------- main public UI ------------------------------------------ */
  if (viewData && pathname === '/' && !viewData.showPaywall && !viewData.isFirstTime) {
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
          {/* Admin link - only show if user has admin session */}
          {typeof window !== 'undefined' && localStorage.getItem('admin_auth') === 'true' && (
            <div className="flex items-center">
              <a 
                href="/admin" 
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-300 hover:border-gray-400 transition-colors"
                title="Admin Dashboard"
              >
                Admin
              </a>
            </div>
          )}
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

  /* ---------- fallback: redirect to landing page -------------------- */
  // If we somehow get here, user should see the landing page
  if (viewData && !viewData.showPaywall) {
    return <LandingPage />;
  }
  
  /* ---------- unreachable ---------------------------------------------- */
  return null;
}
