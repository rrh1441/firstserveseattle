/* eslint-disable no-console */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';          // ensure edge caching is off

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
});

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const MONTHLY_ID = 'price_1Qbm96KSaqiJUYkj7SWySbjU';
const ANNUAL_ID  = 'price_1QowMRKSaqiJUYkjgeqLADm4';

/** Helper to detect whether a customer has *any* default payment method */
function cardOnFile(cust: Stripe.Customer | Stripe.CustomerRetrieveParams): boolean {
  return Boolean(
    cust.invoice_settings?.default_payment_method ||
    (cust as Stripe.Customer).default_source,
  );
}

/** Upsert shortcut that always uses customer id as the conflict key */
async function upsertSubscriber(
  fields: Partial<{
    email: string;
    plan: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    status: Stripe.Subscription.Status;
    hasCard: boolean;
    trialEnd: number | null;
  }>,
) {
  const { error } = await supa
    .from('subscribers')
    .upsert(
      {
        email:                 fields.email,
        plan:                  fields.plan,
        stripe_customer_id:    fields.stripeCustomerId,
        stripe_subscription_id:fields.stripeSubscriptionId,
        status:                fields.status,
        has_card:              fields.hasCard,
        trial_end:             fields.trialEnd ? new Date(fields.trialEnd * 1e3).toISOString() : null,
        updated_at:            new Date().toISOString(),
      },
      { onConflict: 'stripe_customer_id' },
    );
  if (error) console.error('Supabase upsert error:', error);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.arrayBuffer();                   // <-- no UTF-8 conversion
  const sig     = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.warn('Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    /* ───────────────────────────────────────── checkout.session.completed */
    if (event.type === 'checkout.session.completed') {
      const session  = event.data.object as Stripe.Checkout.Session;
      const subId    = session.subscription as string | null;
      const custId   = session.customer as string | null;
      const customer = custId
        ? (await stripe.customers.retrieve(custId)) as Stripe.Customer
        : null;

      const priceId = session.metadata?.plan_id ?? '';
      const plan =
        priceId === MONTHLY_ID ? 'monthly'
        : priceId === ANNUAL_ID ? 'annual'
        : 'unknown';

      await upsertSubscriber({
        email:               customer?.email ?? session.customer_details?.email ?? '',
        plan,
        stripeCustomerId:    custId ?? '',
        stripeSubscriptionId:subId ?? '',
        status:              'trialing',
        hasCard:             cardOnFile(customer ?? {}),
        trialEnd:            session.expires_at ?? null,
      });
    }

    /* ─────────────────────────────────────── customer.subscription.updated */
    if (event.type === 'customer.subscription.updated') {
      const sub      = event.data.object as Stripe.Subscription;
      const custId   = sub.customer as string;
      const customer = (await stripe.customers.retrieve(custId)) as Stripe.Customer;

      const priceId  = sub.items.data[0]?.price.id ?? '';
      const plan =
        priceId === MONTHLY_ID ? 'monthly'
        : priceId === ANNUAL_ID ? 'annual'
        : 'unknown';

      await upsertSubscriber({
        email:               customer.email ?? '',
        plan,
        stripeCustomerId:    custId,
        stripeSubscriptionId:sub.id,
        status:              sub.status,
        hasCard:             cardOnFile(customer),
        trialEnd:            sub.trial_end ?? null,
      });
    }

    /* ───────────────────────────────────────── payment_method.attached  */
    if (event.type === 'payment_method.attached') {
      const pm     = event.data.object as Stripe.PaymentMethod;
      const custId = pm.customer as string;
      await upsertSubscriber({
        stripeCustomerId: custId,
        hasCard:          true,
      });
    }

    /* ──────────────────────────────────── customer.updated (default PM) */
    if (event.type === 'customer.updated') {
      const cust = event.data.object as Stripe.Customer;
      await upsertSubscriber({
        email:            cust.email ?? '',
        stripeCustomerId: cust.id,
        hasCard:          cardOnFile(cust),
      });
    }

    /* ───────────────────────── invoice.payment_succeeded / …_failed */
    if (
      event.type === 'invoice.payment_succeeded' ||
      event.type === 'invoice.payment_failed'
    ) {
      const invoice = event.data.object as Stripe.Invoice;
      const subId   = invoice.subscription as string;
      const custId  = invoice.customer as string;

      await upsertSubscriber({
        stripeCustomerId:    custId,
        stripeSubscriptionId:subId,
        status:              invoice.status as Stripe.Subscription.Status,
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }
}
