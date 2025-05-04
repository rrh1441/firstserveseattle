/* src/app/api/create-checkout-session/route.ts */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;

const SUCCESS_URL = "https://www.firstserveseattle.com/members";
const CANCEL_URL  = "https://www.firstserveseattle.com/";

const MONTHLY_ID  = "price_1Qbm96KSaqiJUYkj7SWySbjU";
const ANNUAL_ID   = "price_1QowMRKSaqiJUYkjgeqLADm4";
const FIRST_MONTH_50_OFF_COUPON_ID = "8m1czvbe";

export async function POST(request: Request) {
  try {
    /* ------------------------------------------------------------------ */
    /* 1. Parse body (email + plan)                                       */
    /* ------------------------------------------------------------------ */
    const { email, plan } = (await request.json()) as {
      email?: string;
      plan?: string;
    };

    if (!email || !plan)
      return NextResponse.json(
        { error: "Missing email or plan." },
        { status: 400 },
      );

    const selectedPlan = plan === "annual" ? "annual" : "monthly";
    const priceId      = selectedPlan === "annual" ? ANNUAL_ID : MONTHLY_ID;

    /* ------------------------------------------------------------------ */
    /* 2. Query subscribers table for trial flag                          */
    /* ------------------------------------------------------------------ */
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: subRow, error: subErr } = await supabaseAdmin
      .from("subscribers")
      .select("trial_eligible")
      .eq("email", email)
      .single();

    if (subErr && subErr.code !== "PGRST116") // 116 = no rows
      throw new Error(`Supabase query failed: ${subErr.message}`);

    const giveTrial =
      selectedPlan === "monthly" && subRow?.trial_eligible === true;

    /* ------------------------------------------------------------------ */
    /* 3. Build session params                                            */
    /* ------------------------------------------------------------------ */
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const cookieStore = await cookies();                    /* ‹ UPDATED › */
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      customer_email: email,
      metadata: {
        plan: selectedPlan,
        trial_applied: giveTrial ? "true" : "false",
        visitorId: cookieStore.get("datafast_visitor_id")?.value ?? null, /* ‹ UPDATED › */
        sessionId: cookieStore.get("datafast_session_id")?.value ?? null,
      },
    };

    if (selectedPlan === "monthly") {
      if (giveTrial) {
        sessionParams.subscription_data = { trial_period_days: 30 };
      } else {
        sessionParams.discounts = [{ coupon: FIRST_MONTH_50_OFF_COUPON_ID }];
      }
    } else {
      sessionParams.allow_promotion_codes = true;
    }

    /* ------------------------------------------------------------------ */
    /* 4. Create Checkout Session                                         */
    /* ------------------------------------------------------------------ */
    const session = await stripe.checkout.sessions.create(sessionParams);

    /* ------------------------------------------------------------------ */
    /* 5. Consume the entitlement if trial was granted                    */
    /* ------------------------------------------------------------------ */
    if (giveTrial) {
      await supabaseAdmin
        .from("subscribers")
        .update({
          trial_eligible: false,
          offer_code: "free_month",
          updated_at: new Date().toISOString(),
        })
        .eq("email", email);
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("create-checkout-session error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
