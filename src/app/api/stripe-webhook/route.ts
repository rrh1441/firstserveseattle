// src/app/api/stripe-webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// We need this config so Next.js doesn't parse the body automatically.
// Stripe requires the raw body to validate the webhook signature.
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  // 1. Initialize Stripe with your secret key
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-12-18.acacia", // Updated API version
  });

  // 2. Retrieve the Stripe webhook signing secret from your .env
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  // 3. Get the raw body for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("Missing Stripe signature header.");
    return new NextResponse("Missing Stripe signature header.", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, signingSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // 4. Initialize Supabase with the SERVICE ROLE KEY (server use only!)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 5. Handle the Stripe event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Retrieve any metadata you set when creating the Checkout Session
        const userId = session.metadata?.user_id ?? null;
        const plan = session.metadata?.plan ?? null;

        // For subscription-based checkouts, there's a subscription ID
        const subscriptionId = session.subscription
          ? (session.subscription as string)
          : null;

        // For one-time payments, there's a payment intent ID
        const paymentIntentId = session.payment_intent
          ? (session.payment_intent as string)
          : null;

        // Insert or update subscription/plan data in your Supabase table
        if (userId && plan) {
          const { error } = await supabase
            .from("subscriptions")
            .upsert(
              {
                user_id: userId,
                plan: plan,
                stripe_subscription_id: subscriptionId,
                stripe_payment_intent_id: paymentIntentId,
                status: "active", // Define your own logic for statuses.
              },
              { onConflict: ["user_id", "plan"] } // Prevent duplicate inserts.
            );

          if (error) {
            console.error("Supabase insert/upsert error:", error.message);
            return new NextResponse(error.message, { status: 500 });
          }
        }

        break;
      }

      // Add handlers for other event types as needed
      default:
        console.log(`Unhandled event type ${event.type}`);
        break;
    }

    // Return a 200 to Stripe to indicate the webhook was handled successfully
    return new NextResponse("Event received", { status: 200 });
  } catch (error: any) {
    console.error("Webhook handler error:", error.message);
    return new NextResponse(error.message, { status: 500 });
  }
}
