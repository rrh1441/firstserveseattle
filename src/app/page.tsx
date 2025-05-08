// src/app/login/page.tsx
'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

/* -------------------------------------------------------------------------- */
/*  The inner component holds all logic and calls useSearchParams.            */
/*  It is wrapped in <Suspense> so the Next.js build passes.                  */
/* -------------------------------------------------------------------------- */

function LoginInner() {
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect_to')

  const redirectTo =
    rawRedirect &&
    rawRedirect.startsWith('/') &&
    !rawRedirect.startsWith('//') &&
    !rawRedirect.includes(':')
      ? rawRedirect
      : '/members'

  const router = useRouter()
  const supabase = createClientComponentClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  /* ---------------------------------------------------------------------- */
  /*  Submit handler                                                        */
  /* ---------------------------------------------------------------------- */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    try {
      /* Step 1 – sign in */
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error || !data.session) throw new Error('Invalid email or password.')

      /* Step 2 – check subscription row */
      const { data: subRow, error: subErr } = await supabase
        .from('subscribers')
        .select('status, plan')
        .eq('id', data.session.user.id)
        .single()

      if (subErr && subErr.code !== 'PGRST116') throw subErr

      /* Step 3 – send pending users straight to Checkout */
      if (!subRow || subRow.status === 'pending') {
        const plan = subRow?.plan ?? 'monthly'
        const resp = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, plan }),
        })
        if (!resp.ok) throw new Error(await resp.text())
        const { url } = (await resp.json()) as { url: string | null }
        if (!url) throw new Error('Checkout URL missing.')
        window.location.href = url
        return
      }

      /* Step 4 – active or trialing => members */
      router.push(redirectTo)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
      setLoading(false)
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md space-y-8">
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

        {errorMsg && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-200"
              placeholder="you@example.com"
            />
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-200"
              placeholder="********"
            />
          </div>

          {/* Sign In Button */}
          <Button
            type="submit"
            className="w-full bg-[#0c372b] hover:bg-[#0c372b]/90"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          {/* Forgot Password Link */}
          <div className="text-center text-sm text-gray-600">
            <Link
              href="/request-password-reset"
              className="font-semibold text-blue-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </form>

        <p className="text-center text-sm text-gray-600">
          No account?{' '}
          <Link href="/signup" className="font-semibold text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Root component returns Suspense wrapper                                   */
/* -------------------------------------------------------------------------- */
export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginInner />
    </Suspense>
  )
}
