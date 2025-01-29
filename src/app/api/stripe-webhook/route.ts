import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Required for Next.js to avoid automatically parsing the body
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

  // Helper function to upsert subscription rows
  async function upsertSubscription(args: {
    email: string;
    plan: string;
    subscriptionId?: string | null;
    paymentIntentId?: string | null;
  }) {
    const { email, plan, subscriptionId, paymentIntentId } = args;

    // Insert or update based on email
    const { error: upsertErr } = await supabaseAdmin
      .from("subscribers")
      .upsert(
        {
          email,
          plan,
          stripe_subscription_id: subscriptionId,
          stripe_payment_intent: paymentIntentId,
          status: "active",
        },
        {
          onConflict: "email",
        }
      );

    if (upsertErr) {
      throw new Error(`Error upserting subscriber: ${upsertErr.message}`);
    }

    console.log(`Upserted subscription for user ${email}, plan=${plan}`);
  }

  try {
    // 5. Switch on event types
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email || "";
      const plan = session.metadata?.plan || "";
      const subscriptionId = (session.subscription as string) || null;
      const paymentIntentId = (session.payment_intent as string) || null;

      if (!email || !plan) {
        console.error("Missing email or plan in checkout.session:", session);
        return new NextResponse("Missing email/plan in session", { status: 400 });
      }

      await upsertSubscription({
        email,
        plan,
        subscriptionId,
        paymentIntentId,
      });

    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;

      // Figure out the plan from the price ID in subscription.items
      const priceId = subscription.items?.data?.[0]?.price?.id || "";
      let plan = "";
      if (priceId === "price_1Qc9d9KSaqiJUYkjvqlvMfVs") {
        plan = "monthly";
      } else if (priceId === "price_1Qc9dKKSaqiJUYkjXu5QHgk8") {
        plan = "annual";
      } else {
        plan = "unknown";
      }

      // Retrieve the full Customer object to get their email
      const customerId = subscription.customer as string;
      const customer = await stripe.customers.retrieve(customerId);

      // Type guard: check if it's a "deleted" customer or a full "Customer"
      if ((customer as Stripe.DeletedCustomer).deleted) {
        console.error("No valid email: this customer is deleted:", customerId);
        return new NextResponse("Customer is deleted, no email found.", { status: 400 });
      }

      // Now "customer" is definitely a Stripe.Customer (not deleted)
      const { email } = customer as Stripe.Customer;
      if (!email) {
        console.error("No valid email found on non-deleted customer:", customerId);
        return new NextResponse("No email on customer.", { status: 400 });
      }

      // Update subscription in database
      await upsertSubscription({
        email,
        plan,
        subscriptionId: subscription.id,
        paymentIntentId: null,
      });

    } else {
      // Optionally handle other events
      console.log(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err: unknown) {
    console.error("Webhook handler error:", err);
    return new NextResponse(`Webhook error: ${String(err)}`, { status: 500 });
  }
}