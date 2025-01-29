import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Required for Next.js Edge Functions
export const config = {
  api: {
    bodyParser: false,
  },
  runtime: 'edge',
};

export async function POST(request: NextRequest) {
  let event: Stripe.Event;

  // 1️⃣ Read raw body + signature
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("❌ Missing Stripe signature header");
    return new NextResponse("Missing Stripe signature header.", { status: 400 });
  }

  // 2️⃣ Initialize Stripe client (API Version `2025-01-27.acacia`)
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-01-27.acacia" as Stripe.LatestApiVersion,
  });

  // 3️⃣ Verify the webhook signature
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

  // 4️⃣ Initialize Supabase Admin
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

  // 🔧 Helper function to upsert subscriber
  async function upsertSubscription(email: string, plan: string, subscriptionId?: string | null) {
    console.log('🔄 Upserting subscriber:', { email, plan, subscriptionId });

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
      console.error("❌ Supabase Upsert Error:", upsertErr);
      throw new Error(`Error upserting subscriber: ${upsertErr.message}`);
    }

    console.log(`✅ Successfully upserted subscription for ${email}, plan=${plan}`);
  }

  try {
    console.log(`📩 Processing webhook event: ${event.type}`);

    // 📌 Handle Checkout Session Completed (New Subscription)
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email || "";
      const plan = session.metadata?.plan || "";
      const subscriptionId = (session.subscription as string) || null;

      console.log("✅ Checkout Session Completed:", { email, plan, subscriptionId });

      if (!email || !plan) {
        console.error("❌ Missing email or plan in checkout.session:", session);
        return new NextResponse("Missing email/plan in session", { status: 400 });
      }

      await upsertSubscription(email, plan, subscriptionId);

    // 📌 Handle Subscription Updates
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      console.log("🔄 Subscription Updated:", subscription.id);

      // Extract plan from price ID
      const priceId = subscription.items?.data?.[0]?.price?.id || "";
      const plan = priceId === "price_1Qc9d9KSaqiJUYkjvqlvMfVs" ? "monthly" :
                 priceId === "price_1Qc9dKKSaqiJUYkjXu5QHgk8" ? "annual" : "unknown";

      // Retrieve the full Customer object
      const customerId = subscription.customer as string;
      const customer = await stripe.customers.retrieve(customerId);

      if ((customer as Stripe.DeletedCustomer).deleted) {
        console.error("❌ No valid email: Customer deleted:", customerId);
        return new NextResponse("Customer is deleted, no email found.", { status: 400 });
      }

      const { email } = customer as Stripe.Customer;
      if (!email) {
        console.error("❌ No valid email found:", customerId);
        return new NextResponse("No email on customer.", { status: 400 });
      }

      await upsertSubscription(email, plan, subscription.id);

    } else {
      console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    return new NextResponse("OK", { status: 200 });

  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    return new NextResponse(`Webhook error: ${String(err)}`, { status: 500 });
  }
}