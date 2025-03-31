/* src/app/api/create-checkout-session/route.ts */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
const SUCCESS_URL = "https://www.firstserveseattle.com/members";
const CANCEL_URL = "https://www.firstserveseattle.com/";

// Verify these Price IDs are correct in your Stripe account
const MONTHLY_ID = "price_1Qbm96KSaqiJUYkj7SWySbjU";
const ANNUAL_ID = "price_1QowMRKSaqiJUYkjgeqLADm4";

// Verify this Coupon ID is correct in your Stripe account
const FIRST_MONTH_50_OFF_COUPON_ID = "8m1czvbe";

export async function POST(request: Request) {
  try {
    const { plan } = (await request.json()) as { plan?: string };

    // Default to monthly if plan is not provided or invalid
    const selectedPlan = plan === "annual" ? "annual" : "monthly";
    const priceId = selectedPlan === "annual" ? ANNUAL_ID : MONTHLY_ID;

    if (!STRIPE_SECRET_KEY) {
        console.error("Stripe secret key is not configured.");
        throw new Error("Server configuration error."); // Don't expose details
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      // Use the API version required by the installed Stripe library
      apiVersion: '2025-02-24.acacia',
    });

     // Retrieve cookies for potential metadata
     const cookieStore = cookies();
     const visitorId = cookieStore.get('datafast_visitor_id')?.value;
     const sessionId = cookieStore.get('datafast_session_id')?.value;

    // Prepare parameters for the Stripe Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      allow_promotion_codes: true, // Allows manual codes even if we auto-apply one
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      metadata: {
        plan: selectedPlan,
        // Include other analytics IDs if available
        visitorId: visitorId ?? undefined,
        sessionId: sessionId ?? undefined
      },
    };

    // Apply the 50% off coupon AUTOMATICALLY for the MONTHLY plan
    if (selectedPlan === "monthly") {
      sessionParams.discounts = [{ coupon: FIRST_MONTH_50_OFF_COUPON_ID }];
      console.log(`Applying coupon ${FIRST_MONTH_50_OFF_COUPON_ID} for monthly plan checkout.`);
    }

    // Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create(sessionParams);

    // Return the session URL to the frontend
    return NextResponse.json({ url: session.url }, { status: 200 });

  } catch (err: unknown) {
    let message = "Unknown error creating checkout session.";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === 'string') {
        message = err;
    }
    console.error("Error creating Stripe checkout session:", message);
    // Return a generic error message to the client
    return NextResponse.json({ error: "Failed to initialize checkout process." }, { status: 500 });
  }
}