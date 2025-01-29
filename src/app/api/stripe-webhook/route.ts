import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Required for Next.js API Route config
export const config = {
  api: {
    bodyParser: false,
  },
  runtime: 'edge',
};

export async function POST(request: NextRequest) {
  let event: Stripe.Event;

  // 1️⃣ Read raw body + signature
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    console.error("❌ Missing Stripe signature header");
    return new NextResponse("Missing Stripe signature header.", { status: 400 });
  }

  // 2️⃣ Initialize Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
  });

  // 3️⃣ Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return new NextResponse("Invalid Stripe signature.", { status: 400 });
  }

  // 4️⃣ Initialize Supabase Admin
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  );

  // 5️⃣ Upsert Function (Now Uses Email as Primary Key)
  async function upsertSubscription({
    email,
    plan,
    subscriptionId,
    paymentIntentId,
    status,
  }: {
    email: string;
    plan: string;
    subscriptionId?: string | null;
    paymentIntentId?: string | null;
    status: string;
  }) {
    console.log(`🔄 Upserting subscription: ${email}, Plan: ${plan}, Status: ${status}`);

    // Insert or update based on email
    const { error } = await supabaseAdmin
      .from("subscribers")
      .upsert(
        {
          email, // ✅ PRIMARY KEY
          plan,
          stripe_subscription_id: subscriptionId,
          stripe_payment_intent: paymentIntentId,
          status, // Can be active, canceled, etc.
        },
        { onConflict: "email" } // ✅ NOW USING EMAIL AS THE KEY
      );

    if (error) {
      console.error("❌ Supabase Upsert Error:", error);
      throw new Error(`Error upserting subscriber: ${error.message}`);
    }

    console.log(`✅ Successfully upserted ${email} with plan ${plan}`);
  }

  try {
    console.log(`🔔 Processing Stripe event: ${event.type}`);

    // 6️⃣ Handle Events from Stripe
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_details?.email || "";
      const plan = session.metadata?.plan || "";
      const subscriptionId = (session.subscription as string) || null;
      const paymentIntentId = (session.payment_intent as string) || null;

      console.log("✅ Checkout completed:", { email, plan, subscriptionId, paymentIntentId });

      if (!email || !plan) {
        console.error("❌ Missing email or plan in checkout.session:", session);
        return new NextResponse("Missing email/plan in session", { status: 400 });
      }

      await upsertSubscription({
        email,
        plan,
        subscriptionId,
        paymentIntentId,
        status: "active",
      });

    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      console.log("🔄 Subscription updated:", subscription.id);

      // Get Plan from Stripe Price ID
      const priceId = subscription.items?.data?.[0]?.price?.id || "";
      const plan = priceId === "price_1Qc9d9KSaqiJUYkjvqlvMfVs" ? "monthly" : "annual";

      // Retrieve customer email
      const customerId = subscription.customer as string;
      const customer = await stripe.customers.retrieve(customerId);
      if ((customer as Stripe.DeletedCustomer).deleted) {
        console.error("❌ Customer deleted:", customerId);
        return new NextResponse("Customer is deleted.", { status: 400 });
      }
      const { email } = customer as Stripe.Customer;
      if (!email) {
        console.error("❌ No email found for customer:", customerId);
        return new NextResponse("No email on customer.", { status: 400 });
      }

      await upsertSubscription({
        email,
        plan,
        subscriptionId: subscription.id,
        paymentIntentId: null,
        status: subscription.status,
      });

    } else if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      console.log("💳 Invoice paid:", invoice.id);

      const email = invoice.customer_email;
      if (!email) {
        console.error("❌ No email found on invoice:", invoice.id);
        return new NextResponse("No email on invoice.", { status: 400 });
      }

      const priceId = invoice.lines.data[0]?.price?.id || "";
      const plan = priceId === "price_1Qc9d9KSaqiJUYkjvqlvMfVs" ? "monthly" : "annual";

      await upsertSubscription({
        email,
        plan,
        subscriptionId: invoice.subscription as string || null,
        paymentIntentId: invoice.payment_intent as string || null,
        status: "active",
      });

    } else {
      console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (err: unknown) {
    console.error("❌ Webhook handler error:", err);
    return new NextResponse(`Webhook error: ${String(err)}`, { status: 500 });
  }
}