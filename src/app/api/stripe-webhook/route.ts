import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-01-27.acacia" as Stripe.LatestApiVersion,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
);

const MONTHLY_ID = "price_1Qbm96KSaqiJUYkj7SWySbjU";
const ANNUAL_ID  = "price_1QowMRKSaqiJUYkjgeqLADm4";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig     = req.headers.get("stripe-signature") ?? "";
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch (_err) {
    /* reference once to silence linter */
    console.warn("Signature error (type):", typeof _err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    /* -------------------------------------------------- checkout.session */
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email   = session.customer_details?.email ?? session.customer_email;
      const subId   = session.subscription as string | null;

      if (email && subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        await supabase.from("subscribers").upsert(
          {
            email,
            plan: session.metadata?.plan ?? "monthly",
            stripe_subscription_id: subId,
            status: sub.status,
            trial_end: sub.trial_end ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" },
        );
      }
    }

    /* ------------------------------------------------ customer.sub.updated */
    if (event.type === "customer.subscription.updated") {
      const sub      = event.data.object as Stripe.Subscription;
      const customer = (await stripe.customers.retrieve(
        sub.customer as string,
      )) as Stripe.Customer;

      const priceId = sub.items.data[0]?.price.id ?? "";
      const plan =
        priceId === MONTHLY_ID ? "monthly"
        : priceId === ANNUAL_ID ? "annual"
        : "unknown";

      if (customer.email) {
        await supabase.from("subscribers").upsert(
          {
            email: customer.email,
            plan,
            stripe_subscription_id: sub.id,
            status: sub.status,
            trial_end: sub.trial_end ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" },
        );
      }
    }

    return new NextResponse("OK");
  } catch (_err) {
    console.error("Webhook handler error:", _err);
    return new NextResponse("Webhook error", { status: 500 });
  }
}
