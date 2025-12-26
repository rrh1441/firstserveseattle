/* app/api/stripe-webhook-new/route.ts
 *
 * Webhook handler for NEW Stripe account (First Serve Seattle)
 * Handles all live-mode Stripe webhooks and mirrors them into the `subscribers`
 * table. Fully strict-mode compliant: noImplicitAny, strictNullChecks, etc.
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { GmailEmailService as EmailService } from '@/lib/gmail/email-service';

export const dynamic = 'force-dynamic'; // disables edge caching for this route

// ──────────────────────────────────────────────────────────────────────────
//  1. Library / client setup - NEW ACCOUNT
// ──────────────────────────────────────────────────────────────────────────
// Use fallback to old key if new key not configured yet
const stripeKey = process.env.STRIPE_SECRET_KEY_NEW || process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
});

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// NEW account price IDs (fallback to old if not configured)
const MONTHLY_ID = process.env.STRIPE_MONTHLY_PRICE_ID_NEW || 'price_1Qbm96KSaqiJUYkj7SWySbjU';
const ANNUAL_ID  = process.env.STRIPE_ANNUAL_PRICE_ID_NEW || 'price_1QowMRKSaqiJUYkjgeqLADm4';

// ──────────────────────────────────────────────────────────────────────────
//  2. Helper utilities
// ──────────────────────────────────────────────────────────────────────────
/** True if a customer currently has any default payment method. */
function cardOnFile(cust: Stripe.Customer): boolean {
  return Boolean(
    cust.invoice_settings?.default_payment_method || cust.default_source,
  );
}

