import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MapPin, Clock, CheckCircle, ExternalLink } from "lucide-react";
import { listFacilitySlugs, loadFacility } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "Free Tennis Courts in Seattle | 100+ Public Courts | First Serve Seattle",
  description:
    "Find free tennis courts in Seattle. All 100+ Seattle Parks public tennis courts are free to play. Browse by neighborhood, check real-time availability, and find courts near you.",
  keywords: [
    "free tennis courts seattle",
    "free public tennis courts seattle",
    "seattle parks tennis courts",
    "where to play tennis for free seattle",
    "free tennis near me seattle",
    "public tennis courts seattle wa",
    "free outdoor tennis courts seattle",
    "seattle recreation tennis",
    "walk-up tennis courts seattle",
    "no reservation tennis seattle",
  ],
  openGraph: {
    title: "Free Tennis Courts in Seattle | 100+ Public Courts",
    description:
      "All Seattle Parks tennis courts are free to play. Find 100+ free public courts across every neighborhood with real-time availability.",
    type: "website",
    locale: "en_US",
    siteName: "First Serve Seattle",
    url: "https://www.firstserveseattle.com/free-tennis-courts-seattle",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Tennis Courts in Seattle | 100+ Public Courts",
    description:
      "Find free tennis courts across Seattle. Browse 100+ public courts with real-time availability.",
  },
  alternates: {
    canonical: "https://www.firstserveseattle.com/free-tennis-courts-seattle",
  },
};

// Group facilities by neighborhood
interface FacilityInfo {
  slug: string;
  name: string;
  neighborhood: string;
  address: string;
  courtCount: number;
}

async function getFacilitiesByNeighborhood(): Promise<Record<string, FacilityInfo[]>> {
  const slugs = await listFacilitySlugs();
  const facilities = await Promise.all(
    slugs.map(async (slug) => {
      const facility = await loadFacility(slug);
      return {
        slug: facility.data.slug || slug.replace(/_/g, "-"),
        name: facility.data.facility_name,
        neighborhood: facility.data.neighborhood,
        address: facility.data.address,
        courtCount: facility.data.court_count,
      };
    })
  );

  // Group by neighborhood
  const grouped: Record<string, FacilityInfo[]> = {};
  for (const facility of facilities) {
    const hood = facility.neighborhood || "Other";
    if (!grouped[hood]) {
      grouped[hood] = [];
    }
    grouped[hood].push(facility);
  }

  // Sort neighborhoods alphabetically and facilities within each
  const sorted: Record<string, FacilityInfo[]> = {};
  Object.keys(grouped)
    .sort()
    .forEach((key) => {
      sorted[key] = grouped[key].sort((a, b) => a.name.localeCompare(b.name));
    });

  return sorted;
}

// FAQ data for structured data
const faqs = [
  {
    question: "Are tennis courts free in Seattle?",
    answer:
      "Yes! All 100+ Seattle Parks & Recreation tennis courts are completely free to use. Courts operate on a first-come, first-served basis for walk-up play, with optional reservations available at some locations for $15/hour through Amy Yee Tennis Center.",
  },
  {
    question: "Do I need to reserve a tennis court in Seattle?",
    answer:
      "No reservation is required. Most Seattle public tennis courts are available for free walk-up play. However, some popular courts like Lower Woodland and Amy Yee Tennis Center offer optional reservations if you want to guarantee a specific time slot.",
  },
  {
    question: "What are the best free tennis courts in Seattle?",
    answer:
      "Popular free tennis courts include Lower Woodland Playfield (12 courts), Green Lake Park, Volunteer Park, Madison Park, and Magnolia Playfield. Lower Woodland is the largest public tennis facility in Seattle with a strong local tennis community.",
  },
  {
    question: "Are Seattle tennis courts lit for night play?",
    answer:
      "Some Seattle tennis courts have lights for evening play, including Lower Woodland Playfield, Amy Yee Tennis Center, and several neighborhood courts. Courts with lights typically stay open until 10 PM.",
  },
  {
    question: "Can I play pickleball on Seattle tennis courts?",
    answer:
      "Yes, many Seattle tennis courts are lined for pickleball. Dedicated pickleball courts are available at locations like Green Lake Park (east side) and several community centers. Some tennis courts have shared lines for both sports.",
  },
];

