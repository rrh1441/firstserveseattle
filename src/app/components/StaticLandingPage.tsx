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
        <section className="pt-8 pb-6 text-center md:pt-12 md:pb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 md:text-6xl leading-tight">
            Stop hunting for courts.
          </h1>
          <p className="text-3xl font-semibold text-[#0c372b] mb-6 md:text-5xl">
            Start playing.
          </p>
          <p className="text-lg md:text-xl text-gray-600 max-w-xl mx-auto mb-4">
            Seattle&apos;s reservation system locks overnight, hiding which courts are first-come, first-served the next day.
          </p>
          <p className="text-lg md:text-xl text-gray-800 font-medium max-w-xl mx-auto mb-8">
            We check court availability before it locks, so you know which courts will actually be open.
          </p>

          <InteractiveCTA />
          <p className="text-base text-gray-500 mt-3 text-center">No credit card required • 2,500+ Seattle players use this every month</p>
        </section>

        {/* The Problem - Dark Section */}
        <section className="bg-gray-900 text-white py-12 md:py-16 -mx-4 md:-mx-8 px-6 md:px-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">The issue isn&apos;t court availability.</h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">It&apos;s what happens overnight.</p>

            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <span className="text-red-400 text-xl flex-shrink-0">✕</span>
                <p className="text-gray-200">Once the reservation system locks, first-come courts are no longer visible</p>
              </div>
              <div className="flex gap-4 items-start">
                <span className="text-red-400 text-xl flex-shrink-0">✕</span>
                <p className="text-gray-200">Players wake up without knowing which courts are truly open</p>
              </div>
              <div className="flex gap-4 items-start">
                <span className="text-red-400 text-xl flex-shrink-0">✕</span>
                <p className="text-gray-200">The result: wasted time, unnecessary driving, and missed play</p>
              </div>
            </div>
          </div>
        </section>

        {/* How First Serve Seattle Helps - Light Green Section */}
        <section className="bg-gradient-to-b from-emerald-50 to-white py-12 md:py-16 -mx-4 md:-mx-8 px-6 md:px-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              How First Serve Seattle Helps
            </h2>

            <div className="space-y-4">
              <div className="flex gap-4 items-start bg-white p-4 rounded-lg shadow-sm">
                <span className="text-[#0c372b] text-xl flex-shrink-0">✓</span>
                <p className="text-gray-800">We monitor 100+ Seattle tennis and pickleball courts</p>
              </div>
              <div className="flex gap-4 items-start bg-white p-4 rounded-lg shadow-sm">
                <span className="text-[#0c372b] text-xl flex-shrink-0">✓</span>
                <p className="text-gray-800">We capture availability <strong>before</strong> the overnight lock</p>
              </div>
              <div className="flex gap-4 items-start bg-white p-4 rounded-lg shadow-sm">
                <span className="text-[#0c372b] text-xl flex-shrink-0">✓</span>
                <p className="text-gray-800">You get a clear, same-day list of walk-up-ready courts</p>
              </div>
            </div>

            <p className="mt-8 text-gray-600 font-medium text-center">Updated daily. Simple. Reliable.</p>
          </div>
        </section>

        {/* What You Get - Icon Cards */}
        <section className="py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">What You Get</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="text-center p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🎾</div>
              <p className="font-medium text-gray-900 text-sm md:text-base">Every unreserved court across Seattle</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🌅</div>
              <p className="font-medium text-gray-900 text-sm md:text-base">Updated daily by early morning</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">💡</div>
              <p className="font-medium text-gray-900 text-sm md:text-base">Filters for lighted courts</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🏓</div>
              <p className="font-medium text-gray-900 text-sm md:text-base">Pickleball lines, walls & ball machines</p>
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-8 border-t border-gray-100 md:py-12">
          <blockquote className="text-gray-700 text-center max-w-sm mx-auto md:max-w-2xl">
            <p className="mb-3 text-lg md:text-xl italic">&quot;Used to waste 30 minutes driving between courts. Now I know exactly where to go.&quot;</p>
            <cite className="text-sm text-gray-600 not-italic md:text-base">— Mike R., Capitol Hill</cite>
          </blockquote>
        </section>

        {/* CTA - Dark Section */}
        <section className="bg-[#0c372b] text-white py-12 md:py-16 -mx-4 md:-mx-8 px-6 md:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to stop guessing?</h2>
          <p className="text-lg text-gray-300 mb-8">See which courts are actually open today.</p>

          <InteractiveCTA variant="light" size="xl" />

          <p className="mt-4 text-sm text-gray-300">
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