/** Upsert row - update by email first, then by stripe_customer_id */
async function upsertSubscriber(fields: {
  stripeCustomerId:     string;
  stripeSubscriptionId?:string;
  email?:               string;
  plan?:                string;
  status?:              Stripe.Subscription.Status | 'expired';
  hasCard?:             boolean;
  trialEnd?:            number | null;
}) {
  console.log('🔄 [NEW ACCOUNT] upsertSubscriber called with:', fields);

  const {
    stripeCustomerId,
    stripeSubscriptionId,
    email,
    plan,
    status,
    hasCard,
    trialEnd,
  } = fields;

  // Build update data, filtering out undefined values
  interface UpdateData {
    stripe_customer_id: string;
    stripe_account: string;
    updated_at: string;
    stripe_subscription_id?: string;
    email?: string;
    plan?: string;
    status?: Stripe.Subscription.Status | 'expired';
    has_card?: boolean;
    trial_end?: number | null;
  }
  
  const updateData: UpdateData = {
    stripe_customer_id:     stripeCustomerId,
    stripe_account:          'new', // Mark as new account
    updated_at:              new Date().toISOString(),
  };
  
  // Only add fields that are defined to ensure they get updated
  if (stripeSubscriptionId !== undefined) updateData.stripe_subscription_id = stripeSubscriptionId;
  if (email !== undefined) updateData.email = email;
  if (plan !== undefined) updateData.plan = plan;
  if (status !== undefined) updateData.status = status;
  if (hasCard !== undefined) updateData.has_card = hasCard;
  if (trialEnd !== undefined) updateData.trial_end = trialEnd;

  console.log('📝 [NEW ACCOUNT] updateData:', updateData);

  // Try to update by email first (from signup)
  if (email) {
    console.log('🔍 [NEW ACCOUNT] Looking for existing record by email:', email);
    const { data: existingByEmail, error: emailError } = await supa
      .from('subscribers')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    console.log('📋 [NEW ACCOUNT] Email lookup result:', { existingByEmail, emailError });

    if (existingByEmail && !emailError) {
      console.log('✅ [NEW ACCOUNT] Found existing record, updating by email');
      const { error: updateError } = await supa
        .from('subscribers')
        .update(updateData)
        .eq('email', email);
      
      if (updateError) {
        console.error('❌ [NEW ACCOUNT] Supabase update by email error:', updateError);
      } else {
        console.log('✅ [NEW ACCOUNT] Successfully updated by email');
      }
      return;
    } else {
      console.log('❌ [NEW ACCOUNT] No existing record found by email, falling back to stripe_customer_id upsert');
    }
  }

  // Fallback to upsert by stripe_customer_id
  console.log('🔄 [NEW ACCOUNT] Upserting by stripe_customer_id:', stripeCustomerId);
  const { error } = await supa
    .from('subscribers')
    .upsert(updateData, { onConflict: 'stripe_customer_id' });

  if (error) {
    console.error('❌ [NEW ACCOUNT] Supabase upsert error:', error);
  } else {
    console.log('✅ [NEW ACCOUNT] Successfully upserted by stripe_customer_id');
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
  console.log('🔔 [NEW ACCOUNT] Webhook received!');
  
  /* 3-a  Verify webhook signature */
  const rawBody = Buffer.from(await req.arrayBuffer());
  const sig     = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_NEW || process.env.STRIPE_WEBHOOK_SECRET || '';
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      webhookSecret,
    );
    console.log('✅ [NEW ACCOUNT] Webhook signature verified. Event type:', event.type);
  } catch (err) {
    console.warn('❌ [NEW ACCOUNT] Signature verification failed:', err);
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
        
        // Skip if this is not a subscription checkout (could be one-time payment)
        if (!subId) {
          console.log('Skipping non-subscription checkout');
          return NextResponse.json({ received: true });
        }
        
        const customer = (await stripe.customers.retrieve(
          custId,
        )) as Stripe.Customer;

        // Get the actual subscription to get details
        const subscription = await stripe.subscriptions.retrieve(subId);
        
        // Check if this is actually a First Serve Seattle subscription
        const priceId = subscription.items.data[0]?.price.id ?? '';
        const validPriceIds = [MONTHLY_ID, ANNUAL_ID];
        
        if (!validPriceIds.includes(priceId)) {
          console.log(`Skipping non-FSS subscription with price ID: ${priceId}`);
          return NextResponse.json({ received: true });
        }

        const customerEmail = customer.email ?? session.customer_details?.email ?? '';
        const plan = planFromPrice(subscription.items.data[0]?.price.id ?? '');

        console.log(`🆕 [NEW WEBHOOK] Checkout completed - Creating subscription:`, {
          subscriptionId: subId,
          customerId: custId,
          email: customerEmail,
          plan: plan,
          status: subscription.status
        });

        await upsertSubscriber({
          stripeCustomerId: custId,
          stripeSubscriptionId: subId,
          email:   customerEmail,
          plan:    plan,
          status:  subscription.status,
          hasCard: true,
          trialEnd: subscription.trial_end ?? null,
        });
        
        console.log(`✅ [NEW WEBHOOK] Subscription created in database`);

        // Send welcome email for new subscriptions
        if (customerEmail && (plan === 'monthly' || plan === 'annual')) {
          console.log('📧 [NEW ACCOUNT] Sending welcome email to:', customerEmail);
          await EmailService.sendWelcomeEmail(customerEmail, plan);
        }
        break;
      }

      // ────────────────── subscription updated ───────────────────────────
      case 'customer.subscription.updated': {
        const sub      = event.data.object as Stripe.Subscription;
        const custId   = sub.customer as string;
        
        console.log(`🔄 [NEW WEBHOOK] Subscription updated:`, {
          subscriptionId: sub.id,
          customerId: custId,
          status: sub.status,
          priceId: sub.items.data[0]?.price.id
        });
        
        // Check if this is a First Serve Seattle subscription
        const priceId = sub.items.data[0]?.price.id ?? '';
        const validPriceIds = [MONTHLY_ID, ANNUAL_ID];
        
        // Log the price check for debugging
        console.log(`📊 [NEW WEBHOOK] Price check:`, {
          receivedPriceId: priceId,
          expectedMonthly: MONTHLY_ID,
          expectedAnnual: ANNUAL_ID,
          isValid: validPriceIds.includes(priceId)
        });
        
        if (!validPriceIds.includes(priceId)) {
          console.log(`⚠️ [NEW WEBHOOK] Price ID ${priceId} not in valid list, but processing anyway for now`);
          // Temporarily commenting out the skip to allow ALL subscriptions through
          // TODO: Update STRIPE_MONTHLY_PRICE_ID_NEW and STRIPE_ANNUAL_PRICE_ID_NEW in environment
          // return NextResponse.json({ received: true });
        }
        
        const customer = (await stripe.customers.retrieve(
          custId,
        )) as Stripe.Customer;

        console.log(`📝 [NEW WEBHOOK] Upserting subscriber:`, {
          email: customer.email,
          subscriptionId: sub.id,
          customerId: custId,
          status: sub.status
        });

        await upsertSubscriber({
          stripeCustomerId: custId,
          stripeSubscriptionId: sub.id,
          email:   customer.email ?? '',
          plan:    planFromPrice(sub.items.data[0]?.price.id ?? ''),
          status:  sub.status,
          hasCard: cardOnFile(customer),
          trialEnd: sub.trial_end ?? null,
        });
        
        console.log(`✅ [NEW WEBHOOK] Subscriber updated successfully`);
        break;
      }

      // ──────────────── subscription *deleted* ──────────────
      case 'customer.subscription.deleted': {
        const sub    = event.data.object as Stripe.Subscription;
        
        // Check if this is a First Serve Seattle subscription
        const priceId = sub.items?.data[0]?.price.id ?? '';
        const validPriceIds = [MONTHLY_ID, ANNUAL_ID];
        
        if (!validPriceIds.includes(priceId)) {
          console.log(`Skipping non-FSS subscription deletion with price ID: ${priceId}`);
          return NextResponse.json({ received: true });
        }
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
          console.log('📧 [NEW ACCOUNT] Sending cancellation email to:', customerEmail);
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

        await upsertSubscriber({
          stripeCustomerId:     custId,
          stripeSubscriptionId: subId ?? undefined,
          email:                customerEmail,
          status:               inv.status as Stripe.Subscription.Status,
        });

        // Send payment success email (skip for first payment as welcome email handles it)
        if (customerEmail && inv.billing_reason === 'subscription_cycle' && inv.amount_paid > 0) {
          const subscription = subId ? await stripe.subscriptions.retrieve(subId) : null;
          const plan = subscription ? planFromPrice(subscription.items.data[0]?.price.id ?? '') : 'unknown';
          console.log('📧 [NEW ACCOUNT] Sending payment success email to:', customerEmail);
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

        await upsertSubscriber({
          stripeCustomerId:     custId,
          stripeSubscriptionId: subId ?? undefined,
          email:                customerEmail,
          status:               inv.status as Stripe.Subscription.Status,
        });

        // Send payment failed email
        if (customerEmail) {
          console.log('📧 [NEW ACCOUNT] Sending payment failed email to:', customerEmail);
          await EmailService.sendPaymentFailedEmail(customerEmail);
        }
        break;
      }

      default:
        console.log(`ℹ️ [NEW ACCOUNT] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[NEW ACCOUNT] Webhook handler error:', err);
    return NextResponse.json({ error: 'handler-failed' }, { status: 500 });
  }
}