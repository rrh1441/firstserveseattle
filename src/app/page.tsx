// src/app/page.tsx
'use client'

import { useEffect, useState, Suspense, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Paywall from './tennis-courts/components/paywall'
import TennisCourtList from './tennis-courts/components/TennisCourtList'
import ViewsCounter from './tennis-courts/components/counter'
import { ExternalLink } from 'lucide-react'
import { logEvent } from '@/lib/logEvent'
import { useRandomUserId } from './randomUserSetup' // Import the hook

const exemptPaths = [
  '/reset-password',
  '/login',
  '/signup',
  '/members',
  '/privacy-policy',
  '/terms-of-service',
  '/courts', // Keep this exempt if the main courts page is separate
  '/request-password-reset',
]

const LoadingIndicator = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <p className="text-lg text-gray-600 animate-pulse">Loading Courts...</p>
  </div>
)

export default function HomePage() {
  const pathname = usePathname()
  const [userId, setUserId] = useState<string | null>(null) // State to hold the anonymous ID
  const [isLoading, setIsLoading] = useState(true)
  const [viewData, setViewData] =
    useState<{ count: number; showPaywall: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useRandomUserId(); // Call the hook to ensure a userId is generated/loaded

  const isPathExempt = useCallback((current: string) => {
    if (exemptPaths.includes(current)) return true
    if (current.startsWith('/courts/')) return true
    return false
  }, [])

  /* ------------------------------------------------------------------ */
  /*  Update view count & paywall status                               */
  /* ------------------------------------------------------------------ */
  const updateAndCheckViewStatus = useCallback(async (currentUserId: string) => {
    if (!currentUserId || isPathExempt(pathname)) {
      if (isPathExempt(pathname)) setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/update-and-check-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        typeof data.viewsCount !== 'undefined' &&
        typeof data.showPaywall !== 'undefined'
      ) {
        setViewData({ count: data.viewsCount, showPaywall: data.showPaywall })

        logEvent('visit_home', {
          visitNumber: data.viewsCount,
          showPaywall: data.showPaywall,
          pathname,
        })
      } else {
        throw new Error('Invalid data received from view update/check API.')
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'An unknown error occurred'
      setError('Error loading view status. Please try refreshing.')
      setViewData(null)
      console.error('[page.tsx] ' + msg)
    } finally {
      setIsLoading(false)
    }
  }, [pathname, isPathExempt])

  useEffect(() => {
    const storedId = localStorage.getItem('userId');
    setUserId(storedId);
  }, [])

  useEffect(() => {
    if (userId && !isPathExempt(pathname)) {
      updateAndCheckViewStatus(userId)
    } else if (!userId && !isPathExempt(pathname)) {
      setIsLoading(true)
    } else {
      setIsLoading(false)
    }
  }, [userId, pathname, updateAndCheckViewStatus, isPathExempt])

  /* ------------------------------------------------------------------ */
  /*  Render guards                                                     */
  /* ------------------------------------------------------------------ */
  if (isPathExempt(pathname)) return null
  if (isLoading) return <LoadingIndicator />
  if (error)
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="rounded border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </p>
      </div>
    )
  if (viewData?.showPaywall) return <Paywall />

  /* ------------------------------------------------------------------ */
  /*  Main public homepage                                              */
  /* ------------------------------------------------------------------ */
  if (viewData && pathname === '/') {
    return (
      <div className="container mx-auto max-w-4xl bg-white px-4 pt-8 pb-6 md:pt-10 md:pb-8 text-black">
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

        <ViewsCounter viewsCount={viewData.count} />

        <Suspense fallback={<LoadingIndicator />}>
          <TennisCourtList userId={userId} />
        </Suspense>

        <div className="mt-8 text-center space-y-3 sm:space-y-0 sm:space-x-4">
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