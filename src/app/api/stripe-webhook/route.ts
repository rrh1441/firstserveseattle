// src/app/api/stripe-webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
  });

  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature header." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, signingSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Webhook signature verification failed." }, { status: 400 });
  }

  // Initialize Supabase Admin
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const email = session.customer_details?.email;
      const plan = session.metadata?.plan;
      const subscriptionId = session.subscription as string | null;
      const paymentIntentId = session.payment_intent as string | null;

      if (!email || !plan) {
        return NextResponse.json({ error: "Missing email or plan." }, { status: 400 });
      }

      // --- Step 1: Look up the user in auth.users by email ---
      // We need the "id" field from auth.users to link to your custom 'subscribers' table.
      const { data: foundUser, error: userError } = await supabaseAdmin
        .from("auth.users")
        .select("id")
        .eq("email", email)
        .single();

      if (userError) {
        console.error("Error fetching user:", userError);
        return NextResponse.json({ error: userError.message }, { status: 500 });
      }

      if (!foundUser) {
        console.error("User not found for email:", email);
        return NextResponse.json({ error: "User not found." }, { status: 404 });
      }

      const userId = foundUser.id;

      // --- Step 2: Upsert to your "subscribers" table ---
      const { error: upsertError } = await supabaseAdmin
        .from("subscribers")
        .upsert({
          user_id: userId,
          email,
          plan,
          stripe_subscription_id: subscriptionId,
          stripe_payment_intent_id: paymentIntentId,
          status: "active",
        }, { onConflict: "user_id,plan" });

      if (upsertError) {
        console.error("Error upserting subscription:", upsertError);
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }

      console.log("Subscription upserted successfully for user:", email);
      return NextResponse.json({ message: "Subscription upsert successful." }, { status: 200 });
    }

    console.log(`Unhandled event type: ${event.type}`);
    return NextResponse.json({ message: "Event received." }, { status: 200 });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}