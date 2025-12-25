import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import InteractiveCTA from "../components/InteractiveCTA";
import { AuthButtons, FooterSignInButton } from "../components/InteractiveAuth";

export const metadata: Metadata = {
  title: "Seattle Pickleball Courts - Find Open Courts Today | First Serve Seattle",
  description:
    "Find open pickleball courts in Seattle right now. See real-time availability for 30+ public pickleball courts across 15 locations. Updated daily by 5 AM.",
  keywords:
    "seattle pickleball courts, public pickleball courts seattle, open pickleball courts, free pickleball seattle, drop-in pickleball seattle, pickleball courts near me",
  openGraph: {
    title: "Seattle Pickleball Courts - Find Open Courts Today",
    description:
      "Find open pickleball courts in Seattle right now. Real-time availability for 30+ public courts across 15 locations.",
    url: "https://www.firstserveseattle.com/pickleball",
    siteName: "First Serve Seattle",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Seattle Pickleball Courts - Find Open Courts Today",
    description:
      "Find open pickleball courts in Seattle right now. Real-time availability for 30+ public courts.",
  },
  alternates: {
    canonical: "https://www.firstserveseattle.com/pickleball",
  },
};

const pickleballCourts = [
  { name: "Observatory Courts", slug: "observatory_tennis", neighborhood: "Queen Anne" },
  { name: "Bitter Lake Playfield", slug: "bitter_lake_playfield_tennis", neighborhood: "Bitter Lake" },
  { name: "Magnolia Playfield", slug: "magnolia_playfield_tennis", neighborhood: "Magnolia" },
  { name: "Rainier Beach Playfield", slug: "rainier_beach_playfield_tennis", neighborhood: "Rainier Beach" },
  { name: "Miller Playfield", slug: "miller_playfield_tennis", neighborhood: "Capitol Hill" },
  { name: "Mount Baker Park", slug: "mount_baker_park_tennis", neighborhood: "Mount Baker" },
  { name: "Alki Playfield", slug: "alki_playfield_tennis", neighborhood: "West Seattle" },
  { name: "Discovery Park", slug: "discovery_park_tennis", neighborhood: "Magnolia" },
  { name: "Gilman Playfield", slug: "gilman_playfield_tennis", neighborhood: "Ballard" },
  { name: "Soundview Playfield", slug: "soundview_playfield", neighborhood: "Crown Hill" },
  { name: "Beacon Hill Playfield", slug: "beacon_hill_playfield_tennis", neighborhood: "Beacon Hill" },
  { name: "Brighton Playfield", slug: "brighton_playfield_tennis", neighborhood: "Rainier Valley" },
  { name: "Delridge Playfield", slug: "delridge_playfield_tennis", neighborhood: "Delridge" },
  { name: "Dearborn Park", slug: "dearborn_park_tennis", neighborhood: "Beacon Hill" },
  { name: "Walt Hundley Playfield", slug: "walt_hundley_playfield", neighborhood: "West Seattle" },
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://www.firstserveseattle.com/pickleball",
      "name": "Seattle Pickleball Courts - Find Open Courts Today",
      "description": "Find open pickleball courts in Seattle. Real-time availability for 30+ public courts.",
      "url": "https://www.firstserveseattle.com/pickleball",
      "isPartOf": {
        "@id": "https://www.firstserveseattle.com/#website"
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How many public pickleball courts are in Seattle?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Seattle has 30+ public pickleball courts across 15 park locations. All courts with pickleball lines are shared-use with tennis courts."
          }
        },
        {
          "@type": "Question",
          "name": "Are Seattle pickleball courts free?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, all Seattle Parks public pickleball courts are free for walk-up play when not reserved. Courts can be reserved through Seattle Parks & Recreation."
          }
        },
        {
          "@type": "Question",
          "name": "What time do Seattle pickleball courts open?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Most Seattle pickleball courts are open from 6 AM to 10 PM. Courts with lights may be available until 10 PM or later."
          }
        },
        {
          "@type": "Question",
          "name": "Where is the best pickleball in Seattle?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Popular pickleball locations include Observatory Courts (Queen Anne), Bitter Lake Playfield, Magnolia Playfield, and Rainier Beach Playfield. Each has multiple courts with pickleball lines."
          }
        }
      ]
    }
  ]
};

