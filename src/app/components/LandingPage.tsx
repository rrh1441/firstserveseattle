"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const [isStarting, setIsStarting] = useState(false)
  const router = useRouter()

  const handleGetStarted = async () => {
    setIsStarting(true)
    // Mark that they've seen landing
    if (typeof window !== 'undefined') {
      localStorage.setItem('fss_seen_landing', 'true')
    }
    // Simulate navigation to main app
    await new Promise((resolve) => setTimeout(resolve, 800))
    router.push("/")
  }

  const handleSignIn = () => {
    router.push("/login")
  }

  const handleSignUp = () => {
    router.push("/signup")
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#0c372b] rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-sm font-semibold text-[#0c372b]">First Serve Seattle</h1>
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

      <main className="px-4">
        {/* Hero */}
        <div className="pt-8 pb-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Where can I<br />walk up and play?
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Daily updates on unreserved tennis and pickleball courts.<br />
            No more driving around guessing.
          </p>

          <button
            onClick={handleGetStarted}
            disabled={isStarting}
            className="w-full bg-[#0c372b] text-white py-3.5 px-6 text-base font-medium rounded hover:bg-[#0a2e21] transition-colors disabled:opacity-50"
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
          <p className="text-sm text-gray-500 mt-2 text-center">No credit card required</p>
        </div>

        {/* Trust */}
        <div className="py-4 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">Used by 2,500+ players</span> every month
          </p>
        </div>

        {/* How it works */}
        <div className="py-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">The problem we solve</h3>
          
          <div className="space-y-4 mb-6 max-w-sm mx-auto">
            <div className="text-center">
              <p className="font-medium text-gray-900">Seattle locks court reservations daily</p>
              <p className="text-sm text-gray-600">You can't see which courts are actually free for walk-up play</p>
            </div>
            
            <div className="text-center">
              <p className="font-medium text-gray-900">We check every morning at 5 AM</p>
              <p className="text-sm text-gray-600">Know exactly where you can play before you leave home</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="py-6 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">What you get</h3>
          
          <div className="space-y-3 max-w-xs mx-auto">
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
        <div className="py-6 border-t border-gray-100">
          <blockquote className="text-gray-700 text-center max-w-sm mx-auto">
            <p className="mb-2">"Used to waste 30 minutes driving between courts. Now I know exactly where to go."</p>
            <cite className="text-sm text-gray-600 not-italic">— Mike R., Capitol Hill</cite>
          </blockquote>
        </div>

        {/* CTA */}
        <div className="py-6">
          <button
            onClick={handleGetStarted}
            className="w-full bg-[#0c372b] text-white py-3.5 px-6 text-base font-medium rounded hover:bg-[#0a2e21] transition-colors mb-3"
          >
            Start Free Trial
          </button>
          
          <p className="text-sm text-gray-600 text-center">
            $4 first month, then $8/month • Cancel anytime
          </p>
        </div>

        {/* Footer */}
        <div className="py-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Have an account? <button onClick={handleSignIn} className="text-[#0c372b] font-medium">Sign in</button>
          </p>
        </div>
      </main>
    </div>
  )
}