/* src/app/api/create-checkout-session/route.ts */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers"; // Keep cookies if you use them for metadata

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
const SUCCESS_URL = "https://www.firstserveseattle.com/members"; // Redirect to members on success
const CANCEL_URL = "https://www.firstserveseattle.com/"; // Redirect to homepage on cancel

// Ensure these Price IDs are correct for your Stripe account
const MONTHLY_ID = "price_1Qbm96KSaqiJUYkj7SWySbjU";
const ANNUAL_ID = "price_1QowMRKSaqiJUYkjgeqLADm4";

// Define your 50% off coupon ID created in Stripe
const FIRST_MONTH_50_OFF_COUPON_ID = "8m1czvbe"; // UPDATED Coupon ID

export async function POST(request: Request) {
  try {
    const { plan } = (await request.json()) as { plan?: string };

    // Default to monthly if plan is not provided or invalid
    const selectedPlan = plan === "annual" ? "annual" : "monthly";
    const priceId = selectedPlan === "annual" ? ANNUAL_ID : MONTHLY_ID;

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia", // Use your specified version
    });

    // --- Get visitor/session IDs if needed for metadata ---
     const cookieStore = cookies();
     const visitorId = cookieStore.get('datafast_visitor_id')?.value;
     const sessionId = cookieStore.get('datafast_session_id')?.value;
    // ----------------------------------------------------

    // --- Prepare Checkout Session Parameters ---
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      allow_promotion_codes: true, // Allow other codes, but we apply ours automatically
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      metadata: {
        plan: selectedPlan, // Store the actual plan being purchased
         visitorId: visitorId ?? undefined,
         sessionId: sessionId ?? undefined
      },
    };

    // --- Apply the 50% off coupon AUTOMATICALLY for MONTHLY plan ---
    if (selectedPlan === "monthly") {
      sessionParams.discounts = [{ coupon: FIRST_MONTH_50_OFF_COUPON_ID }]; // Use correct coupon ID
      console.log(`Applying coupon ${FIRST_MONTH_50_OFF_COUPON_ID} for monthly plan.`);
    }
    // --------------------------------------------------------------

    // --- Create the Stripe Checkout Session ---
    const session = await stripe.checkout.sessions.create(sessionParams);
    // ----------------------------------------

    // Return the session URL
    return NextResponse.json({ url: session.url }, { status: 200 });

  } catch (err: unknown) {
    let message = "Unknown error creating checkout session.";
    if (err instanceof Error) {
      message = err.message;
    }
    console.error("Error creating Stripe checkout session:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}