export default function PickleballPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
                  alt="First Serve Seattle logo"
                  width={32}
                  height={32}
                  priority
                />
                <div className="text-lg font-semibold text-[#0c372b] md:text-xl">
                  First Serve Seattle
                </div>
              </Link>
              <AuthButtons />
            </div>
          </header>

          <main className="px-4 md:px-8">
            {/* Hero */}
            <section className="pt-8 pb-6 text-center md:pt-12 md:pb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-6 md:text-6xl md:mb-8 leading-tight">
                Find Open Pickleball Courts in Seattle
              </h1>
              <p className="text-xl mb-8 md:text-2xl md:mb-10 max-w-2xl mx-auto text-gray-700">
                See which public courts are free for walk-up play right now. 30+ courts across 15 Seattle parks, updated daily by 5 AM.
              </p>

              <InteractiveCTA />
              <p className="text-lg text-gray-500 mt-3 text-center md:text-base">
                No credit card needed • Filter by pickleball-lined courts
              </p>
            </section>

            {/* Problem */}
            <section className="py-6 md:py-8">
              <h2 className="text-3xl font-semibold text-gray-900 mb-6 text-center md:text-4xl md:mb-8">
                Stop driving around looking for open courts
              </h2>

              <div className="space-y-3 max-w-xs mx-auto md:max-w-2xl md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
                <div className="flex gap-3">
                  <span className="text-red-500 font-bold text-lg mt-0.5 flex-shrink-0">
                    •
                  </span>
                  <span className="text-gray-900">
                    Seattle&apos;s reservation site doesn&apos;t show same-day availability
                  </span>
                </div>
                <div className="flex gap-3">
                  <span className="text-red-500 font-bold text-lg mt-0.5 flex-shrink-0">
                    •
                  </span>
                  <span className="text-gray-900">
                    Popular courts fill up fast on weekends
                  </span>
                </div>
                <div className="flex gap-3">
                  <span className="text-red-500 font-bold text-lg mt-0.5 flex-shrink-0">
                    •
                  </span>
                  <span className="text-gray-900">
                    You waste time checking multiple parks
                  </span>
                </div>
              </div>
            </section>

            {/* Features */}
            <section className="py-6 border-t border-gray-100 md:py-8">
              <h2 className="text-3xl font-semibold text-gray-900 mb-6 text-center md:text-4xl md:mb-8">
                What you get
              </h2>

              <div className="space-y-3 max-w-xs mx-auto md:max-w-2xl md:grid md:grid-cols-3 md:gap-6 md:space-y-0">
                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 text-[#0c372b] mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-900">
                    Real-time availability for all pickleball-lined courts
                  </span>
                </div>

                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 text-[#0c372b] mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-900">
                    Filter for courts with lights for evening play
                  </span>
                </div>

                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 text-[#0c372b] mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-900">
                    Updated daily by 5 AM Pacific
                  </span>
                </div>
              </div>
            </section>

            {/* Court List */}
            <section className="py-6 border-t border-gray-100 md:py-8">
              <h2 className="text-3xl font-semibold text-gray-900 mb-6 text-center md:text-4xl md:mb-8">
                Seattle Pickleball Courts
              </h2>
              <p className="text-center text-gray-600 mb-6">
                15 parks with pickleball-lined courts
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pickleballCourts.map((court) => (
                  <Link
                    key={court.slug}
                    href={`/courts/${court.slug}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-[#0c372b] hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{court.name}</div>
                    <div className="text-sm text-gray-500">{court.neighborhood}</div>
                  </Link>
                ))}
              </div>
            </section>

            {/* FAQ */}
            <section className="py-6 border-t border-gray-100 md:py-8">
              <h2 className="text-3xl font-semibold text-gray-900 mb-6 text-center md:text-4xl md:mb-8">
                Frequently Asked Questions
              </h2>

              <div className="space-y-6 max-w-2xl mx-auto">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    How many public pickleball courts are in Seattle?
                  </h3>
                  <p className="text-gray-600">
                    Seattle has 30+ public pickleball courts across 15 park locations. All courts with pickleball lines are shared-use with tennis courts.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Are Seattle pickleball courts free?
                  </h3>
                  <p className="text-gray-600">
                    Yes, all Seattle Parks public pickleball courts are free for walk-up play when not reserved. Courts can be reserved through Seattle Parks & Recreation for $16/hour.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    What time do Seattle pickleball courts open?
                  </h3>
                  <p className="text-gray-600">
                    Most Seattle pickleball courts are open from 6 AM to 10 PM. Courts with lights (like Bitter Lake, Miller, and Rainier Beach) may be available for evening play.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Where are the best pickleball courts in Seattle?
                  </h3>
                  <p className="text-gray-600">
                    Popular locations include Observatory Courts (Queen Anne), Bitter Lake Playfield (4 courts), Magnolia Playfield (4 courts), and Rainier Beach Playfield (4 courts with lights).
                  </p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="py-6 md:py-8 flex flex-col items-center">
              <InteractiveCTA size="xl" />

              <p className="text-sm text-gray-600 text-center md:text-base mt-3">
                $4 first month, then $8/month • Cancel anytime
              </p>
            </section>

            {/* Footer */}
            <footer className="py-6 border-t border-gray-100 text-center md:py-8">
              <p className="text-sm text-gray-600 md:text-base mb-2">
                Have an account? <FooterSignInButton />
              </p>
              <p className="text-sm text-gray-500">
                <Link href="/" className="hover:underline">
                  Also tracking 100+ tennis courts
                </Link>
              </p>
            </footer>
          </main>
        </div>
      </div>
    </>
  );
}
