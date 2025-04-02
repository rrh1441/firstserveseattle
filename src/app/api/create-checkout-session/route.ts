/* src/app/api/create-checkout-session/route.ts */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers"; // Make sure this import is present

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
// Ensure these URLs are correct for your production environment
const SUCCESS_URL = "https://www.firstserveseattle.com/members";
const CANCEL_URL = "https://www.firstserveseattle.com/";

// Verify these Price IDs are correct in your Stripe account
const MONTHLY_ID = "price_1Qbm96KSaqiJUYkj7SWySbjU";
const ANNUAL_ID = "price_1QowMRKSaqiJUYkjgeqLADm4";

// Verify this Coupon ID is correct in your Stripe account for the 50% discount
const FIRST_MONTH_50_OFF_COUPON_ID = "8m1czvbe";

export async function POST(request: Request) {
  try {
    // Safely parse the request body
    let plan: string | undefined;
    try {
        const body = await request.json();
        plan = body.plan;
    } catch (e) {
        console.error("Failed to parse request body:", e);
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    // Default to monthly if plan is not 'annual'
    const selectedPlan = plan === "annual" ? "annual" : "monthly";
    const priceId = selectedPlan === "annual" ? ANNUAL_ID : MONTHLY_ID;

    // Check for Stripe secret key configuration
    if (!STRIPE_SECRET_KEY) {
        console.error("Stripe secret key environment variable is not configured.");
        // Do not expose detailed errors to the client
        throw new Error("Server configuration error related to payment processing.");
    }

    // =============================== FIX ===============================
    // Initialize Stripe client WITHOUT explicit apiVersion
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    // ===================================================================

     // Retrieve cookies for potential metadata (using await)
     const cookieStore = cookies(); // Use the imported 'cookies' function
     const visitorId = cookieStore.get('datafast_visitor_id')?.value; // Type: string | undefined
     const sessionId = cookieStore.get('datafast_session_id')?.value; // Type: string | undefined

    // Prepare parameters for the Stripe Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      allow_promotion_codes: true, // Allow other promo codes if needed
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      metadata: {
        plan: selectedPlan,
        // Use nullish coalescing to provide null if undefined, matching Stripe's allowed types
        visitorId: visitorId ?? null,
        sessionId: sessionId ?? null
        // Add any other metadata you need
      },
      // Ensure other parameters like payment_method_types are added if required by your Stripe setup
      // payment_method_types: ['card'], // Example: Uncomment if needed
    };

    // Apply the 50% off coupon AUTOMATICALLY only for the MONTHLY plan
    if (selectedPlan === "monthly") {
      // Ensure the coupon ID is correct
      sessionParams.discounts = [{ coupon: FIRST_MONTH_50_OFF_COUPON_ID }];
      console.log(`Applying coupon ${FIRST_MONTH_50_OFF_COUPON_ID} for monthly plan checkout.`);
    }

    // Create the Stripe Checkout Session
    console.log("Attempting to create Stripe checkout session with params:", JSON.stringify(sessionParams, null, 2)); // Log params for debugging
    const session = await stripe.checkout.sessions.create(sessionParams);
    console.log("Stripe checkout session created successfully:", session.id);

    // Return the session URL to the frontend
    return NextResponse.json({ url: session.url }, { status: 200 });

  } catch (err: unknown) {
    let message = "Unknown error occurred while creating checkout session.";
    let stripeErrorCode: string | undefined;

    if (err instanceof Stripe.errors.StripeError) {
        message = `Stripe Error: ${err.message}`;
        stripeErrorCode = err.code;
        console.error("Stripe Error Details:", err); // Log the full Stripe error
    } else if (err instanceof Error) {
        message = err.message; // Log the actual error server-side
    } else if (typeof err === 'string') {
        message = err;
    }

    // Log the detailed error on the server for debugging
    console.error("Error creating Stripe checkout session:", message);
    // Return a generic error message to the client for security
    return NextResponse.json({
        error: "Failed to initialize the checkout process. Please try again later.",
        details: message, // Keep internal details potentially useful but generic error msg
        code: stripeErrorCode // Optionally pass code if  needed client-side (use carefully)
       }, { status: 500 });
  }
}