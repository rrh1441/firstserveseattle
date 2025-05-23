/* -------------------------------------------------------------------------- */
/*  src/app/page.tsx                                                          */
/*  Home page with                                                           */
/*   – anonymous-ID handling                                                 */
/*   – unique-day gating (3 / 5 / 7)                                          */
/*   – fail-open behaviour if API is down                                     */
/* -------------------------------------------------------------------------- */

'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import Paywall from './tennis-courts/components/paywall'
import TennisCourtList from './tennis-courts/components/TennisCourtList'
import DaysCounter from './tennis-courts/components/DaysCounter'

import { logEvent } from '@/lib/logEvent'
import { useRandomUserId } from './randomUserSetup'

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */
const EXEMPT_PATHS = [
  '/reset-password',
  '/login',
  '/signup',
  '/members',
  '/privacy-policy',
  '/terms-of-service',
  '/courts',
  '/request-password-reset',
]

const LoadingIndicator = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <p className="animate-pulse text-lg text-gray-600">Loading Courts…</p>
  </div>
)

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */
interface ViewState {
  count: number
  gate: number
  showPaywall: boolean
}

export default function HomePage() {
  const pathname = usePathname()

  /* ---------- local state --------------------------------------------- */
  const [userId, setUserId]       = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [viewData, setViewData]   = useState<ViewState | null>(null)

  /* ---------- ensure anonymous ID exists ------------------------------ */
  useRandomUserId()

  /* ---------- helpers ------------------------------------------------- */
  const isPathExempt = useCallback(
    (p: string) => EXEMPT_PATHS.includes(p) || p.startsWith('/courts/'),
    [],
  )

  /* -------------------------------------------------------------------- */
  /*  Update unique-day count & paywall status                            */
  /* -------------------------------------------------------------------- */
  const updateAndCheckViewStatus = useCallback(
    async (currentUserId: string) => {
      if (!currentUserId || isPathExempt(pathname)) {
        if (isPathExempt(pathname)) setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const gateHeader =
          typeof window !== 'undefined'
            ? localStorage.getItem('fss_gate') ?? ''
            : ''

        const res = await fetch('/api/update-and-check-session', {
          method : 'POST',
          headers: {
            'Content-Type' : 'application/json',
            'x-paywall-gate': gateHeader,
          },
          body: JSON.stringify({ userId: currentUserId }),
        })

        if (!res.ok) {
          const detail = await res.text()
          throw new Error(
            `Failed to update/check view status (${res.status}): ${detail}`,
          )
        }

        const data = await res.json()
        if (
          data &&
          typeof data.uniqueDays !== 'undefined' &&
          typeof data.showPaywall !== 'undefined' &&
          typeof data.gateDays   !== 'undefined'
        ) {
          setViewData({
            count      : data.uniqueDays,
            gate       : data.gateDays,
            showPaywall: data.showPaywall,
          })

          logEvent('visit_home', {
            uniqueDays : data.uniqueDays,
            gateDays   : data.gateDays,
            showPaywall: data.showPaywall,
            pathname,
          })
        } else {
          throw new Error('Invalid data received from view update/check API.')
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'An unknown error occurred'
        console.error('[page.tsx] ' + msg)
        setError('Error loading view status. Please try refreshing.')
        setViewData(null)
      } finally {
        setIsLoading(false)
      }
    },
    [pathname, isPathExempt],
  )

  /* ---------- load anonymous ID from localStorage --------------------- */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserId(localStorage.getItem('userId'))
    }
  }, [])

  /* ---------- trigger API call on nav/userId change ------------------- */
  useEffect(() => {
    if (userId && !isPathExempt(pathname)) {
      updateAndCheckViewStatus(userId)
    } else if (!userId && !isPathExempt(pathname)) {
      setIsLoading(true)
    } else {
      setIsLoading(false)
    }
  }, [userId, pathname, updateAndCheckViewStatus, isPathExempt])

  /* -------------------------------------------------------------------- */
  /*  Render guards                                                       */
  /* -------------------------------------------------------------------- */
  if (isPathExempt(pathname)) return null
  if (isLoading)              return <LoadingIndicator />
  if (error)
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="rounded border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </p>
      </div>
    )
  if (viewData?.showPaywall) return <Paywall />

  /* -------------------------------------------------------------------- */
  /*  Main public homepage                                                */
  /* -------------------------------------------------------------------- */
  if (viewData && pathname === '/') {
    return (
      <div className="container mx-auto max-w-4xl bg-white px-4 pt-8 pb-6 text-black md:pt-10 md:pb-8">
        {/* ---------- Header ---------- */}
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

        {/* ---------- Counter ---------- */}
        <DaysCounter uniqueDays={viewData.count} gateDays={viewData.gate} />

        {/* ---------- Courts list ------- */}
        <Suspense fallback={<LoadingIndicator />}>
          <TennisCourtList />
        </Suspense>

        {/* ---------- Footer CTAs ------- */}
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
    )
  }

  console.warn(
    'HomePage reached unexpected render state for non-exempt path:',
    pathname,
  )
  return null
}