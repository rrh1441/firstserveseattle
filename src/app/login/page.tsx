'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import type { Session } from '@supabase/auth-helpers-nextjs'

/* -------------------------------------------------------------------------- */
/*  Helper – runs on the server via a small API route                         */
/* -------------------------------------------------------------------------- */
async function fetchMemberStatus(): Promise<boolean> {
  const r = await fetch('/api/member-status', { cache: 'no-store' })
  if (!r.ok) return false
  const { isMember } = (await r.json()) as { isMember: boolean }
  return isMember === true
}

/* -------------------------------------------------------------------------- */
/*  Inner component – requires access to client-side hooks                    */
/* -------------------------------------------------------------------------- */
function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  /* ---------------------------------------------------------------------- */
  /*  Safe redirect target                                                  */
  /* ---------------------------------------------------------------------- */
  const rawRedirect = searchParams.get('redirect_to')
  const redirectTo =
    rawRedirect &&
    rawRedirect.startsWith('/') &&
    !rawRedirect.startsWith('//') &&
    !rawRedirect.includes(':')
      ? rawRedirect
      : '/members'

  /* ---------------------------------------------------------------------- */
  /*  Post-sign-in handler                                                  */
  /* ---------------------------------------------------------------------- */
  async function handlePostSignIn(session: Session) {
    const isMember = await fetchMemberStatus()

    if (!isMember) {
      const plan = 'monthly'
      const resp = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email, plan }),
      })
      const { url } = (await resp.json()) as { url: string | null }
      window.location.href = url as string
      return
    }

    router.replace(redirectTo)
  }

  /* ---------------------------------------------------------------------- */
  /*  Listen for auth state changes                                         */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        handlePostSignIn(session)
      }
    })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------------------------------------------------------------------- */
  /*  Render Supabase Auth UI                                               */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* logo + heading */}
        <div className="flex flex-col items-center gap-4">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
            alt="First Serve Seattle Logo"
            width={80}
            height={80}
            priority
          />
          <h1 className="text-2xl font-bold">Sign in to First Serve Seattle</h1>
        </div>

        {/* Supabase Auth form */}
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#0c372b',
                  brandAccent: '#0c372b',
                },
              },
            },
          }}
          providers={[]}
          redirectTo={`${window.location.origin}/login`}
          magicLink={false}
          onlyThirdPartyProviders={false}
          localization={{ variables: { sign_in: { email_label: 'Email' } } }}
        />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Wrapper with Suspense                                                    */
/* -------------------------------------------------------------------------- */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginInner />
    </Suspense>
  )
}
