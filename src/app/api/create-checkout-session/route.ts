import { NextResponse } from "next/server";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;

const SUCCESS_URL = "https://firstserveseattle.com";
const CANCEL_URL = "https://firstserveseattle.com";

const MONTHLY_PRICE_ID = "price_1Qc9d9KSaqiJUYkjvqlvMfVs";
const ANNUAL_PRICE_ID = "price_1Qc9dKKSaqiJUYkjXu5QHgk8";

export async function POST(request: Request) {
  try {
    const { plan } = (await request.json()) as { plan?: string };

    if (!plan) {
      return NextResponse.json({ error: "No plan specified." }, { status: 400 });
    }

    let priceId: string;
    if (plan === "monthly") {
      priceId = MONTHLY_PRICE_ID;
    } else if (plan === "annual") {
      priceId = ANNUAL_PRICE_ID;
    } else {
      return NextResponse.json({ error: `Unknown plan: ${plan}` }, { status: 400 });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: unknown) {
    let message = "Unknown error occurred.";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}