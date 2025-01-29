import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Required for Next.js to avoid automatically parsing the body
export const config = {
  api: {
    bodyParser: false,
  },
  runtime: 'edge',
};

export async function POST(request: NextRequest) {
  let event: Stripe.Event;

  // 1. Read raw body + signature
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    console.error("❌ Missing Stripe signature header");
    return new NextResponse("Missing Stripe signature header.", { status: 400 });
  }

  // 2. Initialize Stripe client
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
  });

  // 3. Verify the webhook signature
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return new NextResponse("Invalid Stripe signature.", { status: 400 });
  }

  // 4. Initialize Supabase Admin
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

  // Helper function to upsert subscription rows
  async function upsertSubscription(args: {
    email: string;
    plan: string;
    subscriptionId?: string | null;
  }) {
    const { email, plan, subscriptionId } = args;
    console.log('🔄 Upserting subscription:', { email, plan, subscriptionId });

    const { error: upsertErr } = await supabaseAdmin
      .from("subscribers")
      .upsert(
        {
          email,
          plan,
          stripe_subscription_id: subscriptionId,
          status: "active",
        },
        { onConflict: "email" }
      );

    if (upsertErr) {
      console.error('❌ Upsert error:', upsertErr);
      throw new Error(`Error upserting subscriber: ${upsertErr.message}`);
    }

    console.log(`✅ Successfully upserted subscription for user ${email}, plan=${plan}`);
  }

  try {
    console.log(`🚀 Processing webhook event: ${event.type}`);

    // 5. Switch on event types
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email || "";
      const plan = session.metadata?.plan || "";
      const subscriptionId = (session.subscription as string) || null;

      console.log('✅ Checkout session completed:', { email, plan, subscriptionId });

      if (!email || !plan) {
        console.error("❌ Missing email or plan in checkout.session:", session);
        return new NextResponse("Missing email/plan in session", { status: 400 });
      }

      await upsertSubscription({ email, plan, subscriptionId });

    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      console.log('🔄 Subscription updated:', subscription.id);

      // Determine the plan from the price ID in subscription.items
      const priceId = subscription.items?.data?.[0]?.price?.id || "";
      const plan = priceId === "price_1Qc9d9KSaqiJUYkjvqlvMfVs"
        ? "monthly"
        : priceId === "price_1Qc9dKKSaqiJUYkjXu5QHgk8"
        ? "annual"
        : "unknown";

      // Retrieve the full Customer object to get their email
      const customerId = subscription.customer as string;
      const customer = await stripe.customers.retrieve(customerId);
      console.log('🔍 Retrieved customer:', customerId);

      if ((customer as Stripe.DeletedCustomer).deleted) {
        console.error("❌ No valid email: customer deleted", customerId);
        return new NextResponse("Customer is deleted, no email found.", { status: 400 });
      }

      const { email } = customer as Stripe.Customer;
      if (!email) {
        console.error("❌ No valid email found on customer:", customerId);
        return new NextResponse("No email on customer.", { status: 400 });
      }

      await upsertSubscription({ email, plan, subscriptionId: subscription.id });

    } else if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      console.log('💰 Invoice payment succeeded:', invoice.id);

      const email = invoice.customer_email;
      if (!email) {
        console.error("❌ No email found on invoice:", invoice.id);
        return new NextResponse("No email on invoice.", { status: 400 });
      }

      const priceId = invoice.lines.data[0]?.price?.id || "";
      const plan = priceId === "price_1Qc9d9KSaqiJUYkjvqlvMfVs"
        ? "monthly"
        : priceId === "price_1Qc9dKKSaqiJUYkjXu5QHgk8"
        ? "annual"
        : "unknown";

      await upsertSubscription({ email, plan, subscriptionId: invoice.subscription as string });

    } else {
      console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err: unknown) {
    console.error("❌ Webhook handler error:", err);
    return new NextResponse(`Webhook error: ${String(err)}`, { status: 500 });
  }
}