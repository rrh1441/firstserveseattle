/* app/api/stripe-webhook/route.ts
 *
 * Webhook handler for ORIGINAL Stripe account.
 * Handles all live-mode Stripe web-hooks and mirrors them into the `subscribers`
 * table. Fully strict-mode compliant: noImplicitAny, strictNullChecks, etc.
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { GmailEmailService as EmailService } from '@/lib/gmail/email-service';
import { requireEnv, redactEmail, cardOnFile } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic'; // disables edge caching for this route

// ──────────────────────────────────────────────────────────────────────────
//  1. Library / client setup
// ──────────────────────────────────────────────────────────────────────────

const stripeKey = requireEnv('STRIPE_SECRET_KEY');
const webhookSecret = requireEnv('STRIPE_WEBHOOK_SECRET');

const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
});

// Price IDs for original Stripe account
const MONTHLY_ID = 'price_1Qbm96KSaqiJUYkj7SWySbjU';
const ANNUAL_ID = 'price_1QowMRKSaqiJUYkjgeqLADm4';

// ──────────────────────────────────────────────────────────────────────────
//  2. Helper utilities
// ──────────────────────────────────────────────────────────────────────────
/** Upsert row - update by user_id first, then email, then stripe_customer_id */
async function upsertSubscriber(fields: {
  stripeCustomerId:     string;
  stripeSubscriptionId?:string;
  userId?:              string;
  email?:               string;
  plan?:                string;
  status?:              Stripe.Subscription.Status | 'expired';
  hasCard?:             boolean;
  trialEnd?:            number | null;
}) {
  console.log('🔄 upsertSubscriber called:', {
    stripeCustomerId: fields.stripeCustomerId,
    hasEmail: !!fields.email,
    plan: fields.plan,
    status: fields.status,
  });

  const {
    stripeCustomerId,
    stripeSubscriptionId,
    userId,
    email,
    plan,
    status,
    hasCard,
    trialEnd,
  } = fields;

  const updateData: Record<string, unknown> = {
    stripe_customer_id:     stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    email,
    plan,
    status,
    has_card:               hasCard,
    trial_end:              trialEnd,
    updated_at:             new Date().toISOString(),
  };

  // Include user_id in update if provided
  if (userId) {
    updateData.user_id = userId;
  }

  console.log('📝 updateData: customerId=%s, plan=%s, status=%s', stripeCustomerId, plan, status);

  // Try to update by user_id first (most reliable)
  if (userId) {
    console.log('🔍 Looking for existing record by user_id:', userId);
    const { data: existingByUserId, error: userIdError } = await supabaseAdmin
      .from('subscribers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingByUserId && !userIdError) {
      console.log('✅ Found existing record, updating by user_id');
      const { error: updateError } = await supabaseAdmin
        .from('subscribers')
        .update(updateData)
        .eq('user_id', userId);

      if (updateError) {
        console.error('❌ Supabase update by user_id error:', updateError);
      } else {
        console.log('✅ Successfully updated by user_id');
      }
      return;
    }
  }

  // Try to update by email second
  if (email) {
    console.log('🔍 Looking for existing record by email:', redactEmail(email));
    const { data: existingByEmail, error: emailError } = await supabaseAdmin
      .from('subscribers')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    console.log('📋 Email lookup result: found=%s, error=%s', !!existingByEmail, !!emailError);

    if (existingByEmail && !emailError) {
      console.log('✅ Found existing record, updating by email');
      const { error: updateError } = await supabaseAdmin
        .from('subscribers')
        .update(updateData)
        .eq('email', email);

      if (updateError) {
        console.error('❌ Supabase update by email error:', updateError);
      } else {
        console.log('✅ Successfully updated by email');
      }
      return;
    } else {
      console.log('❌ No existing record found by email, falling back to stripe_customer_id upsert');
    }
  }

  // Fallback to upsert by stripe_customer_id
  console.log('🔄 Upserting by stripe_customer_id:', stripeCustomerId);
  const { error } = await supabaseAdmin
    .from('subscribers')
    .upsert(updateData, { onConflict: 'stripe_customer_id' });

  if (error) {
    console.error('❌ Supabase upsert error:', error);
  } else {
    console.log('✅ Successfully upserted by stripe_customer_id');
  }
}

/** Map Stripe price → internal plan enum. */
function planFromPrice(priceId: string): string {
  if (priceId === MONTHLY_ID) return 'monthly';
  if (priceId === ANNUAL_ID)  return 'annual';
  return 'unknown';
}

