import { NextResponse } from "next/server";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;

// After successful purchase, the user returns to your main page
// so they can bypass the paywall on subsequent visits.
const SUCCESS_URL = "https://firstserveseattle.com";
// If the user cancels mid-checkout, we also send them back:
const CANCEL_URL = "https://firstserveseattle.com";

// Provided price IDs from your question:
const MONTHLY_PRICE_ID = "price_1Qc9d9KSaqiJUYkjvqlvMfVs";
const ANNUAL_PRICE_ID = "price_1Qc9dKKSaqiJUYkjXu5QHgk8";

export async function POST(request: Request) {
  try {
    // Parse the plan from the request body
    const { plan } = (await request.json()) as { plan?: string };
    if (!plan) {
      return NextResponse.json({ error: "No plan specified." }, { status: 400 });
    }

    // Match plan to the correct price ID
    let priceId: string;
    if (plan === "monthly") {
      priceId = MONTHLY_PRICE_ID;
    } else if (plan === "annual") {
      priceId = ANNUAL_PRICE_ID;
    } else {
      return NextResponse.json({ error: `Unknown plan: ${plan}` }, { status: 400 });
    }

    // Create the Stripe client
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
    });

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: unknown) {
    let message = "Unknown error.";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}