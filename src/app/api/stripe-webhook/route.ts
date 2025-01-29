import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ⚠️ Remove Edge Runtime: It breaks raw request handling
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  let event: Stripe.Event;

  // 1. Read raw body + signature
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("Missing Stripe signature header");
    return new NextResponse("Missing Stripe signature header.", { status: 400 });
  }

  // 2. Initialize Stripe client
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
  });

  // 3. Verify the webhook signature
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new NextResponse("Invalid Stripe signature.", { status: 400 });
  }

  // 4. Initialize Supabase Admin
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

  // Process Stripe events
  try {
    console.log(`Processing webhook event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email || "";
      const plan = session.metadata?.plan || "";
      const subscriptionId = (session.subscription as string) || null;
      const paymentIntentId = (session.payment_intent as string) || null;

      console.log('Checkout session completed:', { email, plan, subscriptionId, paymentIntentId });

      if (!email || !plan) {
        console.error("Missing email or plan in checkout.session:", session);
        return new NextResponse("Missing email/plan in session", { status: 400 });
      }

      const { error } = await supabaseAdmin
        .from("subscribers")
        .upsert(
          {
            email,
            plan,
            stripe_subscription_id: subscriptionId,
            stripe_payment_intent_id: paymentIntentId,
            status: "active",
          },
          { onConflict: "email" }
        );

      if (error) {
        console.error("Supabase upsert error:", error);
        return new NextResponse(`Error upserting subscriber: ${error.message}`, { status: 500 });
      }

      console.log(`Successfully upserted subscription for user ${email}, plan=${plan}`);
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return new NextResponse(`Webhook error: ${String(err)}`, { status: 500 });
  }
}