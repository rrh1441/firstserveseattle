import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// We need this config so Next.js doesn't parse the body automatically.
// Stripe requires the raw body to validate the webhook signature.
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  // 1. Initialize Stripe with your secret key
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    // Cast to avoid TS literal type error:
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
  });

  // 2. Retrieve the Stripe webhook signing secret from your .env
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  // 3. Get the raw body for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("Missing Stripe signature header.");
    return new NextResponse("Missing Stripe signature header.", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, signingSecret);
  } catch (unknownError: unknown) {
    let message = "Webhook signature verification failed.";
    if (unknownError instanceof Error) {
      message = `Webhook signature verification failed: ${unknownError.message}`;
    } else {
      console.error("Unknown error type thrown:", unknownError);
    }
    return new NextResponse(message, { status: 400 });
  }

  // 4. Initialize Supabase (server use only)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 5. Handle the Stripe event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Retrieve metadata set during Checkout
        const userId = session.metadata?.user_id ?? null;
        const plan = session.metadata?.plan ?? null;

        // For subscription-based checkouts
        const subscriptionId = session.subscription
          ? (session.subscription as string)
          : null;

        // For one-time payments
        const paymentIntentId = session.payment_intent
          ? (session.payment_intent as string)
          : null;

        // Insert or update subscription/plan data
        if (userId && plan) {
          const { error } = await supabase
            .from("subscriptions")
            .upsert(
              {
                user_id: userId,
                plan,
                stripe_subscription_id: subscriptionId,
                stripe_payment_intent_id: paymentIntentId,
                status: "active",
              },
              {
                onConflict: ["user_id", "plan"], // prevent duplicates
              }
            );

          if (error) {
            console.error("Supabase insert/upsert error:", error.message);
            return new NextResponse(error.message, { status: 500 });
          }
        }

        break;
      }

      // Handle other event types as needed
      default:
        console.log(`Unhandled event type: ${event.type}`);
        break;
    }

    // Return a 200 to indicate successful handling
    return new NextResponse("Event received", { status: 200 });
  } catch (unknownError: unknown) {
    let message = "Webhook handler error.";
    if (unknownError instanceof Error) {
      message = unknownError.message;
      console.error("Webhook handler error:", message);
    } else {
      console.error("Unknown error type thrown:", unknownError);
    }
    return new NextResponse(message, { status: 500 });
  }
}
