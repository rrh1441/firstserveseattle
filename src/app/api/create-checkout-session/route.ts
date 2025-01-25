// src/app/api/create-checkout-session/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { plan } = await req.json();

    // Validate the plan type
    if (!["monthly", "annual"].includes(plan)) {
      throw new Error("Invalid plan type provided.");
    }

    // Load environment variables
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripeMonthlyPriceId = process.env.STRIPE_MONTHLY_PRICE_ID;
    const stripeAnnualPriceId = process.env.STRIPE_ANNUAL_PRICE_ID;

    if (!stripeSecretKey || !stripeMonthlyPriceId || !stripeAnnualPriceId) {
      throw new Error("Missing Stripe environment variables.");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    });

    // Determine the price ID
    const priceId = plan === "monthly" ? stripeMonthlyPriceId : stripeAnnualPriceId;

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `https://firstserveseattle.com/tennis-courts?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://firstserveseattle.com/tennis-courts?canceled=true`,
    });

    // Respond with the session URL
    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred.";
    console.error("Error creating checkout session:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}