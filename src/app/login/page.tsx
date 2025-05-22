/* -------------------------------------------------------------------------- */
/*  src/app/login/page.tsx – full file, lint-clean                            */
/* -------------------------------------------------------------------------- */
'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import type { Session } from '@supabase/auth-helpers-nextjs'

/* -------------------------------------------------------------------------- */
/*  Inner component → contains logic that needs access to hooks               */
/* -------------------------------------------------------------------------- */
function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  /* ---------------------------------------------------------------------- */
  /*  Compute safe redirect target                                          */
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
  /*  Post-sign-in handler (subscription check, Stripe hand-off)            */
  /* ---------------------------------------------------------------------- */
  async function handlePostSignIn(session: Session) {
    /* Step 1 – look up subscriber row */
    const { data: subRow, error: subErr } = await supabase
      .from('subscribers')
      .select('status, plan')
      .eq('id', session.user.id)
      .single()

    if (subErr && subErr.code !== 'PGRST116') {
      console.error(subErr)
      router.replace('/auth/error')
      return
    }

    /* Step 2 – pending  Stripe Checkout */
    if (!subRow || subRow.status === 'pending') {
      const plan = subRow?.plan ?? 'monthly'
      const resp = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email, plan }),
      })
      if (!resp.ok) {
        console.error(await resp.text())
        router.replace('/auth/error')
        return
      }
      const { url } = (await resp.json()) as { url: string | null }
      if (!url) {
        console.error('Missing Checkout URL')
        router.replace('/auth/error')
        return
      }
      window.location.href = url
      return
    }

    /* Step 3 – active or trialing  members */
    router.replace(redirectTo)
  }

  /* ---------------------------------------------------------------------- */
  /*  Listen for auth state changes and act once the user is signed in      */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) handlePostSignIn(session)
    })
    return () => sub.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once

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

        {/* Supabase pre-built form */}
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#0c372b', // primary accent
                  brandAccent: '#0c372b', // button hover
                },
              },
            },
          }}
          /* providers shown as buttons above the email/password form */
          providers={['google']}
          /* → for OAuth redirect; email/password stays on page */
          redirectTo={`${window.location.origin}/login`}
          magicLink={false} /* keep password + OAuth only */
          onlyThirdPartyProviders={false} /* show both */
          localization={{ variables: { sign_in: { email_label: 'Email' } } }}
        />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Export wrapper with Suspense – matches your existing structure           */
/* -------------------------------------------------------------------------- */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginInner />
    </Suspense>
  )
}