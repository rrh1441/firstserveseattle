/* src/app/billing/page.tsx
 * When visited, redirects the user to Stripe's billing portal.
 * Works with both email/password and social auth (Google, Apple).
 */
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic'; // never cache

// Initialize both Stripe accounts
const stripeOld = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
});

const stripeNew = process.env.STRIPE_SECRET_KEY_NEW
  ? new Stripe(process.env.STRIPE_SECRET_KEY_NEW, {
      apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
    })
  : stripeOld;

export default async function BillingRedirectPage() {
  const supabase = createServerComponentClient({ cookies });

  // Get the authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('[billing] No authenticated user:', authError);
    redirect('/?error=not_authenticated');
  }

  // Get the subscriber's Stripe customer ID
  const { data: subscriber, error: subError } = await supabase
    .from('subscribers')
    .select('stripe_customer_id, stripe_account')
    .eq('user_id', user.id)
    .single();

  if (subError || !subscriber?.stripe_customer_id) {
    console.error('[billing] No Stripe customer found:', subError);
    redirect('/?error=no_subscription');
  }

  // Determine which Stripe account to use
  const isNewAccount =
    subscriber.stripe_account === 'new' ||
    process.env.USE_NEW_STRIPE_ACCOUNT?.toLowerCase() === 'true';

  let portalUrl: string | null = null;

  try {
    // Try primary account first
    const stripe = isNewAccount ? stripeNew : stripeOld;
    const session = await stripe.billingPortal.sessions.create({
      customer: subscriber.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.firstserveseattle.com'}/`,
    });
    portalUrl = session.url;
  } catch {
    console.log('[billing] Primary account failed, trying alternate...');

    try {
      // Try alternate account
      const altStripe = isNewAccount ? stripeOld : stripeNew;
      const session = await altStripe.billingPortal.sessions.create({
        customer: subscriber.stripe_customer_id,
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.firstserveseattle.com'}/`,
      });
      portalUrl = session.url;
    } catch (altErr) {
      console.error('[billing] Both Stripe accounts failed:', altErr);
    }
  }

  if (portalUrl) {
    redirect(portalUrl);
  } else {
    redirect('/?error=billing_unavailable');
  }
}
