import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";

/* -------------------------------------------------------------------------- */
/*  ENV & constants                                                           */
/* -------------------------------------------------------------------------- */
// Support for gradual migration between Stripe accounts
const useNewAccount = process.env.USE_NEW_STRIPE_ACCOUNT === 'true';
const STRIPE_SECRET_KEY = useNewAccount
  ? (process.env.STRIPE_SECRET_KEY_NEW || process.env.STRIPE_SECRET_KEY)
  : process.env.STRIPE_SECRET_KEY as string;

const SUCCESS_URL = "https://firstserveseattle.com/checkout-success";
const CANCEL_URL  = "https://firstserveseattle.com/";

const MONTHLY_ID = useNewAccount
  ? (process.env.STRIPE_MONTHLY_PRICE_ID_NEW || "price_1Qbm96KSaqiJUYkj7SWySbjU")
  : "price_1Qbm96KSaqiJUYkj7SWySbjU";
const ANNUAL_ID = useNewAccount
  ? (process.env.STRIPE_ANNUAL_PRICE_ID_NEW || "price_1QowMRKSaqiJUYkjgeqLADm4")
  : "price_1QowMRKSaqiJUYkjgeqLADm4";

/* -------------------------------------------------------------------------- */
/*  POST handler – returns { url }                                            */
/* -------------------------------------------------------------------------- */
export async function POST(request: Request) {
  try {
    const { email, plan, offerId } = (await request.json()) as {
      email?: string;
      plan?: string;
      offerId?: string;
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

    // Check if this is the 50% off first month offer
    const isDiscountOffer = offerId === 'fifty_percent_off_first_month';
    console.log('API received:', { email, plan, offerId, isDiscountOffer });
    
    
    // Create checkout session with discount instead of trial
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      payment_method_collection: "always",
      metadata: {
        plan: selectedPlan,
        offerId: offerId ?? "default",
        visitorId: cookieStore.get("datafast_visitor_id")?.value ?? null,
        sessionId: cookieStore.get("datafast_session_id")?.value ?? null,
      },
    };

    // Apply 50% discount for first month if applicable (monthly plans only)
    if (isDiscountOffer && selectedPlan === 'monthly') {
      const promoCode = useNewAccount
        ? (process.env.STRIPE_FIFTY_OFF_PROMO_NEW || 'promo_1R8o3pKSaqiJUYkjLMJ3UX4z')
        : 'promo_1R8o3pKSaqiJUYkjLMJ3UX4z';
      sessionConfig.discounts = [
        {
          promotion_code: promoCode,
        }
      ];
      sessionConfig.metadata!.discount_applied = "FIRST50";
    } else {
      // Allow promotion codes
      sessionConfig.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("checkout-session error:", msg);
    console.error("Full error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}