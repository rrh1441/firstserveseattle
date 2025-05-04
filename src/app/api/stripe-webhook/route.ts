// src/app/api/stripe-webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ✅ Required for Next.js API routes
export const config = {
  api: {
    bodyParser: false,
  },
  runtime: "edge",
};

export async function POST(request: NextRequest) {
  let event: Stripe.Event;

  // 1️⃣ **Read raw body & verify signature**
  const rawBody   = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("❌ Missing Stripe signature header");
    return new NextResponse("Missing Stripe signature header.", {
      status: 400,
    });
  }

  // 2️⃣ **Initialize Stripe client with correct API version**
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-01-27.acacia" as Stripe.LatestApiVersion,
  });

  // 3️⃣ **Verify webhook signature**
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return new NextResponse("Invalid Stripe signature.", { status: 400 });
  }

  // 4️⃣ **Initialize Supabase Admin Client**
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  );

  // ✅ **Helper function to upsert subscription (email is primary key)**
  async function upsertSubscription({
    email,
    plan,
    subscriptionId,
    status,
    fullName,
    trialEnd,                       // ← NEW (optional)
  }: {
    email: string;
    plan: string;
    subscriptionId?: string | null;
    status: string;
    fullName: string;
    trialEnd?: number | null;       // ← NEW
  }) {
    console.log("🔄 Upserting subscription:", {
      email,
      plan,
      subscriptionId,
      status,
      fullName,
      trialEnd,
    });

    const { error } = await supabaseAdmin
      .from("subscribers")
      .upsert(
        {
          email, // Primary Key
          plan,
          stripe_subscription_id: subscriptionId ?? null,
          status,
          full_name: fullName,
          trial_end: trialEnd ?? null,    // ← NEW COLUMN (nullable)
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" },
      );

    if (error) {
      console.error("❌ Upsert error:", error);
      throw new Error(`Error upserting subscriber: ${error.message}`);
    }

    console.log(`✅ Successfully upserted subscription for ${email}`);
  }

  try {
    console.log(`⚡ Processing webhook event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session         = event.data.object as Stripe.Checkout.Session;
      const email           =
        session.customer_details?.email ?? session.customer_email;
      const fullName        = session.customer_details?.name ?? "Unknown";
      const plan            = session.metadata?.plan ?? "unknown";
      const subscriptionId  = session.subscription as string | null;

      if (!email) {
        console.error("❌ Missing email in checkout.session:", session);
        return new NextResponse("Missing email in session", { status: 400 });
      }

      // ⬇️ NEW: fetch subscription to capture status/trial info
      let status   = "active";
      let trialEnd: number | null | undefined = null;
      if (subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          status    = sub.status;
          trialEnd  = sub.trial_end;
        } catch (subErr) {
          console.warn(
            "⚠️ Could not retrieve subscription for trial data:",
            subErr,
          );
        }
      }

      await upsertSubscription({
        email,
        plan,
        subscriptionId,
        status,
        fullName,
        trialEnd,                    // ← NEW
      });
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId      = subscription.items?.data?.[0]?.price?.id ?? "";

      // Update the price IDs to match the ones used in your checkout session creation.
      const plan =
        priceId === "price_1Qbm96KSaqiJUYkj7SWySbjU"
          ? "monthly"
          : priceId === "price_1QowMRKSaqiJUYkjgeqLADm4"
          ? "annual"
          : "unknown";

      const customerId = subscription.customer as string;
      const customer   = (await stripe.customers.retrieve(
        customerId,
      )) as Stripe.Customer;

      if (!customer.email) {
        console.error("❌ No valid email found on customer:", customerId);
        return new NextResponse("No email on customer.", { status: 400 });
      }

      const fullName = customer.name ?? "Unknown";

      await upsertSubscription({
        email: customer.email,
        plan,
        subscriptionId: subscription.id,
        status: subscription.status,
        fullName,
        trialEnd: subscription.trial_end,   // ← NEW
      });
    } else {
      console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("❌ Webhook handler error:", err);
    return new NextResponse(`Webhook error: ${String(err)}`, { status: 500 });
  }
}
