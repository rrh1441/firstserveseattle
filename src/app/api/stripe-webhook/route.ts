// src/app/api/stripe-webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// We need this so Next.js doesn't parse the body automatically.
// Stripe requires the raw body to validate the webhook signature.
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
  });

  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("Missing Stripe signature header.");
    return new NextResponse("Missing Stripe signature header.", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, signingSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return new NextResponse("Webhook signature verification failed.", { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const email = session.customer_details?.email;
      const plan = session.metadata?.plan;
      const subscriptionId = session.subscription as string | null;
      const paymentIntentId = session.payment_intent as string | null;

      if (!email || !plan) {
        console.error("Missing email or plan in checkout session.");
        return new NextResponse("Missing email or plan.", { status: 400 });
      }

      // --- Step 1: Look up the user ---
      const {
        data: { users },
        error: listError,
      } = await supabaseAdmin.auth.admin.listUsers({
        emailFilter: email,
      });

      if (listError) {
        console.error("Error retrieving user:", listError.message);
        return new NextResponse(`Error retrieving user: ${listError.message}`, { status: 500 });
      }

      let userId = users.length ? users[0].id : null;

      // --- Step 2: Create a new user if none exists ---
      if (!userId) {
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: false,
        });

        if (createError) {
          console.error("Error creating user:", createError.message);
          return new NextResponse(`Error creating user: ${createError.message}`, { status: 500 });
        }

        userId = newUser?.user?.id;

        // Send a Magic Link
        if (userId) {
          const { data: magicLinkData, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email,
            options: {
              redirectTo: "https://firstserveseattle.com",
            },
          });

          if (magicLinkError) {
            console.error("Error generating magic link:", magicLinkError.message);
          } else {
            console.log("Magic link sent:", magicLinkData);
          }
        }
      }

      // --- Step 3: Upsert Subscription ---
      if (userId) {
        const { error: upsertError } = await supabaseAdmin.from("subscriptions").upsert(
          {
            user_id: userId,
            plan,
            stripe_subscription_id: subscriptionId,
            stripe_payment_intent_id: paymentIntentId,
            status: "active",
          },
          {
            onConflict: "user_id,plan",
          }
        );

        if (upsertError) {
          console.error("Error upserting subscription:", upsertError.message);
          return new NextResponse(`Error saving subscription: ${upsertError.message}`, { status: 500 });
        }
      }

      console.log("Webhook handled successfully.");
      return new NextResponse("Webhook handled successfully.", { status: 200 });
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse("Event received.", { status: 200 });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return new NextResponse(`Webhook handler error: ${error}`, { status: 500 });
  }
}