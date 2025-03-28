// src/app/api/create-checkout-session/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers"; // Keep the import

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
const SUCCESS_URL = "https://www.firstserveseattle.com/login";
const CANCEL_URL = "https://firstserveseattle.com";

const MONTHLY_ID = "price_1Qbm96KSaqiJUYkj7SWySbjU";
const ANNUAL_ID = "price_1QowMRKSaqiJUYkjgeqLADm4";

// Ensure the function is async (it already was, which is good)
export async function POST(request: Request) {
  try {
    const { plan } = (await request.json()) as { plan?: string };

    if (!plan) {
      return NextResponse.json({ error: "No plan provided." }, { status: 400 });
    }

    const priceId = plan === "annual" ? ANNUAL_ID : MONTHLY_ID;

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
    });

    // === CORRECTED: Await the cookies() promise ===
    const cookieStore = await cookies(); // <--- Added await here
    const visitorId = cookieStore.get('datafast_visitor_id')?.value;
    const sessionId = cookieStore.get('datafast_session_id')?.value;
    // ============================================

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      allow_promotion_codes: true,
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      metadata: {
        plan,
        visitorId: visitorId ?? undefined,
        sessionId: sessionId ?? undefined
      },
    });

    console.log(`Stripe session created with metadata: visitorId=${visitorId}, sessionId=${sessionId}`);

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: unknown) {
    let message = "Unknown error.";
    if (err instanceof Error) {
      message = err.message;
    }
    console.error("Error creating Stripe checkout session:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}