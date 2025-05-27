/* -------------------------------------------------------------------------- *
   Client-side pay-wall screen
   • Unique-day gate already decided; simply renders.
   • No unused eslint directives.
 * -------------------------------------------------------------------------- */

'use client';

import { useEffect, useState } from 'react';
import Link                     from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlanSelector }          from '@/components/PlanSelector';

import { shouldShowPaywall }     from '@/lib/shouldShowPaywall';
import { HERO_HEADLINES,
         FEATURES,
         SOCIAL_PROOF }          from '@/lib/paywallCopy';
import { usePaywallAnalytics }   from '@/lib/usePaywallAnalytics';

type Plan = 'monthly' | 'annual';

export default function PaywallPage(): JSX.Element | null {
  /* ---------------- local state --------------------------------------- */
  const [canShow,   setCanShow]   = useState<boolean | null>(null);
  const [plan,      setPlan]      = useState<Plan>('monthly');
  const [headline,  setHeadline]  = useState<{ group: string; text: string }>();
  const [gateDays,  setGateDays]  = useState<number>(0);

  /* ---------------- gate check ---------------------------------------- */
  useEffect(() => {
    let mounted = true;

    shouldShowPaywall()
      .then(v => mounted && setCanShow(v))
      .catch(() => mounted && setCanShow(false));

    return () => { mounted = false; };
  }, []);

  /* ---------------- sticky A/B headline ------------------------------- */
  useEffect(() => {
    if (!canShow) return;
    const idx     = Math.random() < 0.5 ? 0 : 1;
    const chosen  = HERO_HEADLINES[idx];
    setHeadline(chosen);
    if (typeof window !== 'undefined') {
      localStorage.setItem('abGroup', chosen.group);
    }
  }, [canShow]);

  /* ---------------- read gateDays ------------------------------------- */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setGateDays(Number(localStorage.getItem('fss_gate') ?? '0'));
    }
  }, []);

  /* ---------------- analytics hook ------------------------------------ */
  const { markCTA } = usePaywallAnalytics(headline?.group ?? null, gateDays);

  /* ---------------- guard --------------------------------------------- */
  if (canShow !== true) return null;

  /* ---------------- UI ------------------------------------------------ */
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md border border-gray-200 shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">
            {headline?.text ?? "You've reached your free limit"}
          </CardTitle>

          <CardDescription className="text-base text-gray-600">
            Start your <span className="font-semibold">14-day free trial</span>{' '}
            — no card required.
          </CardDescription>

          <p className="text-sm text-gray-500">{SOCIAL_PROOF}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* plan selector */}
          <PlanSelector
            selectedPlan={plan}
            onPlanSelect={setPlan}
            features={FEATURES}
          />

          {/* CTA */}
          <Link
            href={`/signup?plan=${plan}&headline_group=${headline?.group ?? ''}`}
            onClick={() => markCTA(plan)}
            aria-label={
              plan === 'monthly'
                ? 'Start free trial – Monthly'
                : 'Start free trial – Annual'
            }
            className="block w-full rounded-md bg-[#0c372b] py-3 text-center text-lg font-semibold text-white transition-colors hover:bg-[#0c372b]/90 focus:outline-none focus:ring-2 focus:ring-[#0c372b] focus:ring-offset-2"
          >
            {plan === 'monthly'
              ? 'Start Free Trial – Monthly'
              : 'Start Free Trial – Annual'}
          </Link>

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
    </div>
  );
}
