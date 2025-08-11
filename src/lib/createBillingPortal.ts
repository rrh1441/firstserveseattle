/* src/lib/createBillingPortal.ts
 * Server-only Stripe helper to create a billing-portal session.
 */
'use server';

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Determine which Stripe account to use based on environment variable
const useNewStripeAccount = process.env.USE_NEW_STRIPE_ACCOUNT?.toLowerCase() === 'true';
const stripeKey = useNewStripeAccount 
  ? (process.env.STRIPE_SECRET_KEY_NEW || process.env.STRIPE_SECRET_KEY!)
  : process.env.STRIPE_SECRET_KEY!;

const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
});

/**
 * Returns a one-time billing-portal URL for the current logged-in user.
 * Throws 401 if not signed in or customer not linked.
 */
export async function createBillingPortal(
  supabaseAccessToken: string | undefined,
): Promise<string> {
  if (!supabaseAccessToken) throw new Error('401');

  // Server-side Supabase client with service role
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${supabaseAccessToken}` } } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('401');

  // Fetch stripe_customer_id from your subscribers table
  const { data, error } = await supabase
    .from('subscribers')
    .select('stripe_customer_id')
    .eq('email', user.email)
    .single();

  if (error || !data?.stripe_customer_id) throw new Error('No Stripe customer');

  const session = await stripe.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/members`, // redirect back to members area
  });

  return session.url;
} 