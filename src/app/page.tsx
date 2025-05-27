/* --------------------------------------------------------------------------
   /  – anonymous landing + free-use gate
   -------------------------------------------------------------------------- */

'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter }                     from 'next/navigation';
import Image                                          from 'next/image';
import { ExternalLink }                               from 'lucide-react';

import { Button }          from '@/components/ui/button';
import Paywall             from './tennis-courts/components/paywall';
import TennisCourtList     from './tennis-courts/components/TennisCourtList';
import DaysCounter         from './tennis-courts/components/DaysCounter';
import ViewsCounter        from './tennis-courts/components/counter';

import { shouldShowPaywall } from '@/lib/shouldShowPaywall';
import { logEvent }          from '@/lib/logEvent';
import { useRandomUserId }   from './randomUserSetup';

/* ---------- static ------------------------------------------------------ */
const EXEMPT_PATHS = new Set<string>([
  '/paywall',               // avoid redirect loops
  '/reset-password',
  '/login',
  '/signup',
  '/members',
  '/privacy-policy',
  '/terms-of-service',
  '/courts',
  '/request-password-reset',
]);

const LoadingIndicator = (): JSX.Element => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <p className="animate-pulse text-lg text-gray-600">Loading Courts…</p>
  </div>
);

interface ViewState {
  uniqueDays : number;
  gateDays   : number;
  showPaywall: boolean;
}

/* ------------------------------------------------------------------------ */
export default function HomePage(): JSX.Element | null {
  const pathname  = usePathname();
  const router    = useRouter();

  const [userId,     setUserId]     = useState<string | null>(null);
  const [isLoading,  setIsLoading]  = useState<boolean>(true);
  const [viewData,   setViewData]   = useState<ViewState | null>(null);

  useRandomUserId();                           // assigns an anon ID once

  /* ---------- helper ---------------------------------------------------- */
  const pathIsExempt = useCallback(
    (p: string): boolean => p.startsWith('/courts/') || EXEMPT_PATHS.has(p),
    [],
  );

  /* ---------- first client paint: grab anon ID ------------------------- */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserId(localStorage.getItem('userId'));
    }
  }, []);

  /* ---------- pay-wall decision on nav + anon-ID ----------------------- */
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
          uniqueDays : Number(localStorage.getItem('fss_days')?.length ?? 0),
          gateDays   : Number(localStorage.getItem('fss_gate')       ?? 3),
          showPaywall: show,
        });

        logEvent('visit_home', {
          pathname,
          showPaywall: show,
        });

        if (show) router.replace('/paywall');
      } catch {
        /* safest fallback on any failure */
        router.replace('/paywall');
      } finally {
        setIsLoading(false);
      }
    }

    decide().catch(() => router.replace('/paywall'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* ---------- guards ---------------------------------------------------- */
  if (pathIsExempt(pathname)) return null;
  if (isLoading)              return <LoadingIndicator />;

  if (viewData?.showPaywall) return <Paywall />;

  /* ---------- main public UI ------------------------------------------- */
  if (viewData && pathname === '/') {
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

        <DaysCounter uniqueDays={viewData.uniqueDays} gateDays={viewData.gateDays} />

        <Suspense fallback={<LoadingIndicator />}>
          <TennisCourtList />
        </Suspense>

        <div className="mt-8 space-y-3 text-center sm:space-y-0 sm:space-x-4">
          <Button asChild className="w-full gap-2 sm:w-auto">
            <a
              href="https://anc.apm.activecommunities.com/seattle/reservation/search?facilityTypeIds=39%2C115&resourceType=0&equipmentQty=0"
              target="_blank"
              rel="noopener noreferrer"
            >
              Book Future Reservations
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild className="w-full gap-2 sm:w-auto">
            <a
              href="http://www.tennis-seattle.com?From=185415"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join a Local Tennis League
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    );
  }

  /* ---------- unreachable --------------------------------------------- */
  return null;
}