// ──────────────────────────────────────────────────────────────────────────
//  3. Route handler
// ──────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  console.log('🔔 Webhook received on OLD endpoint!');
  console.log('Using original Stripe account for existing customers');
  
  /* 3-a  Verify webhook signature */
  const rawBody = Buffer.from(await req.arrayBuffer());
  const sig     = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      webhookSecret,
    );
    console.log('✅ Webhook signature verified. Event type:', event.type);
  } catch {
    console.warn('❌ Webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  /* 3-b  Dispatch by event type */
  try {
    switch (event.type) {
      // ────────────────────── checkout complete ──────────────────────────
      case 'checkout.session.completed': {
        const session  = event.data.object as Stripe.Checkout.Session;
        const custId   = session.customer as string;
        const subId    = session.subscription as string;
        const customer = (await stripe.customers.retrieve(
          custId,
        )) as Stripe.Customer;

        // Get the actual subscription to get the trial_end
        const subscription = await stripe.subscriptions.retrieve(subId);

        const customerEmail = customer.email ?? session.customer_details?.email ?? '';
        const plan = planFromPrice(session.metadata?.plan ?? '');
        const userId = session.metadata?.userId || session.client_reference_id || undefined;

        await upsertSubscriber({
          stripeCustomerId: custId,
          stripeSubscriptionId: subId,
          userId:  userId,
          email:   customerEmail,
          plan:    plan,
          status:  'trialing',
          hasCard: true,
          trialEnd: subscription.trial_end ?? null,
        });

        // Send welcome email for new subscriptions
        if (customerEmail && (plan === 'monthly' || plan === 'annual')) {
          await EmailService.sendWelcomeEmail(customerEmail, plan);
        }
        break;
      }

      // ────────────────── subscription updated ───────────────────────────
      case 'customer.subscription.updated': {
        const sub      = event.data.object as Stripe.Subscription;
        const custId   = sub.customer as string;
        const customer = (await stripe.customers.retrieve(
          custId,
        )) as Stripe.Customer;

        await upsertSubscriber({
          stripeCustomerId: custId,
          stripeSubscriptionId: sub.id,
          email:   customer.email ?? '',
          plan:    planFromPrice(sub.items.data[0]?.price.id ?? ''),
          status:  sub.status,
          hasCard: cardOnFile(customer),
          trialEnd: sub.trial_end ?? null,
        });
        break;
      }

      // ──────────────── subscription *deleted* (new branch) ──────────────
      case 'customer.subscription.deleted': {
        const sub    = event.data.object as Stripe.Subscription;
        const custId = sub.customer as string;
        
        // Get customer email for cancellation notification
        const customer = (await stripe.customers.retrieve(custId)) as Stripe.Customer;
        const customerEmail = customer.email ?? '';

        await upsertSubscriber({
          stripeCustomerId:     custId,
          stripeSubscriptionId: sub.id,
          status:               'canceled',
          hasCard:              false,
          trialEnd:             sub.trial_end ?? null,
        });

        // Send cancellation email
        if (customerEmail) {
          await EmailService.sendCancellationEmail(customerEmail);
        }
        break;
      }

      // ─────────────── payment method now attached ───────────────────────
      case 'payment_method.attached': {
        const pm     = event.data.object as Stripe.PaymentMethod;
        const custId = pm.customer as string;

        // Get customer details since payment_method doesn't include email
        const customer = (await stripe.customers.retrieve(custId)) as Stripe.Customer;

        await upsertSubscriber({
          stripeCustomerId: custId,
          email:            customer.email ?? '',
          hasCard:          true,
        });
        break;
      }

      // ─────────────── default PM / e-mail changes ───────────────────────
      case 'customer.updated': {
        const cust = event.data.object as Stripe.Customer;

        await upsertSubscriber({
          stripeCustomerId: cust.id,
          email:            cust.email ?? '',
          hasCard:          cardOnFile(cust),
        });
        break;
      }

      // ─────────── invoice paid or failed updates status ─────────────────
      case 'invoice.payment_succeeded': {
        const inv    = event.data.object as Stripe.Invoice;
        const custId = inv.customer as string;
        const subId  = inv.subscription as string | null;

        // Get customer details since invoice doesn't include email
        const customer = (await stripe.customers.retrieve(custId)) as Stripe.Customer;
        const customerEmail = customer.email ?? '';

        // Get subscription status (not invoice status!) to update the subscriber
        const subscriptionStatus = subId
          ? (await stripe.subscriptions.retrieve(subId)).status
          : undefined;

        await upsertSubscriber({
          stripeCustomerId:     custId,
          stripeSubscriptionId: subId ?? undefined,
          email:                customerEmail,
          status:               subscriptionStatus,
        });

        // Send payment success email (skip for first payment as welcome email handles it)
        if (customerEmail && inv.billing_reason === 'subscription_cycle' && inv.amount_paid > 0) {
          const subscription = subId ? await stripe.subscriptions.retrieve(subId) : null;
          const plan = subscription ? planFromPrice(subscription.items.data[0]?.price.id ?? '') : 'unknown';
          await EmailService.sendPaymentSuccessEmail(customerEmail, inv.amount_paid, plan);
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const inv    = event.data.object as Stripe.Invoice;
        const custId = inv.customer as string;
        const subId  = inv.subscription as string | null;

        // Get customer details since invoice doesn't include email
        const customer = (await stripe.customers.retrieve(custId)) as Stripe.Customer;
        const customerEmail = customer.email ?? '';

        // Get subscription status (not invoice status!) to update the subscriber
        const subscriptionStatus = subId
          ? (await stripe.subscriptions.retrieve(subId)).status
          : undefined;

        await upsertSubscriber({
          stripeCustomerId:     custId,
          stripeSubscriptionId: subId ?? undefined,
          email:                customerEmail,
          status:               subscriptionStatus,
        });

        // Send payment failed email
        if (customerEmail) {
          await EmailService.sendPaymentFailedEmail(customerEmail);
        }
        break;
      }

      default:
        // No DB action required
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'handler-failed' }, { status: 500 });
  }
}
