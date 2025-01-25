import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// We need this to ensure Next.js doesn't parse the body automatically.
// Stripe requires the raw body to validate the webhook signature.
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  // Initialize Stripe with your secret key
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
  });

  // Retrieve the Stripe webhook signing secret
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  // Get the raw body + signature for Stripe's verification
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("Missing Stripe signature header.");
    return new NextResponse("Missing Stripe signature header.", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, signingSecret);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? `Webhook signature verification failed: ${error.message}`
        : "Unknown error during signature verification.";
    console.error(errorMessage);
    return new NextResponse(errorMessage, { status: 400 });
  }

  // Initialize Supabase client with the service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const email = session.customer_details?.email;
        const plan = session.metadata?.plan;
        const subscriptionId = session.subscription as string | null;
        const paymentIntentId = session.payment_intent as string | null;

        if (!email || !plan) {
          console.error("Missing email or plan in the checkout session.");
          break;
        }

        // Check if a user already exists by email
        const {
          data: { users },
          error: listError,
        } = await supabaseAdmin.auth.admin.listUsers({ filter: `email.eq.${email}` });

        if (listError) {
          console.error("Error retrieving user:", listError.message);
          return new NextResponse(`Error retrieving user: ${listError.message}`, { status: 500 });
        }

        let userId: string | null = null;

        if (users && users.length > 0) {
          userId = users[0].id;
        } else {
          // Create a new user with the email if none exists
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: false,
          });

          if (createError) {
            console.error("Error creating user:", createError.message);
            return new NextResponse(createError.message, { status: 500 });
          }

          userId = newUser?.user?.id;

          // Generate and send a Magic Link for account setup
          const { data: magicLink, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email,
            options: {
              redirectTo: "https://firstserveseattle.com/members/welcome",
            },
          });

          if (magicLinkError) {
            console.error("Error generating magic link:", magicLinkError.message);
          } else {
            console.log("Magic link sent:", magicLink);
          }
        }

        if (userId) {
          // Upsert subscription information into your database
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
            console.error("Supabase upsert error:", upsertError.message);
            return new NextResponse(upsertError.message, { status: 500 });
          }
        }

        break;
      }

      // Handle other Stripe events as needed
      default:
        console.log(`Unhandled event type: ${event.type}`);
        break;
    }

    return new NextResponse("Event processed", { status: 200 });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error during webhook handling.";
    console.error("Webhook handler error:", errorMessage);
    return new NextResponse(errorMessage, { status: 500 });
  }
}