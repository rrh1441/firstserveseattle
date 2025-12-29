"use client";

import Image from "next/image";
import InteractiveCTA from "../components/InteractiveCTA";
import { AuthButtons, FooterSignInButton } from "../components/InteractiveAuth";
import { SavingsCalculator } from "../components/SavingsCalculator";
import { track } from "@vercel/analytics";

export default function LPTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Seattle Ball Machine Banner - Sticky */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-2.5 px-4 text-center shadow-md">
        <a
          href="https://seattleballmachine.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold hover:underline"
          onClick={() =>
            track("banner_seattle_ball_machine_clicked", {
              location: "landing_page",
            })
          }
        >
          Need a ball machine for practice? Check out Seattle Ball Machine →
        </a>
      </div>

      <div className="max-w-4xl mx-auto pt-12">
        {/* Header */}
        <header className="px-4 py-4 bg-white border-b border-gray-200 rounded-b-2xl shadow-sm mx-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Untitled%20design-Gg0C0vPvYqsQxqpotsKmDJRrhnQzej.svg"
                alt="First Serve Seattle logo"
                width={36}
                height={36}
                priority
              />
              <div className="text-lg font-bold text-gray-900">
                First Serve Seattle
              </div>
            </div>
            <AuthButtons />
          </div>
        </header>

        <main className="px-4">
          {/* Hero */}
          <section className="py-16 text-center md:py-20">
            <h1 className="text-4xl font-bold text-gray-900 mb-6 md:text-6xl leading-tight tracking-tight">
              Stop hunting for courts.
              <br />
              Start playing.
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8 md:text-xl leading-relaxed font-medium">
              Seattle&apos;s reservation system locks overnight, hiding which
              courts are first-come, first-served. We check availability before
              it locks, so you know which courts will actually be open.
            </p>

            <InteractiveCTA />
            <p className="text-sm text-gray-500 mt-4 font-medium">
              No credit card required • 2,500+ Seattle players use this every
              month
            </p>
          </section>

          {/* Savings Calculator */}
          <section className="py-12 md:py-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                Why pay for reservations?
              </h2>
              <p className="text-gray-600 mt-2 font-medium">
                Use first-come, first-served courts and save
              </p>
            </div>
            <SavingsCalculator />
          </section>

          {/* The Problem */}
          <section className="py-12 md:py-16">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 md:text-3xl">
                The issue isn&apos;t court availability.
              </h2>
              <p className="text-lg text-gray-500 mb-8 font-semibold">
                It&apos;s what happens overnight.
              </p>

              <div className="space-y-4">
                <p className="text-gray-700 font-medium">
                  Once the reservation system locks, first-come courts are no
                  longer visible.
                </p>
                <p className="text-gray-700 font-medium">
                  Players wake up without knowing which courts are truly open.
                </p>
                <p className="text-gray-700 font-medium">
                  The result: wasted time, unnecessary driving, and missed play.
                </p>
              </div>
            </div>
          </section>

          {/* The Solution */}
          <section className="py-12 md:py-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 md:text-3xl">
              What you get
            </h2>

            <div className="space-y-3">
              {[
                "Every unreserved court across 100+ Seattle locations",
                "Updated daily before the overnight lock",
                "Filters for lighted courts, pickleball lines, practice walls, and ball machines",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-3 items-center bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium">{item}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Testimonial */}
          <section className="py-12 md:py-16">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
              <p className="text-xl text-gray-900 mb-4 md:text-2xl leading-relaxed font-semibold">
                &quot;Used to waste 30 minutes driving between courts. Now I
                know exactly where to go.&quot;
              </p>
              <p className="text-gray-500 font-medium">— Mike R., Capitol Hill</p>
            </div>
          </section>

          {/* CTA */}
          <section className="py-12 md:py-16">
            <div className="bg-emerald-600 rounded-2xl p-8 text-center shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-6 md:text-3xl">
                See which courts are open today
              </h2>
              <InteractiveCTA size="xl" variant="light" />
              <p className="text-sm text-emerald-100 mt-4 font-medium">
                $4 for your first month, then $8/month • Cancel anytime
              </p>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-8 text-center">
            <p className="text-sm text-gray-600 font-medium">
              Have an account? <FooterSignInButton />
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
