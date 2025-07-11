"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
// import { usePostHog } from "posthog-js/react"
import Image from "next/image"

export default function LandingPage() {
  const [isStarting, setIsStarting] = useState(false)
  const [shouldShowPaywall, setShouldShowPaywall] = useState(false)
  const router = useRouter()
  // const posthog = usePostHog()

  // Check paywall status when landing page loads
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const days = JSON.parse(localStorage.getItem('fss_days') ?? '[]')
      const gateDays = Number(localStorage.getItem('fss_gate') ?? 3)
      setShouldShowPaywall(days.length > gateDays)
    }
  }, [])

  const handleGetStarted = () => {
    setIsStarting(true)
    // Mark that they've seen landing
    if (typeof window !== 'undefined') {
      localStorage.setItem('fss_seen_landing', 'true')
    }
    
    // Immediate redirect based on pre-checked paywall status
    if (shouldShowPaywall) {
      router.push("/paywall")
    } else {
      router.push("/")
    }
  }

  const handleSignIn = () => {
    // posthog.capture('landing_signin_clicked')
    router.push("/login")
  }

  const handleSignUp = () => {
    // posthog.capture('landing_signup_clicked')
    router.push("/signup")
  }

  return (
    <div className="min-h-screen bg-white max-w-4xl mx-auto">
      {/* Header */}
      <header className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
              alt="First Serve Seattle Logo"
              width={32}
              height={32}
              priority
            />
            <h1 className="text-lg font-semibold text-[#0c372b] md:text-xl">First Serve Seattle</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSignIn}
              className="text-sm font-medium text-gray-700 px-3 py-1.5"
            >
              Sign In
            </button>
            <button
              onClick={handleSignUp}
              className="text-sm font-medium text-white bg-[#0c372b] px-4 py-1.5 rounded"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 md:px-8">
        {/* Hero */}
        <div className="pt-8 pb-6 text-center md:pt-12 md:pb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 md:text-5xl md:mb-6">
            Where can I<br />walk up and play?
          </h2>
          <p className="text-gray-600 text-lg mb-6 md:text-xl md:mb-8 max-w-2xl mx-auto">
            Daily updates on unreserved tennis and pickleball courts.<br />
            No more driving around guessing.
          </p>

          <button
            onClick={handleGetStarted}
            disabled={isStarting}
            className="w-full md:w-auto md:px-12 bg-[#0c372b] text-white py-3.5 px-6 text-base font-medium rounded hover:bg-[#0a2e21] transition-colors disabled:opacity-50"
          >
            {isStarting ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading courts...
              </div>
            ) : (
              "Try Free for 3 Days"
            )}
          </button>
          <p className="text-sm text-gray-500 mt-2 text-center md:text-base">No credit card required</p>
        </div>

        {/* Trust */}
        <div className="py-4 border-t border-gray-100 text-center md:py-6">
          <p className="text-sm text-gray-600 md:text-base">
            <span className="font-semibold text-gray-900">Used by 2,500+ players</span> every month
          </p>
        </div>

        {/* How it works */}
        <div className="py-6 md:py-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center md:text-2xl md:mb-6">The problem we solve</h3>
          
          <div className="space-y-4 mb-6 max-w-sm mx-auto md:max-w-2xl md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
            <div className="text-center">
              <p className="font-medium text-gray-900">Seattle locks court reservations daily</p>
              <p className="text-sm text-gray-600">You can&apos;t see which courts are actually free for walk-up play</p>
            </div>
            
            <div className="text-center">
              <p className="font-medium text-gray-900">We check every morning at 5 AM</p>
              <p className="text-sm text-gray-600">Know exactly where you can play before you leave home</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="py-6 border-t border-gray-100 md:py-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center md:text-2xl md:mb-6">What you get</h3>
          
          <div className="space-y-3 max-w-xs mx-auto md:max-w-2xl md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-[#0c372b] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">All 100+ Seattle courts</p>
                <p className="text-sm text-gray-600">Tennis and pickleball</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-[#0c372b] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">Updated by 5 AM daily</p>
                <p className="text-sm text-gray-600">Fresh info every morning</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-[#0c372b] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">Feature view</p>
                <p className="text-sm text-gray-600">Find courts with lights, pickleball lines, hitting walls, or nearby ball machine rentals</p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="py-6 border-t border-gray-100 md:py-8">
          <blockquote className="text-gray-700 text-center max-w-sm mx-auto md:max-w-2xl">
            <p className="mb-2 md:text-lg">&quot;Used to waste 30 minutes driving between courts. Now I know exactly where to go.&quot;</p>
            <cite className="text-sm text-gray-600 not-italic md:text-base">— Mike R., Capitol Hill</cite>
          </blockquote>
        </div>

        {/* CTA */}
        <div className="py-6 md:py-8 flex flex-col items-center">
          <button
            onClick={handleGetStarted}
            className="w-full md:w-auto md:px-12 bg-[#0c372b] text-white py-3.5 px-6 text-base font-medium rounded hover:bg-[#0a2e21] transition-colors mb-3"
          >
            Start Free Trial
          </button>
          
          <p className="text-sm text-gray-600 text-center md:text-base">
            $4 first month, then $8/month • Cancel anytime
          </p>
        </div>

        {/* Footer */}
        <div className="py-6 border-t border-gray-100 text-center md:py-8">
          <p className="text-sm text-gray-600 md:text-base">
            Have an account? <button onClick={handleSignIn} className="text-[#0c372b] font-medium">Sign in</button>
          </p>
        </div>
      </main>
    </div>
  )
}