"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"

interface LandingPageProps {
  isLoading: boolean;
  onGetFreeViews: () => void;
}

export default function LandingPage({ isLoading, onGetFreeViews }: LandingPageProps) {
  const router = useRouter()

  const handleSignIn = () => {
    router.push("/login")
  }

  const handleSignUp = () => {
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
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4 md:text-6xl md:mb-6 leading-tight">
            Find an open Seattle tennis or pickleball court—before you leave home.
          </h2>
          <p className="text-gray-700 text-lg mb-6 md:text-xl md:mb-8 max-w-2xl mx-auto">
            We check all 100+ city courts at 5 AM every day and show you which are free for walk-up play.
          </p>

          <button
            onClick={onGetFreeViews}
            disabled={isLoading}
            className="w-full md:w-auto md:px-8 bg-[#0c372b] text-white py-4 px-6 text-lg font-semibold rounded hover:bg-[#0a2e21] transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Checking status...
              </div>
            ) : (
              "See today's free courts"
            )}
          </button>
          <p className="text-sm text-gray-500 mt-2 text-center md:text-base">No credit card needed • 2,500+ local players use us monthly</p>
        </div>


        {/* How it works */}
        <div className="py-6 md:py-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-center md:text-3xl md:mb-6">The pain</h3>
          
          <div className="space-y-4 mb-6 max-w-sm mx-auto md:max-w-2xl md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
            <div className="text-center">
              <p className="font-medium text-gray-900">Courts open for reservation at midnight and fill fast</p>
              <p className="text-sm text-gray-600">You can&apos;t see which courts are actually free for walk-up play</p>
            </div>
            
            <div className="text-center">
              <p className="font-medium text-gray-900">Seattle's public site never shows true walk-up availability</p>
              <p className="text-sm text-gray-600">No more driving around guessing where you can play</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="py-6 border-t border-gray-100 md:py-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-center md:text-3xl md:mb-6">What you get</h3>
          
          <div className="space-y-3 max-w-xs mx-auto md:max-w-2xl md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-[#0c372b] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">Real-time list of every unreserved slot across 100+ courts</p>
                <p className="text-sm text-gray-600">Tennis and pickleball</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-[#0c372b] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">Fresh results in your inbox by 5 AM—daily</p>
                <p className="text-sm text-gray-600">Fresh info every morning</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-[#0c372b] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">Filters for lights, pickleball lines, walls, ball-machine rentals</p>
                <p className="text-sm text-gray-600">Find exactly what you need</p>
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
            onClick={onGetFreeViews}
            className="w-full md:w-auto md:px-8 bg-[#0c372b] text-white py-4 px-6 text-lg font-semibold rounded hover:bg-[#0a2e21] transition-colors mb-3"
          >
            See today's free courts
          </button>
          
          <p className="text-sm text-gray-600 text-center md:text-base">
            Free trial includes 3 daily court checks • $4 first month, then $8/month • Cancel anytime
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