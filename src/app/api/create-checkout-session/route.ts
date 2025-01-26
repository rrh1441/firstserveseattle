// app/api/create-checkout/route.ts

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// This is an example. Adjust the price IDs, success/cancel URLs, etc.
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
const STRIPE_SUCCESS_URL = "https://yourdomain.com/success";
const STRIPE_CANCEL_URL = "https://yourdomain.com/cancel";

export async function POST(request: Request) {
  try {
    // 1. Read the plan from the request body
    const { plan } = await request.json();

    if (!plan) {
      return NextResponse.json({ error: "No plan specified." }, { status: 400 });
    }

    // 2. Create the Stripe client
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
    });

    // 3. Optionally, get the user's token from Supabase
    //    to do further checks, if needed.
    const supabase = createMiddlewareClient({ cookies });
    const {
      data: { session: supabaseSession },
    } = await supabase.auth.getSession();

    if (!supabaseSession) {
      // If you want to require an authenticated user at this point
      return NextResponse.json({ error: "No Supabase user session found." }, { status: 401 });
    }

    const userEmail = supabaseSession.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: "User session has no email." }, { status: 400 });
    }

    // 4. Decide which Stripe Price to use, depending on the plan
    let priceId;
    if (plan === "basic") {
      priceId = "price_yourBasicID"; // REPLACE
    } else if (plan === "pro") {
      priceId = "price_yourProID"; // REPLACE
    } else {
      return NextResponse.json({ error: `Unknown plan: ${plan}` }, { status: 400 });
    }

    // 5. Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: STRIPE_SUCCESS_URL,
      cancel_url: STRIPE_CANCEL_URL,
    });

    // 6. Return the session URL to redirect the user
    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("Error creating checkout session:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}