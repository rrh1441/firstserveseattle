import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Ensure the body parser is disabled for Stripe signature verification
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
    return new NextResponse("Missing Stripe signature header.", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, signingSecret);
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return new NextResponse("Webhook verification failed.", { status: 400 });
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
        console.error("Missing email or plan.");
        return new NextResponse("Missing email or plan.", { status: 400 });
      }

      // Step 1: List all users and find the one with the matching email
      const { data: users, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();

      if (listUsersError) {
        console.error("Error listing users:", listUsersError.message);
        return new NextResponse(`Error listing users: ${listUsersError.message}`, { status: 500 });
      }

      const existingUser = users?.find((user) => user.email === email);
      let userId = existingUser?.id;

      // Step 2: If the user doesn't exist, create a new user
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

        // Step 3: Send a magic link for the user to set up their account
        const { error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
          type: "magiclink",
          email,
          options: {
            redirectTo: "https://firstserveseattle.com/members/welcome",
          },
        });

        if (magicLinkError) {
          console.error("Error generating magic link:", magicLinkError.message);
        }
      }

      // Step 4: Upsert subscription details
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
              onConflict: ["user_id", "plan"],
            }
          );

        if (upsertError) {
          console.error("Error upserting subscription:", upsertError.message);
          return new NextResponse(`Error upserting subscription: ${upsertError.message}`, { status: 500 });
        }
      }

      return new NextResponse("Webhook handled successfully.", { status: 200 });
    }

    // If the event type is unhandled, return a 200 status
    return new NextResponse("Unhandled event type.", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}