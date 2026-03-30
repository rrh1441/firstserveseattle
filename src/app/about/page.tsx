import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Clock, Bell, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "About First Serve Seattle | Real-Time Tennis Court Availability",
  description:
    "First Serve Seattle shows real-time availability for 100+ public tennis courts across Seattle. Stop driving to full courts - see what's open before you go.",
  keywords: [
    "Seattle tennis courts",
    "tennis court availability",
    "Seattle parks tennis",
    "public tennis courts Seattle",
    "tennis reservations Seattle",
    "find open tennis courts",
  ],
  openGraph: {
    title: "About First Serve Seattle",
    description:
      "Real-time availability for 100+ public tennis courts across Seattle. See what's open before you go.",
    type: "website",
    locale: "en_US",
    siteName: "First Serve Seattle",
  },
  twitter: {
    card: "summary_large_image",
    title: "About First Serve Seattle",
    description:
      "Real-time availability for 100+ public tennis courts across Seattle.",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/testworkflow"
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Back to courts"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">About</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            First Serve Seattle
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Real-time tennis court availability for Seattle&apos;s public parks.
            Stop driving to full courts — see what&apos;s open before you go.
          </p>
        </section>

        {/* What We Do */}
        <section className="mb-10">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            What We Do
          </h3>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <MapPin size={20} className="text-emerald-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">100+ Courts Tracked</h4>
                <p className="text-gray-600">
                  We monitor availability across Seattle Parks & Recreation tennis
                  courts, updated throughout the day.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Clock size={20} className="text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Real-Time Updates</h4>
                <p className="text-gray-600">
                  See today&apos;s availability at a glance. Green means open,
                  orange means partial availability, gray means booked.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Bell size={20} className="text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Court Alerts</h4>
                <p className="text-gray-600">
                  Set up email alerts for your favorite courts. We&apos;ll notify
                  you when slots open up at times that work for you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-10">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            How It Works
          </h3>
          <ol className="space-y-3 text-gray-600">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                1
              </span>
              <span>Browse courts by neighborhood or filter by amenities (lights, hitting walls, ball machines)</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                2
              </span>
              <span>Check the timeline to see open slots throughout the day</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                3
              </span>
              <span>Tap the map icon to navigate directly to the court</span>
            </li>
          </ol>
        </section>

        {/* Ball Machine Partner */}
        <section className="mb-10 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Seattle Ball Machine
              </h3>
              <p className="text-gray-600 mb-3">
                Need a practice partner? Our sister service rents portable ball
                machines that you can use at any public court.
              </p>
              <a
                href="https://seattleballmachine.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                Learn more →
              </a>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-10">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact</h3>
          <p className="text-gray-600 mb-4">
            Questions, feedback, or partnership inquiries? We&apos;d love to hear
            from you.
          </p>
          <a
            href="mailto:support@firstserveseattle.com"
            className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
          >
            <Mail size={18} />
            support@firstserveseattle.com
          </a>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          <Link
            href="/testworkflow"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
          >
            <MapPin size={18} />
            Find Open Courts
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6">
        <div className="max-w-2xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} First Serve Seattle. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
