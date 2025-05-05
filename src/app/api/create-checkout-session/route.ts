/* src/app/api/create-checkout-session/route.ts */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const STRIPE_SECRET_KEY         = process.env.STRIPE_SECRET_KEY as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const SUPABASE_URL              = process.env.NEXT_PUBLIC_SUPABASE_URL as string;

const SUCCESS_URL = "https://www.firstserveseattle.com/members";
const CANCEL_URL  = "https://www.firstserveseattle.com/";

const MONTHLY_ID  = "price_1Qbm96KSaqiJUYkj7SWySbjU";
const ANNUAL_ID   = "price_1QowMRKSaqiJUYkjgeqLADm4";
const FIRST_MONTH_50_OFF_COUPON_ID = "8m1czvbe";

export async function POST(request: Request) {
  try {
    const { email, plan } = (await request.json()) as { email?: string; plan?: string };
    if (!email || !plan) return NextResponse.json({ error: "Missing email or plan." }, { status: 400 });

    const selectedPlan = plan === "annual" ? "annual" : "monthly";
    const priceId      = selectedPlan === "annual" ? ANNUAL_ID : MONTHLY_ID;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: subRow } = await supabase
      .from("subscribers")
      .select("trial_eligible")
      .eq("email", email)
      .single();

    const giveTrial = subRow?.trial_eligible === true;   // 14-day trial for either plan

    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const cookieStore = await cookies();
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      metadata: {
        plan: selectedPlan,
        trial_applied: giveTrial ? "true" : "false",
        visitorId: cookieStore.get("datafast_visitor_id")?.value ?? null,
        sessionId: cookieStore.get("datafast_session_id")?.value ?? null,
      },
    };

    if (giveTrial) {
      sessionParams.subscription_data = { trial_period_days: 14 };
    } else if (selectedPlan === "monthly") {
      sessionParams.discounts = [{ coupon: FIRST_MONTH_50_OFF_COUPON_ID }];
    } else {
      sessionParams.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (giveTrial) {
      await supabase
        .from("subscribers")
        .update({ trial_eligible: false, offer_code: "free_month", updated_at: new Date().toISOString() })
        .eq("email", email);
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
