'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import type { Session } from '@supabase/auth-helpers-nextjs'

/* -------------------------------------------------------------------------- */
/*  Helper – server round-trip to verify Stripe membership                    */
/* -------------------------------------------------------------------------- */
async function fetchMemberStatus(email: string): Promise<boolean> {
  const r = await fetch(`/api/member-status?email=${encodeURIComponent(email)}`, { 
    cache: 'no-store' 
  })
  if (!r.ok) return false
  const { isMember } = (await r.json()) as { isMember: boolean }
  return isMember === true
}

/* -------------------------------------------------------------------------- */
/*  Inner component                                                           */
/* -------------------------------------------------------------------------- */
function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  /* safe redirect target --------------------------------------------------- */
  const rawRedirect = searchParams.get('redirect_to')
  const redirectTo =
    rawRedirect &&
    rawRedirect.startsWith('/') &&
    !rawRedirect.startsWith('//') &&
    !rawRedirect.includes(':')
      ? rawRedirect
      : '/members'

  /* post-sign-in flow ------------------------------------------------------ */
  async function handlePostSignIn(session: Session) {
    if (!session.user.email) {
      console.error('No email in session')
      return
    }

    console.log('🔍 Checking membership for:', session.user.email)
    
    const isMember = await fetchMemberStatus(session.user.email)
    
    console.log('📊 Member status result:', isMember)
    
    if (!isMember) {
      console.log('❌ Not a member, redirecting to checkout')
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

    console.log('✅ Is member, redirecting to:', redirectTo)
    router.replace(redirectTo)
  }

  /* listen for auth events ------------------------------------------------- */
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth state change:', event, session?.user?.email)
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        handlePostSignIn(session)
      }
    })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* render ----------------------------------------------------------------- */
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
          view="sign_in"            /* <— force sign-in view            */
          providers={[]}            /* email/password only             */
          magicLink={false}
          onlyThirdPartyProviders={false}
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
          localization={{ variables: { sign_in: { email_label: 'Email' } } }}
        />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Suspense wrapper                                                          */
/* -------------------------------------------------------------------------- */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginInner />
    </Suspense>
  )
}