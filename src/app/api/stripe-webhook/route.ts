// src/app/api/stripe-webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient, User } from "@supabase/supabase-js";

// We need this so Next.js doesn't parse the body automatically.
// Stripe requires the raw body to validate the webhook signature.
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  // 1. Initialize Stripe with your secret key
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
  });

  // 2. Retrieve the Stripe webhook signing secret
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  // 3. Get the raw body + signature for Stripe's verification
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
    const message =
      unknownError instanceof Error
        ? `Webhook signature verification failed: ${unknownError.message}`
        : "Webhook signature verification failed.";
    console.error(message, unknownError);
    return new NextResponse(message, { status: 400 });
  }

  // 4. Initialize Supabase with the service role key (server use only)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // 5. Handle the Stripe event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Stripe email from checkout
        const email = session.customer_details?.email ?? null;
        // Plan from metadata (e.g., 'monthly' or 'annual')
        const plan = session.metadata?.plan ?? null;

        // subscription/payment IDs
        const subscriptionId = session.subscription
          ? (session.subscription as string)
          : null;
        const paymentIntentId = session.payment_intent
          ? (session.payment_intent as string)
          : null;

        if (!email || !plan) {
          console.error("Missing email or plan in checkout session.");
          break;
        }

        // --- Step 1: Check if a user already exists ---
        const {
          data: { users },
          error: listUsersError,
        } = await supabaseAdmin.auth.admin.listUsers();

        if (listUsersError) {
          console.error("Error listing users:", listUsersError.message);
          return new NextResponse(`Error listing users: ${listUsersError.message}`, { status: 500 });
        }

        const existingUser = users?.find((user: User) => user.email === email);
        let userId = existingUser?.id;

        // --- Step 2: Create a new user if one doesn't exist ---
        if (!userId) {
          const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: false,
          });

          if (createUserError) {
            console.error("Error creating user:", createUserError.message);
            return new NextResponse(`Error creating user: ${createUserError.message}`, { status: 500 });
          }

          userId = newUser?.user?.id;

          // --- Step 3: Send a Magic Link for account setup ---
          if (userId) {
            const { data: linkData, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
              type: "magiclink",
              email,
              options: {
                redirectTo: "https://firstserveseattle.com", // Redirect to the main landing page
              },
            });

            if (magicLinkError) {
              console.error("Error generating magic link:", magicLinkError.message);
            } else {
              console.log("Magic link generated and email sent:", linkData);
            }
          }
        }

        // --- Step 4: Upsert the subscription in your database ---
        if (userId) {
          const { error: upsertError } = await supabaseAdmin
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
                onConflict: "user_id,plan",
              }
            );

          if (upsertError) {
            console.error("Supabase upsert error:", upsertError.message);
            return new NextResponse(upsertError.message, { status: 500 });
          }
        }

        break;
      }

      // Handle other event types as needed
      default:
        console.log(`Unhandled event type: ${event.type}`);
        break;
    }

    // Return 200 to indicate successful handling
    return new NextResponse("Event received", { status: 200 });
  } catch (unknownError: unknown) {
    const message =
      unknownError instanceof Error
        ? `Webhook handler error: ${unknownError.message}`
        : "Unknown error type.";
    console.error(message, unknownError);
    return new NextResponse(message, { status: 500 });
  }
}