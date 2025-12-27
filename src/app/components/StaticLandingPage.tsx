"use client";

import Image from "next/image";
import InteractiveCTA from "./InteractiveCTA";
import { AuthButtons, FooterSignInButton } from "./InteractiveAuth";
import { track } from "@vercel/analytics";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://www.firstserveseattle.com/#organization",
      "name": "First Serve Seattle",
      "url": "https://www.firstserveseattle.com",
      "description": "Daily list of every free Seattle tennis & pickleball court, updated daily by 5 AM. Try 3 free checks.",
      "serviceArea": {
        "@type": "City",
        "name": "Seattle",
        "containedInPlace": {
          "@type": "State",
          "name": "Washington"
        }
      },
      "areaServed": "Seattle, WA",
      "priceRange": "$8/month",
      "telephone": "(206) 457-3039",
      "email": "support@firstserveseattle.com",
      "sameAs": ["https://www.firstserveseattle.com"]
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is First Serve Seattle?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A private website that reads and displays Seattle Parks & Recreation's public tennis-court reservation feed so players can plan court time without using the City's midnight lock-out interface."
          }
        },
        {
          "@type": "Question", 
          "name": "How is the service priced?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Each visitor gets three free open-court views. After that you may start a discounted subscription (50% off) for unlimited views. Continued unlimited access is $8/month (cancel any time)."
          }
        },
        {
          "@type": "Question",
          "name": "Are you affiliated with Seattle Parks & Recreation?", 
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. First Serve Seattle has no sponsorship, endorsement, or contractual relationship with SPR. All permits and on-court rule enforcement remain 100 percent with the City."
          }
        },
        {
          "@type": "Question",
          "name": "Do you store or sell my personal data?",
          "acceptedAnswer": {
            "@type": "Answer", 
            "text": "Viewing the calendar anonymously requires no account. If you start a trial or subscription, Stripe processes payment; we retain only minimal billing records for bookkeeping and never sell user data."
          }
        },
        {
          "@type": "Question",
          "name": "How do I cancel my subscription?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Use the 'Manage Subscription' link in your account settings or email support—cancellations are processed the same business day."
          }
        }
      ]
    }
  ]
};

export default function StaticLandingPage() {

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-white pt-10">
        {/* Seattle Ball Machine Banner - Sticky */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-600 to-green-700 text-white py-2 px-4 text-center shadow-md">
          <a
            href="https://seattleballmachine.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm md:text-base font-medium hover:underline"
            onClick={() => track('banner_seattle_ball_machine_clicked', { location: 'landing_page' })}
          >
            🎾 Need a ball machine for practice? Check out Seattle Ball Machine →
          </a>
        </div>
        
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
              alt="First Serve Seattle logo - Seattle tennis court finder"
              width={32}
              height={32}
              priority
            />
            <div className="text-lg font-semibold text-[#0c372b] md:text-xl">First Serve Seattle</div>
          </div>
          <AuthButtons />
        </div>
      </header>

      <main className="px-4 md:px-8">
        {/* Hero */}
        <section className="pt-10 pb-8 text-center md:pt-16 md:pb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 md:text-5xl leading-tight max-w-2xl mx-auto">
            Stop hunting for courts. Start playing.
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto mb-2 md:text-xl">
            Seattle&apos;s reservation system locks overnight, hiding which courts are first-come, first-served.
          </p>
          <p className="text-lg text-gray-900 max-w-xl mx-auto mb-8 md:text-xl">
            We check availability before it locks, so you know which courts will actually be open.
          </p>

          <InteractiveCTA />
          <p className="text-sm text-gray-500 mt-3">No credit card required • 2,500+ Seattle players use this every month</p>
        </section>

        {/* The Problem */}
        <section className="py-10 border-t border-gray-100 md:py-14">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-1 md:text-3xl">The issue isn&apos;t court availability.</h2>
            <p className="text-lg text-gray-500 mb-8 md:text-xl">It&apos;s what happens overnight.</p>

            <div className="space-y-4">
              <p className="text-gray-700 pl-4 border-l-2 border-gray-200">Once the reservation system locks, first-come courts are no longer visible</p>
              <p className="text-gray-700 pl-4 border-l-2 border-gray-200">Players wake up without knowing which courts are truly open</p>
              <p className="text-gray-700 pl-4 border-l-2 border-gray-200">The result: wasted time, unnecessary driving, and missed play</p>
            </div>
          </div>
        </section>

        {/* How We Help */}
        <section className="py-10 border-t border-gray-100 md:py-14">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8 md:text-3xl">How First Serve Seattle Helps</h2>

            <div className="space-y-4">
              <div className="flex gap-3 items-baseline">
                <svg className="w-5 h-5 text-[#0c372b] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-gray-700">We monitor 100+ Seattle tennis and pickleball courts</p>
              </div>
              <div className="flex gap-3 items-baseline">
                <svg className="w-5 h-5 text-[#0c372b] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-gray-700">We capture availability <strong>before</strong> the overnight lock</p>
              </div>
              <div className="flex gap-3 items-baseline">
                <svg className="w-5 h-5 text-[#0c372b] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-gray-700">You get a clear, same-day list of walk-up-ready courts</p>
              </div>
            </div>

            <p className="mt-6 text-sm text-gray-500">Updated daily. Simple. Reliable.</p>
          </div>
        </section>

        {/* What You Get */}
        <section className="py-10 border-t border-gray-100 md:py-14">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 md:text-3xl">What You Get</h2>

          <div className="space-y-3 max-w-2xl">
            <div className="flex gap-3 items-baseline">
              <svg className="w-5 h-5 text-[#0c372b] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-gray-700">Every unreserved court across Seattle</p>
            </div>
            <div className="flex gap-3 items-baseline">
              <svg className="w-5 h-5 text-[#0c372b] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-gray-700">Updated daily by early morning</p>
            </div>
            <div className="flex gap-3 items-baseline">
              <svg className="w-5 h-5 text-[#0c372b] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-gray-700">Filters for lighted courts, pickleball lines, practice walls, and ball-machine rentals</p>
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-10 border-t border-gray-100 md:py-14">
          <blockquote className="max-w-xl">
            <p className="text-lg text-gray-700 mb-2">&quot;Used to waste 30 minutes driving between courts. Now I know exactly where to go.&quot;</p>
            <cite className="text-sm text-gray-500 not-italic">— Mike R., Capitol Hill</cite>
          </blockquote>
        </section>

        {/* CTA */}
        <section className="py-10 border-t border-gray-100 md:py-14">
          <InteractiveCTA size="xl" />
          <p className="text-sm text-gray-500 mt-3">
            $4 for your first month, then $8/month • Cancel anytime
          </p>
        </section>

        {/* Footer */}
        <footer className="py-6 border-t border-gray-100 text-center md:py-8">
          <p className="text-sm text-gray-600 md:text-base">
            Have an account? <FooterSignInButton />
          </p>
        </footer>
      </main>
        </div>
      </div>
    </>
  );
}