import Image from "next/image";
import InteractiveCTA from "./InteractiveCTA";
import { AuthButtons, FooterSignInButton } from "./InteractiveAuth";
import BallMachineBanner from "./BallMachineBanner";

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
      <div className="min-h-screen bg-white">
        {/* Seattle Ball Machine Banner */}
        <BallMachineBanner />
        
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
          <h1 className="text-5xl font-bold text-gray-900 mb-6 md:text-7xl md:mb-8 leading-none">
            Find open Seattle tennis courts before you leave home
          </h1>
          <p className="text-xl mb-8 md:text-2xl md:mb-10 max-w-2xl mx-auto text-gray-700">
            We check all 100+ Seattle tennis and pickleball courts every day and show you which are free for walk-up play
          </p>

          <InteractiveCTA />
          <p className="text-lg text-gray-500 mt-3 text-center md:text-base">No credit card needed • 2,500+ local players use us monthly</p>
        </section>

        {/* How it works */}
        <section className="py-6 md:py-8">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6 text-center md:text-4xl md:mb-8">Stop wasting time</h2>
          
          <div className="space-y-3 max-w-xs mx-auto md:max-w-2xl md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
            <div className="flex gap-3">
              <span className="text-red-500 font-bold text-lg mt-0.5 flex-shrink-0">•</span>
              <span className="text-gray-900">Seattle tennis court reservation site never shows same-day availability</span>
            </div>
            <div className="flex gap-3">
              <span className="text-red-500 font-bold text-lg mt-0.5 flex-shrink-0">•</span>
              <span className="text-gray-900">You drive around guessing where open courts are available</span>
            </div>
            <div className="flex gap-3">
              <span className="text-red-500 font-bold text-lg mt-0.5 flex-shrink-0">•</span>
              <span className="text-gray-900">Miss out on court time by the time you find a court</span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-6 border-t border-gray-100 md:py-8">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6 text-center md:text-4xl md:mb-8">What you get</h2>
          
          <div className="space-y-3 max-w-xs mx-auto md:max-w-2xl md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-[#0c372b] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-900">Daily list of every unreserved slot across 100+ courts</span>
            </div>
            
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-[#0c372b] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-900">Updated daily by 5 AM</span>
            </div>
            
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-[#0c372b] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-900">Filters for lighted courts, pickleball lines, practice walls, ball-machine rentals</span>
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-6 border-t border-gray-100 md:py-8">
          <blockquote className="text-gray-700 text-center max-w-sm mx-auto md:max-w-2xl">
            <p className="mb-2 md:text-lg">&quot;Used to waste 30 minutes driving between courts. Now I know exactly where to go.&quot;</p>
            <cite className="text-sm text-gray-600 not-italic md:text-base">— Mike R., Capitol Hill</cite>
          </blockquote>
        </section>

        {/* CTA */}
        <section className="py-6 md:py-8 flex flex-col items-center">
          <InteractiveCTA size="xl" />
          
          <p className="text-sm text-gray-600 text-center md:text-base">
            $4 first month, then $8/month • Cancel anytime
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