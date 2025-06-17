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

import { shouldShowPaywall } from '@/lib/shouldShowPaywall';
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

        setViewData({
          uniqueDays : JSON.parse(localStorage.getItem('fss_days') ?? '[]').length,
          gateDays   : Number(localStorage.getItem('fss_gate') ?? 3),
          showPaywall: show,
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

  /* ---------- main public UI ------------------------------------------ */
  if (viewData && pathname === '/') {
    return (
      <div className="container mx-auto max-w-4xl bg-white px-4 pt-8 pb-6 text-black md:pt-10 md:pb-8">
        <header className="mb-8 flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-6">
            <Image
              src="/first-serve-logo.png"
              alt="First Serve Seattle Logo"
              width={100}
              height={40}
              className="md:w-[120px] md:h-[48px]"
            />
            <DaysCounter days={viewData.uniqueDays} gate={viewData.gateDays} />
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

        <Suspense fallback={<LoadingIndicator />}>
          <TennisCourtList />
        </Suspense>
      </div>
    );
  }

  /* ---------- unreachab le --------------------------------------------- */
  return null;
}
