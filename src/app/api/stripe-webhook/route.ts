import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Next.js config to prevent body parsing on webhooks
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
    return new NextResponse("Missing Stripe signature header.", { status: 400 });
  }

  // 2. Init Stripe client
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
  });

  // 3. Verify the webhook
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

  // 4. Init Supabase Admin
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

  // Helper: upsert subscription row
  async function upsertSubscription({
    email,
    plan,
    subscriptionId,
    paymentIntentId,
  }: {
    email: string;
    plan: string;
    subscriptionId?: string | null;
    paymentIntentId?: string | null;
  }) {
    // Find the user in auth.users by email
    const { data: userRow, error: userErr } = await supabaseAdmin
      .from("auth.users")
      .select("id")
      .eq("email", email)
      .single();
    if (userErr) {
      throw new Error(`Error finding user by email: ${userErr.message}`);
    }
    if (!userRow) {
      throw new Error(`No user with email ${email} found in auth.users`);
    }

    // Upsert into your "subscribers" table
    const { error: upsertErr } = await supabaseAdmin
      .from("subscribers")
      .upsert(
        {
          user_id: userRow.id,
          email,
          plan,
          stripe_subscription_id: subscriptionId,
          stripe_payment_intent_id: paymentIntentId,
          status: "active",
        },
        {
          onConflict: "user_id, plan",
        }
      );

    if (upsertErr) {
      throw new Error(`Error upserting subscriber: ${upsertErr.message}`);
    }

    console.log(`Subscription upserted for email=${email} plan=${plan}`);
  }

  try {
    // 5. Handle the event type
    if (event.type === "checkout.session.completed") {
      // If you do use checkout.session.completed, you'd parse the session here
      const session = event.data.object as Stripe.Checkout.Session;

      const email = session.customer_details?.email || "";
      // Possibly you stored the plan in session.metadata:
      const plan = session.metadata?.plan || "";
      const subscriptionId = (session.subscription as string) || null;
      const paymentIntentId = (session.payment_intent as string) || null;

      if (!email || !plan) {
        console.error("Missing email or plan in checkout.session:", session);
        return new NextResponse("Missing email or plan.", { status: 400 });
      }

      await upsertSubscription({
        email,
        plan,
        subscriptionId,
        paymentIntentId,
      });

    } else if (event.type === "customer.subscription.updated") {
      // This matches the event you posted
      const subscription = event.data.object as Stripe.Subscription;

      // Step A: Get the plan from the subscription's price
      // if you only have 1 item, we can do subscription.items.data[0].price.id
      const priceId = subscription.items?.data?.[0]?.price?.id || "";
      let plan = "";
      if (priceId === "price_1Qc9d9KSaqiJUYkjvqlvMfVs") {
        plan = "monthly";
      } else if (priceId === "price_1Qc9dKKSaqiJUYkjXu5QHgk8") {
        plan = "annual";
      } else {
        plan = "unknown"; // or throw an error if you only expect those two
      }

      // Step B: Retrieve the customer to get the email
      // "subscription.customer" is the Stripe customer ID (e.g. "cus_123")
      const customerId = subscription.customer as string;
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer || typeof customer.email !== "string") {
        console.error("No valid email found on Stripe customer:", customerId);
        return new NextResponse("No email on customer.", { status: 400 });
      }

      // Step C: Upsert the subscription
      await upsertSubscription({
        email: customer.email,
        plan,
        subscriptionId: subscription.id,
        // Payment intent might not exist in a subscription.updated event
        paymentIntentId: null,
      });

    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err: unknown) {
    console.error("Webhook handler error:", err);
    return new NextResponse(`Webhook error: ${String(err)}`, { status: 500 });
  }
}