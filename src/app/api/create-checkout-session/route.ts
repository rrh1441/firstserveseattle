import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";

/* -------------------------------------------------------------------------- */
/*  ENV & constants                                                           */
/* -------------------------------------------------------------------------- */
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;

const SUCCESS_URL = "https://firstserveseattle.com/checkout-success";
const CANCEL_URL  = "https://firstserveseattle.com/";

const MONTHLY_ID = "price_1Qbm96KSaqiJUYkj7SWySbjU";
const ANNUAL_ID  = "price_1QowMRKSaqiJUYkjgeqLADm4";

/* -------------------------------------------------------------------------- */
/*  POST handler – returns { url }                                            */
/* -------------------------------------------------------------------------- */
export async function POST(request: Request) {
  try {
    const { email, plan } = (await request.json()) as {
      email?: string;
      plan?: string;
    };

    if (!email || !plan) {
      return NextResponse.json(
        { error: "Missing email or plan." },
        { status: 400 },
      );
    }

    const selectedPlan = plan === "annual" ? "annual" : "monthly";
    const priceId      = selectedPlan === "annual" ? ANNUAL_ID : MONTHLY_ID;

    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const cookieStore = await cookies();

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,

      /* ---------- card-required 14-day trial -------------------------- */
      payment_method_collection: "always", // require payment method upfront
      subscription_data: {
        trial_period_days: 14,
        // removed trial_settings since we're requiring payment method
      },

      allow_promotion_codes: true,

      metadata: {
        plan: selectedPlan,
        trial_applied: "true",
        visitorId: cookieStore.get("datafast_visitor_id")?.value ?? null,
        sessionId: cookieStore.get("datafast_session_id")?.value ?? null,
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("checkout-session error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}