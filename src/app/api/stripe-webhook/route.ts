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
  // 1. Initialize Stripe with your secret key
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    // If you must cast your version to avoid TS literal mismatch:
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
    let message = "Webhook signature verification failed.";
    if (unknownError instanceof Error) {
      message = `Webhook signature verification failed: ${unknownError.message}`;
    } else {
      console.error("Unknown error type thrown:", unknownError);
    }
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
        // Plan from metadata (e.g. 'monthly' or 'annual')
        const plan = session.metadata?.plan ?? null;

        // subscription/payment IDs
        const subscriptionId = session.subscription
          ? (session.subscription as string)
          : null;
        const paymentIntentId = session.payment_intent
          ? (session.payment_intent as string)
          : null;

        if (!email || !plan) {
          // Without an email or plan, we can't proceed
          console.error("Missing email or plan in checkout session.");
          break;
        }

        // --- 5a) Create or retrieve the user by email ---

        // 1. Check if a user already exists with that email
        const {
          data: { users },
          error: getEmailErr,
        } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1,
          query: email
        });

        if (getEmailErr) {
          console.error("Error retrieving user by email:", getEmailErr.message);
          return new NextResponse(`Error retrieving user: ${getEmailErr.message}`, { status: 500 });
        }

        let userId: string | null = null;
        const existingUser = users[0];
        
        if (existingUser) {
          // Found an existing user with this email
          userId = existingUser.id;
        } else {
          // 2. Create a new user
          const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email,
            // They won't have a password set yet
            email_confirm: false,
          });
          if (createErr) {
            console.error("Error creating user:", createErr.message);
            return new NextResponse(createErr.message, { status: 500 });
          }
          userId = newUser?.user?.id ?? null;

          // 3. Generate a Magic Link for them to finish account setup
          if (userId) {
            const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
              type: "magiclink",
              email,
              options: {
                // Where should they go after clicking the magic link?
                redirectTo: "https://firstserveseattle.com/members/welcome",
              },
            });
            if (linkErr) {
              console.error("Error generating magic link:", linkErr.message);
              // Not a showstopper for storing subscription, so we continue
            } else {
              console.log("Magic link generated and email sent:", linkData);
            }
          }
        }

        // --- 5b) Upsert the subscription in your own table ---
        if (userId) {
          // If you have a user_id column in 'subscriptions'
          const { error } = await supabaseAdmin
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
          if (error) {
            console.error("Supabase upsert error:", error.message);
            return new NextResponse(error.message, { status: 500 });
          }
        } else {
          // Alternatively, store by email if you prefer
          // e.g.:
          // const { error } = await supabaseAdmin
          //   .from("subscriptions")
          //   .upsert(
          //     {
          //       email,
          //       plan,
          //       stripe_subscription_id: subscriptionId,
          //       stripe_payment_intent_id: paymentIntentId,
          //       status: "active",
          //     },
          //     { onConflict: "email,plan" }
          //   );
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