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
          <h1 className="text-5xl font-bold text-gray-900 mb-6 md:text-7xl md:mb-8 leading-none">
            Find open Seattle tennis courts before you leave home
          </h1>
          <p className="text-xl mb-8 md:text-2xl md:mb-10 max-w-2xl mx-auto text-gray-700">
            We check all 100+ Seattle tennis and pickleball courts every day and show you which are free for walk-up play
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
          <p className="text-md text-gray-500 mt-2 text-center md:text-base">No credit card needed • 2,500+ local players use us monthly</p>
        </div>


        {/* How it works */}
        <div className="py-6 md:py-8">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6 text-center md:text-4xl md:mb-8">Stop wasting time</h2>
          
          <div className="space-y-3 max-w-xs mx-auto md:max-w-2xl md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
            <div className="flex gap-3">
              <span className="text-red-500 font-bold text-lg mt-0.5 flex-shrink-0">•</span>
              <span className="text-gray-900">Seattle&apos;s reservation site never shows same-day availability</span>
            </div>
            <div className="flex gap-3">
              <span className="text-red-500 font-bold text-lg mt-0.5 flex-shrink-0">•</span>
              <span className="text-gray-900">You drive around guessing where to play</span>
            </div>
            <div className="flex gap-3">
              <span className="text-red-500 font-bold text-lg mt-0.5 flex-shrink-0">•</span>
              <span className="text-gray-900">Miss out on court time by the time you find a court</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="py-6 border-t border-gray-100 md:py-8">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6 text-center md:text-4xl md:mb-8">What you get</h2>
          
          <div className="space-y-3 max-w-xs mx-auto md:max-w-2xl md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-[#0c372b] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-900">Real-time list of every unreserved slot across 100+ courts</span>
            </div>
            
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-[#0c372b] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-900">Updated daily by 5 AM</span>
            </div>
            
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-[#0c372b] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-900">Filters for lights, pickleball lines, walls, ball-machine rentals</span>
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
            See today&apos;s free courts
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