"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthButtons, FooterSignInButton } from "../components/InteractiveAuth";
import { SavingsCalculator } from "../components/SavingsCalculator";
import EmailCaptureModal from "../components/EmailCaptureModal";
import { track } from "@vercel/analytics";

export default function LPTestPage() {
  const router = useRouter();
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleEmailTrialClick = () => {
    track("lp_email_trial_click", { location: "hero" });
    setShowEmailModal(true);
  };

  const handleEmailSuccess = (preferencesUrl: string) => {
    setShowEmailModal(false);
    router.push(preferencesUrl);
  };

  return (
    <div className="min-h-screen bg-white">
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
        <header className="px-4 py-4 border-b border-gray-100 mx-4">
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
          <section className="py-10 text-center md:py-14">
            <h1 className="text-4xl font-bold text-gray-900 mb-8 md:text-6xl leading-tight tracking-tight">
              Stop hunting for courts.
              <br />
              Start playing.
            </h1>

            {/* Primary CTA - Email Trial */}
            <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
              <button
                onClick={handleEmailTrialClick}
                className="w-full py-4 px-6 text-lg font-semibold rounded-lg bg-[#0c372b] text-white hover:bg-[#0a2e21] transition-colors"
              >
                Get 7 Free Days + Court Alerts
              </button>

              {/* Secondary CTA - Subscribe */}
              <Link
                href="/signup?plan=monthly"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => track("lp_subscribe_click", { location: "hero" })}
              >
                Or subscribe now — $8/mo
              </Link>
            </div>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-8 mb-4 md:text-xl leading-relaxed font-medium">
              Seattle hides unreserved courts overnight. We capture availability
              before it locks so you know where to play.
            </p>
            <p className="text-sm text-gray-500 font-medium">
              No credit card required • 2,500+ Seattle players use this every
              month
            </p>
          </section>

          {/* Savings Calculator */}
          <section className="py-8 md:py-10">
            <SavingsCalculator />
          </section>

          {/* The Problem */}
          <section className="py-8 md:py-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 md:text-3xl">
              The problem isn&apos;t availability—it&apos;s visibility.
            </h2>
            <p className="text-gray-600 font-medium max-w-2xl mx-auto">
              Once the reservation system locks overnight, unreserved courts
              disappear from view. You&apos;re left guessing which courts are
              actually open.
            </p>
          </section>

          {/* The Solution */}
          <section className="py-8 md:py-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 md:text-3xl">
              What you get
            </h2>

            <div className="space-y-4 max-w-md mx-auto text-left">
              {[
                "Unreserved courts across 100+ Seattle locations",
                "Updated daily before the system locks",
                "Filter by lights, pickleball lines & amenities",
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <svg
                    className="w-5 h-5 text-emerald-600 flex-shrink-0"
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
                  <p className="text-gray-600 font-medium">{item}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Testimonial */}
          <section className="py-8 md:py-10 text-center">
            <blockquote className="max-w-2xl mx-auto">
              <p className="text-xl text-gray-900 mb-3 md:text-2xl leading-relaxed font-medium">
                &quot;Used to waste 30 minutes driving between courts. Now I
                know exactly where to go.&quot;
              </p>
              <cite className="text-gray-500 font-medium">— Mike R., Capitol Hill</cite>
            </blockquote>
          </section>

          {/* CTA */}
          <section className="py-8 md:py-10">
            <div className="bg-emerald-600 rounded-2xl p-8 text-center shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-6 md:text-3xl">
                See which courts are open today
              </h2>
              <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
                <button
                  onClick={() => {
                    track("lp_email_trial_click", { location: "bottom_cta" });
                    setShowEmailModal(true);
                  }}
                  className="w-full py-4 px-8 text-xl font-semibold rounded-lg bg-white text-[#0c372b] hover:bg-gray-100 transition-colors shadow-lg"
                >
                  Get 7 Free Days + Court Alerts
                </button>
                <Link
                  href="/signup?plan=monthly"
                  className="text-sm font-medium text-emerald-100 hover:text-white transition-colors"
                  onClick={() => track("lp_subscribe_click", { location: "bottom_cta" })}
                >
                  Or subscribe now — $8/mo
                </Link>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-6 text-center">
            <p className="text-sm text-gray-600 font-medium">
              Have an account? <FooterSignInButton />
            </p>
          </footer>
        </main>
      </div>

      {/* Email Capture Modal */}
      <EmailCaptureModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSuccess={handleEmailSuccess}
      />
    </div>
  );
}
