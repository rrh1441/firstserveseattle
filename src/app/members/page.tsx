'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import TennisCourtList from '../tennis-courts/components/TennisCourtList'
import { Button } from '@/components/ui/button'

/* NEW – helper that runs on the server via a tiny API route */
async function fetchMemberStatus(email: string): Promise<boolean> {
  const r = await fetch(`/api/member-status?email=${encodeURIComponent(email)}`, {
    cache: 'no-store',
  })
  if (!r.ok) return false
  const { isMember } = (await r.json()) as { isMember: boolean }
  return isMember === true
}

export default function MembersPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [sessionAccessToken, setSessionAccessToken] = useState<string | null>(null)

  /* ------------------------------------------------------------------ */
  /*  Auth + subscription check                                         */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const check = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        /* ───────── 1) require login ───────── */
        if (!session) {
          router.push(`/login?redirect_to=${encodeURIComponent(window.location.pathname)}`)
          return
        }
        setSessionAccessToken(session.access_token)

        /* ───────── 2) require active / trialing sub ───────── */
        const ok = await fetchMemberStatus(session.user.email)
        if (!ok) {
          const resp = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: session.user.email, plan: 'monthly' }),
          })
          const { url } = await resp.json()
          window.location.href = url as string
          return
        }
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : String(err))
      } finally {
        setIsLoading(false)
      }
    }

    check()
  }, [router, supabase])

  /* ------------------------------------------------------------------ */
  /*  Stripe customer portal                                            */
  /* ------------------------------------------------------------------ */
  async function handleManageSubscription() {
    if (!sessionAccessToken) {
      setFetchError('Cannot manage subscription: Session token missing.')
      return
    }
    setPortalLoading(true)
    setFetchError(null)
    try {
      const response = await fetch('/api/create-portal-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionAccessToken}`,
        },
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Portal link error')
      }
      const { url } = await response.json()
      window.location.href = url as string
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Portal link error')
    } finally {
      setPortalLoading(false)
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Checking membership status&hellip;</p>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="rounded border border-red-300 bg-red-100 p-4 text-red-500">
          {fetchError} &mdash; please refresh or contact support.
        </p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl bg-white px-4 pt-8 pb-6 md:pt-10 md:pb-8">
      {/* Header */}
      <header className="mb-8 flex flex-col items-center gap-4 md:flex-row md:justify-between">
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
              First&nbsp;Serve&nbsp;Seattle
            </h1>
            <p className="text-base font-semibold md:text-lg">
              Today&rsquo;s Open Tennis and Pickleball Courts
            </p>
          </div>
        </div>

        <Button
          onClick={handleManageSubscription}
          className="w-full whitespace-nowrap bg-[#0c372b] text-white hover:bg-[#0c372b]/90 md:w-auto"
          disabled={portalLoading}
        >
          {portalLoading ? 'Loading…' : 'Manage Your Subscription'}
        </Button>
      </header>

      {/* Court list */}
      <TennisCourtList />

      {/* External links */}
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