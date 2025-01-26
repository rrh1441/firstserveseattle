// src/app/api/stripe-webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Prevent Next.js from parsing the body automatically
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    // Use your desired Stripe API version here
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
  });

  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("Missing Stripe signature header.");
    return new NextResponse("Missing Stripe signature header.", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, signingSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return new NextResponse("Webhook signature verification failed.", { status: 400 });
  }

  // Initialize your Supabase admin client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Handle only checkout.session.completed events
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const email = session.customer_details?.email;
      const plan = session.metadata?.plan;
      const subscriptionId = session.subscription as string | null;
      const paymentIntentId = session.payment_intent as string | null;

      if (!email || !plan) {
        console.error("Missing email or plan in checkout session.");
        return new NextResponse("Missing email or plan.", { status: 400 });
      }

      // --- Step 1: Fetch the user by email using the 'filter' parameter ---
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers({
        filter: `email.eq.${email}`, // PostgREST syntax to match email
      });

      if (userError) {
        console.error("Error fetching user:", userError.message);
        return new NextResponse(`Error fetching user: ${userError.message}`, { status: 500 });
      }

      if (!userData?.users?.length) {
        console.error("User not found.");
        return new NextResponse("User not found.", { status: 404 });
      }

      const userId = userData.users[0].id;

      // --- Step 2: Upsert subscription to the "subscribers" table ---
      const { error: upsertError } = await supabaseAdmin
        .from("subscribers")
        .upsert(
          {
            user_id: userId,
            email,
            plan,
            stripe_subscription_id: subscriptionId,
            stripe_payment_intent_id: paymentIntentId,
            status: "active",
          },
          { onConflict: "user_id,plan" }
        );

      if (upsertError) {
        console.error("Error upserting subscription:", upsertError.message);
        return new NextResponse(`Error saving subscription: ${upsertError.message}`, { status: 500 });
      }

      console.log("Subscription successfully saved for user:", email);
      return new NextResponse("Webhook handled successfully.", { status: 200 });
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse("Event received.", { status: 200 });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return new NextResponse(`Webhook handler error: ${error}`, { status: 500 });
  }
}