import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Required for Next.js API routes
export const config = {
  api: {
    bodyParser: false,
  },
  runtime: "edge",
};

// Initialize Stripe with the correct API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-01-27.acacia" as Stripe.LatestApiVersion,
});

// Initialize Supabase Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// Helper function to upsert subscription into Supabase
async function upsertSubscription({
  email,
  plan,
  subscriptionId,
  paymentIntentId,
}: {
  email: string;
  plan: string;
  subscriptionId?: string | null;
  paymentIntentId?: string | null;
}) {
  console.log("🔹 Upserting subscription:", { email, plan, subscriptionId, paymentIntentId });

  const { error } = await supabaseAdmin
    .from("subscribers")
    .upsert(
      {
        email,
        plan,
        stripe_subscription_id: subscriptionId,
        stripe_payment_intent_id: paymentIntentId,
        status: "active",
      },
      { onConflict: "email" }
    );

  if (error) {
    console.error("❌ Supabase Upsert Error:", error.message);
    throw new Error(`Database upsert failed: ${error.message}`);
  }

  console.log(`✅ Successfully upserted subscription for ${email}`);
}

export async function POST(request: NextRequest) {
  console.log("📩 Stripe Webhook Received");

  // Read raw body for Stripe signature verification
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("❌ Missing Stripe signature ");
    return new NextResponse("Missing Stripe signature.", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    console.error("❌ Stripe Signature Verification Failed:", err);
    return new NextResponse("Invalid Stripe signature.", { status: 400 });
  }

  console.log(`📌 Processing Stripe event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_details?.email || "";
        const plan = session.metadata?.plan || "";
        const subscriptionId = session.subscription as string | null;
        const paymentIntentId = session.payment_intent as string | null;

        if (!email || !plan) {
          console.error("❌ Missing email or plan in checkout session:", session);
          return new NextResponse("Missing email/plan in session", { status: 400 });
        }

        await upsertSubscription({ email, plan, subscriptionId, paymentIntentId });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("🔄 Subscription updated:", subscription.id);

        const priceId = subscription.items?.data?.[0]?.price?.id || "";
        const plan = priceId === "price_1Qc9d9KSaqiJUYkjvqlvMfVs" ? "monthly" 
                   : priceId === "price_1Qc9dKKSaqiJUYkjXu5QHgk8" ? "annual" 
                   : "unknown";

        const customerId = subscription.customer as string;
        const customer = await stripe.customers.retrieve(customerId);

        if ((customer as Stripe.DeletedCustomer).deleted) {
          console.error("❌ Customer is deleted:", customerId);
          return new NextResponse("Customer is deleted, no email found.", { status: 400 });
        }

        const { email } = customer as Stripe.Customer;
        if (!email) {
          console.error("❌ No email found on customer:", customerId);
          return new NextResponse("No email on customer.", { status: 400 });
        }

        await upsertSubscription({ email, plan, subscriptionId: subscription.id, paymentIntentId: null });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("💰 Invoice payment succeeded:", invoice.id);

        const email = invoice.customer_email;
        if (!email) {
          console.error("❌ No email found on invoice:", invoice.id);
          return new NextResponse("No email on invoice.", { status: 400 });
        }

        const priceId = invoice.lines.data[0]?.price?.id || "";
        const plan = priceId === "price_1Qc9d9KSaqiJUYkjvqlvMfVs" ? "monthly" 
                   : priceId === "price_1Qc9dKKSaqiJUYkjXu5QHgk8" ? "annual" 
                   : "unknown";

        await upsertSubscription({ email, plan, subscriptionId: invoice.subscription as string || null, paymentIntentId: invoice.payment_intent as string || null });
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("🚨 Webhook Error:", err);
    return new NextResponse(`Webhook error: ${String(err)}`, { status: 500 });
  }
}