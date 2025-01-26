// ================================
// src/app/api/create-checkout-session/route.ts
// ================================

import { NextResponse } from "next/server";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;

// Use your real domain pages here if you like
const SUCCESS_URL = "https://firstserveseattle.com";
const CANCEL_URL = "https://firstserveseattle.com";

// These are your provided price IDs:
const MONTHLY_PRICE_ID = "price_1Qc9d9KSaqiJUYkjvqlvMfVs";
const ANNUAL_PRICE_ID = "price_1Qc9dKKSaqiJUYkjXu5QHgk8";

export async function POST(request: Request) {
  try {
    // 1. Parse the plan from the request body
    const body = await request.json() as { plan?: string };
    const plan = body.plan;

    if (!plan) {
      return NextResponse.json({ error: "No plan specified." }, { status: 400 });
    }

    // 2. Pick the correct Stripe Price ID based on 'monthly' or 'annual'
    let priceId: string;
    if (plan === "monthly") {
      priceId = MONTHLY_PRICE_ID;
    } else if (plan === "annual") {
      priceId = ANNUAL_PRICE_ID;
    } else {
      return NextResponse.json({ error: `Unknown plan: ${plan}` }, { status: 400 });
    }

    // 3. Create the Stripe client
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
    });

    // 4. Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
    });

    // 5. Return the session URL
    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: unknown) {
    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}