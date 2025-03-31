/* src/app/api/create-checkout-session/route.ts */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
const SUCCESS_URL = "https://www.firstserveseattle.com/members";
const CANCEL_URL = "https://www.firstserveseattle.com/";

const MONTHLY_ID = "price_1Qbm96KSaqiJUYkj7SWySbjU";
const ANNUAL_ID = "price_1QowMRKSaqiJUYkjgeqLADm4";

const FIRST_MONTH_50_OFF_COUPON_ID = "8m1czvbe";

export async function POST(request: Request) {
  try {
    const { plan } = (await request.json()) as { plan?: string };

    const selectedPlan = plan === "annual" ? "annual" : "monthly";
    const priceId = selectedPlan === "annual" ? ANNUAL_ID : MONTHLY_ID;

    if (!STRIPE_SECRET_KEY) {
        console.error("Stripe secret key is not configured.");
        throw new Error("Server configuration error.");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    });

     const cookieStore = await cookies();
     const visitorId = cookieStore.get('datafast_visitor_id')?.value; // Type: string | undefined
     const sessionId = cookieStore.get('datafast_session_id')?.value; // Type: string | undefined

    // Prepare parameters for the Stripe Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      allow_promotion_codes: true,
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      metadata: {
        plan: selectedPlan,
        // Use ?? null to convert undefined to null for Stripe metadata compatibility
        visitorId: visitorId ?? null, // <<<< CHANGED undefined to null
        sessionId: sessionId ?? null  // <<<< CHANGED undefined to null
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