import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!accessToken) {
    return NextResponse.json({ error: 'No auth token' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No user' }, { status: 401 });
  }

  // Get subscriber data
  const { data: subscriber } = await supabase
    .from('subscribers')
    .select('*')
    .eq('email', user.email)
    .single();

  // Initialize both Stripe accounts
  const stripeOld = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
  });

  const stripeNew = process.env.STRIPE_SECRET_KEY_NEW 
    ? new Stripe(process.env.STRIPE_SECRET_KEY_NEW, {
        apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
      })
    : null;

  let oldAccountSub = null;
  let newAccountSub = null;
  let oldAccountCustomer = null;
  let newAccountCustomer = null;

  // Try to fetch subscription from both accounts
  if (subscriber?.stripe_subscription_id) {
    try {
      oldAccountSub = await stripeOld.subscriptions.retrieve(subscriber.stripe_subscription_id);
      oldAccountCustomer = await stripeOld.customers.retrieve(oldAccountSub.customer as string);
    } catch {
      console.log('Subscription not in OLD account');
    }

    if (stripeNew) {
      try {
        newAccountSub = await stripeNew.subscriptions.retrieve(subscriber.stripe_subscription_id);
        newAccountCustomer = await stripeNew.customers.retrieve(newAccountSub.customer as string);
      } catch {
        console.log('Subscription not in NEW account');
      }
    }
  }

  return NextResponse.json({
    user: {
      email: user.email,
      id: user.id
    },
    subscriber: {
      stripe_customer_id: subscriber?.stripe_customer_id,
      stripe_subscription_id: subscriber?.stripe_subscription_id,
      stripe_account: subscriber?.stripe_account,
      status: subscriber?.status,
      plan: subscriber?.plan
    },
    stripe: {
      USE_NEW_STRIPE_ACCOUNT: process.env.USE_NEW_STRIPE_ACCOUNT,
      hasNewKey: !!process.env.STRIPE_SECRET_KEY_NEW,
      oldAccount: {
        hasSubscription: !!oldAccountSub,
        subscriptionStatus: oldAccountSub?.status,
        customerId: oldAccountCustomer?.id,
        customerEmail: oldAccountCustomer?.email
      },
      newAccount: {
        hasSubscription: !!newAccountSub,
        subscriptionStatus: newAccountSub?.status,
        customerId: newAccountCustomer?.id,
        customerEmail: newAccountCustomer?.email
      }
    }
  });
}