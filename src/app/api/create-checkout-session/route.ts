// src/app/api/create-checkout-session/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// This is an example. You will need to replace these with your own values.
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
const STRIPE_SUCCESS_URL = "https://yourdomain.com/success";
const STRIPE_CANCEL_URL = "https://yourdomain.com/cancel";

export async function POST(request: Request) {
  try {
    // 1. Parse request body
    const { plan } = await request.json();

    if (!plan) {
      return NextResponse.json({ error: "No plan specified." }, { status: 400 });
    }

    // 2. Create the Stripe client
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
    });

    // 3. (Optional) Create or get the user from Supabase (if needed)
    // In this snippet, we assume you might need a user session or such.

    // 4. Choose which Stripe Price to use
    let priceId: string;
    if (plan === "basic") {
      priceId = "price_basic123"; // REPLACE with your actual price ID
    } else if (plan === "pro") {
      priceId = "price_pro456"; // REPLACE with your actual price ID
    } else {
      return NextResponse.json({ error: `Unknown plan: ${plan}` }, { status: 400 });
    }

    // 5. Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      // Example: you might set `customer_email` if you know the user's email from your logic
      // customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: STRIPE_SUCCESS_URL,
      cancel_url: STRIPE_CANCEL_URL,
    });

    // 6. Return the session URL
    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: unknown) {
    // No longer using 'any'
    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    }
    console.error("Error creating checkout session:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}