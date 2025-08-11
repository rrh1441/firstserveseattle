/* src/lib/createBillingPortal.ts
 * Server-only Stripe helper to create a billing-portal session.
 */
'use server';

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize both Stripe accounts
const stripeOld = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
});

const stripeNew = process.env.STRIPE_SECRET_KEY_NEW 
  ? new Stripe(process.env.STRIPE_SECRET_KEY_NEW, {
      apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
    })
  : stripeOld; // Fallback to old if new key not configured

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

  // Fetch stripe_customer_id and account info from your subscribers table
  const { data, error } = await supabase
    .from('subscribers')
    .select('stripe_customer_id, stripe_account')
    .eq('email', user.email)
    .single();

  if (error || !data?.stripe_customer_id) throw new Error('No Stripe customer');

  // Debug logging
  console.log('[BILLING PORTAL DEBUG]', {
    customerEmail: user.email,
    stripeCustomerId: data.stripe_customer_id,
    stripeAccount: data.stripe_account,
    USE_NEW_STRIPE_ACCOUNT: process.env.USE_NEW_STRIPE_ACCOUNT,
    hasNewKey: !!process.env.STRIPE_SECRET_KEY_NEW
  });

  // Check which Stripe account the customer belongs to
  // First try the new account (if they have stripe_account field set)
  const isNewAccount = data.stripe_account === 'new' || 
                       process.env.USE_NEW_STRIPE_ACCOUNT?.toLowerCase() === 'true';
  
  let session;
  
  try {
    if (isNewAccount && stripeNew) {
      // Try new Stripe account first
      console.log('[BILLING PORTAL] Attempting NEW Stripe account');
      session = await stripeNew.billingPortal.sessions.create({
        customer: data.stripe_customer_id,
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/members`,
      });
      console.log('[BILLING PORTAL] SUCCESS with NEW account');
    } else {
      // Use old Stripe account
      console.log('[BILLING PORTAL] Attempting OLD Stripe account');
      session = await stripeOld.billingPortal.sessions.create({
        customer: data.stripe_customer_id,
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/members`,
      });
      console.log('[BILLING PORTAL] SUCCESS with OLD account');
    }
  } catch (err: any) {
    // If customer not found in primary account, try the other one
    console.log('Customer not found in primary Stripe account, trying alternate...');
    
    try {
      if (isNewAccount) {
        // Was new, try old
        session = await stripeOld.billingPortal.sessions.create({
          customer: data.stripe_customer_id,
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/members`,
        });
      } else if (stripeNew) {
        // Was old, try new
        session = await stripeNew.billingPortal.sessions.create({
          customer: data.stripe_customer_id,
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/members`,
        });
      } else {
        throw err; // Re-throw if we can't try alternate
      }
    } catch (finalErr) {
      console.error('Customer not found in either Stripe account');
      throw new Error('Customer not found in payment system');
    }
  }

  return session.url;
} 