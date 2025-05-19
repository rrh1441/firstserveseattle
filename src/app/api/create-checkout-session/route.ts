/* src/app/api/create-checkout-session/route.ts */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;

const SUCCESS_URL = "https://www.firstserveseattle.com/members";
const CANCEL_URL  = "https://www.firstserveseattle.com/";

const MONTHLY_ID = "price_1Qbm96KSaqiJUYkj7SWySbjU";
const ANNUAL_ID  = "price_1QowMRKSaqiJUYkjgeqLADm4";

export async function POST(request: Request) {
  try {
    /* ---------- body ---------- */
    const { email, plan } = (await request.json()) as { email?: string; plan?: string };
    if (!email || !plan) {
      return NextResponse.json({ error: "Missing email or plan." }, { status: 400 });
    }

    const selectedPlan = plan === "annual" ? "annual" : "monthly";
    const priceId      = selectedPlan === "annual" ? ANNUAL_ID : MONTHLY_ID;

    /* ---------- stripe ---------- */
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const cookieStore = await cookies();

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      payment_method_collection: "if_required", // start trial without collecting a card
      subscription_data: {
        trial_period_days: 14,
        trial_settings: {
          end_behavior: { missing_payment_method: "pause" },
        },
      },
      metadata: {
        plan: selectedPlan,
        trial_applied: "true",
        visitorId: cookieStore.get("datafast_visitor_id")?.value ?? null,
        sessionId: cookieStore.get("datafast_session_id")?.value ?? null,
      },
      allow_promotion_codes: true,   // user can still enter any promo code
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("checkout-session error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
