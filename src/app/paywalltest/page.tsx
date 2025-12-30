/* -------------------------------------------------------------------------- *
   Client-side pay-wall screen
   • Dual CTA: Subscribe now OR Get 7 free days + email alerts
   • Emphasizes $24 savings vs paid court reservations
 * -------------------------------------------------------------------------- */

'use client';

import { useEffect, useState } from 'react';
import Link                     from 'next/link';
import { useRouter }            from 'next/navigation';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlanSelector }          from '@/components/PlanSelector';
import EmailCaptureModal         from '@/app/components/EmailCaptureModal';

import { shouldShowPaywall }     from '@/lib/shouldShowPaywall';
import { FEATURES,
         SOCIAL_PROOF }          from '@/lib/paywallCopy';
import { usePaywallAnalytics }   from '@/lib/usePaywallAnalytics';

type Plan = 'monthly' | 'annual';

export default function PaywallPage(): JSX.Element | null {
  const router = useRouter();

  /* ---------------- local state --------------------------------------- */
  const [canShow,        setCanShow]        = useState<boolean | null>(null);
  const [plan,           setPlan]           = useState<Plan>('monthly');
  const [gateDays,       setGateDays]       = useState<number>(0);
  const [showEmailModal, setShowEmailModal] = useState(false);

  /* ---------------- gate check ---------------------------------------- */
  useEffect(() => {
    let mounted = true;

    shouldShowPaywall()
      .then(v => mounted && setCanShow(v))
      .catch(() => mounted && setCanShow(false));

    return () => { mounted = false; };
  }, []);

  /* ---------------- read gateDays ------------------------------------- */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setGateDays(Number(localStorage.getItem('fss_gate') ?? '0'));
    }
  }, []);

  /* ---------------- analytics hook ------------------------------------ */
  const { markCTA } = usePaywallAnalytics(null, gateDays);

  /* ---------------- CTA handlers -------------------------------------- */
  const handleSubscribeClick = (selectedPlan: Plan) => {
    markCTA(selectedPlan);
  };

  const handleEmailTrialClick = () => {
    // Track this path
    if (typeof window !== 'undefined') {
      try {
        const event = {
          event: 'paywall_email_trial_click',
          timestamp: new Date().toISOString(),
        };
        console.log('Analytics:', event);
      } catch { /* ignore */ }
    }
    setShowEmailModal(true);
  };

  const handleEmailSuccess = (preferencesUrl: string) => {
    setShowEmailModal(false);
    router.push(preferencesUrl);
  };

  /* ---------------- guard --------------------------------------------- */
  if (canShow !== true) return null;

  /* ---------------- dynamic content ----------------------------------- */
  const getCtaText = () => {
    return plan === 'monthly'
      ? 'Subscribe – $4 First Month'
      : 'Subscribe – $64/year (Save 33%)';
  };

  /* ---------------- UI ------------------------------------------------ */
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md border border-gray-200 shadow-lg">
        <CardHeader className="space-y-2 text-center">
          {/* Savings-focused headline */}
          <CardTitle className="text-2xl font-bold">
            Stop paying $30 for court time
          </CardTitle>

          <CardDescription className="text-base text-gray-600">
            Seattle&apos;s public courts are <span className="font-semibold">free</span>.
            We show you which ones are open.
          </CardDescription>

          {/* Savings callout */}
          <div className="rounded-lg bg-green-50 border border-green-200 p-3">
            <p className="text-sm font-semibold text-green-800">
              Save $24+ every time you play
            </p>
            <p className="text-xs text-green-700 mt-1">
              vs. paying for a 90-minute reservation
            </p>
          </div>

          <p className="text-sm text-gray-500">{SOCIAL_PROOF}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* plan selector */}
          <PlanSelector
            selectedPlan={plan}
            onPlanSelect={setPlan}
            features={FEATURES}
          />

          {/* Dual CTAs */}
          <div className="space-y-3">
            {/* Primary CTA - Subscribe */}
            <Link
              href={`/signup?plan=${plan}&offer_id=fifty_percent_off_first_month`}
              onClick={() => handleSubscribeClick(plan)}
              aria-label={getCtaText()}
              className="block w-full rounded-md bg-[#0c372b] py-3 text-center text-lg font-semibold text-white transition-colors hover:bg-[#0c372b]/90 focus:outline-none focus:ring-2 focus:ring-[#0c372b] focus:ring-offset-2"
            >
              {getCtaText()}
            </Link>

            {/* Secondary CTA - Email Trial */}
            <button
              onClick={handleEmailTrialClick}
              className="block w-full rounded-md border-2 border-[#0c372b] bg-white py-3 text-center text-lg font-semibold text-[#0c372b] transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0c372b] focus:ring-offset-2"
            >
              Get 7 Free Days + Court Alerts
            </button>
          </div>

          <p className="text-xs text-center text-gray-500">
            Secure payment powered by Stripe. Cancel anytime.
          </p>

          {/* footer */}
          <div className="mt-4 space-y-2 text-center">
            <p className="text-sm text-gray-600">
              Already subscribed?{' '}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:underline"
              >
                Sign in here
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <a
                href="mailto:support@firstserveseattle.com"
                className="font-semibold text-blue-600 hover:underline"
                rel="noopener noreferrer"
              >
                Contact support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Capture Modal */}
      <EmailCaptureModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSuccess={handleEmailSuccess}
      />
    </div>
  );
}