export default async function FreeTennisCourtsSeattlePage() {
  const facilitiesByNeighborhood = await getFacilitiesByNeighborhood();
  const totalCourts = Object.values(facilitiesByNeighborhood)
    .flat()
    .reduce((sum, f) => sum + f.courtCount, 0);
  const totalFacilities = Object.values(facilitiesByNeighborhood).flat().length;

  // FAQ structured data
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  // Local business structured data
  const localBusinessData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Free Tennis Courts in Seattle",
    description:
      "Complete guide to all free public tennis courts in Seattle, Washington. Find 100+ courts across Seattle Parks & Recreation.",
    url: "https://www.firstserveseattle.com/free-tennis-courts-seattle",
    mainEntity: {
      "@type": "ItemList",
      name: "Seattle Public Tennis Courts",
      description: "Free public tennis courts operated by Seattle Parks & Recreation",
      numberOfItems: totalFacilities,
      itemListElement: Object.values(facilitiesByNeighborhood)
        .flat()
        .map((facility, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "SportsActivityLocation",
            name: facility.name,
            address: facility.address,
            sport: "Tennis",
          },
        })),
    },
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessData) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link
              href="/"
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Back to home"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <h1 className="text-lg font-bold text-gray-900">Free Tennis Courts</h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Hero Section */}
          <section className="mb-10">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Free Tennis Courts in Seattle
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed mb-6">
              All {totalCourts}+ public tennis courts across Seattle are{" "}
              <strong>completely free</strong> to play. No membership required, no fees —
              just show up and play.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-emerald-600">{totalCourts}+</div>
                <div className="text-sm text-emerald-700">Free Courts</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{totalFacilities}</div>
                <div className="text-sm text-blue-700">Locations</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-amber-600">$0</div>
                <div className="text-sm text-amber-700">Cost to Play</div>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/courts"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
            >
              <Clock size={18} />
              Check Real-Time Availability
            </Link>
          </section>

          {/* Key Benefits */}
          <section className="mb-10 bg-white rounded-2xl p-6 shadow-sm border">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Why Seattle Tennis Courts Are Free
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <CheckCircle size={20} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>Public Parks:</strong> All courts are operated by Seattle Parks &
                  Recreation and funded by taxpayers
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <CheckCircle size={20} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>Walk-Up Play:</strong> First-come, first-served — no advance booking
                  required
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <CheckCircle size={20} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>Open to Everyone:</strong> No Seattle residency required — visitors
                  welcome
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <CheckCircle size={20} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">
                  <strong>Year-Round Access:</strong> Courts open dawn to dusk (10 PM for lit
                  courts)
                </p>
              </div>
            </div>
          </section>

          {/* Courts by Neighborhood */}
          <section className="mb-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Free Courts by Neighborhood
            </h3>

            <div className="space-y-6">
              {Object.entries(facilitiesByNeighborhood).map(([neighborhood, facilities]) => (
                <div key={neighborhood} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <MapPin size={16} className="text-emerald-600" />
                      {neighborhood}
                      <span className="text-sm font-normal text-gray-500">
                        ({facilities.reduce((sum, f) => sum + f.courtCount, 0)} courts)
                      </span>
                    </h4>
                  </div>
                  <div className="divide-y">
                    {facilities.map((facility) => (
                      <Link
                        key={facility.slug}
                        href={`/courts/${facility.slug}`}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{facility.name}</div>
                          <div className="text-sm text-gray-500">
                            {facility.courtCount} court{facility.courtCount !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <ExternalLink size={16} className="text-gray-400" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h3>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border p-5">
                  <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Tips Section */}
          <section className="mb-10 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Tips for Finding Open Courts
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="text-emerald-600 font-bold">1.</span>
                <span>
                  <strong>Check availability first</strong> — use First Serve Seattle to see
                  which courts have open slots before you drive
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600 font-bold">2.</span>
                <span>
                  <strong>Weekday mornings are quietest</strong> — most courts are busy on
                  weekends and after 5 PM on weekdays
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600 font-bold">3.</span>
                <span>
                  <strong>Have a backup option</strong> — if your first choice is full, know
                  another court nearby
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600 font-bold">4.</span>
                <span>
                  <strong>Respect the 1-hour rule</strong> — when others are waiting, limit
                  your play to one hour
                </span>
              </li>
            </ul>
          </section>

          {/* Final CTA */}
          <section className="text-center py-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Find an Open Court?
            </h3>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              Stop driving to full courts. Check real-time availability for all Seattle
              tennis courts and find an open court near you.
            </p>
            <Link
              href="/courts"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
            >
              <MapPin size={20} />
              View All Courts
            </Link>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t bg-white py-6">
          <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} First Serve Seattle. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
