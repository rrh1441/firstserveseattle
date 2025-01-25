import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// We need this to prevent Next.js from parsing the body automatically
// Stripe requires the raw body to validate the webhook signature
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  // 1. Initialize Stripe with your secret key
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
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

        // Get email and plan from the session
        const email = session.customer_details?.email ?? null;
        const plan = session.metadata?.plan ?? null;

        // Get subscription/payment IDs
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

        // --- 5a) Create or retrieve the user by email ---
        
        // 1. Check if a user already exists with that email
        const { data: users, error: getEmailErr } = await supabaseAdmin.auth.admin.listUsers({
          filter: {
            email: email
          }
        });

        if (getEmailErr) {
          console.error("Error retrieving user by email:", getEmailErr.message);
          return new NextResponse(`Error retrieving user: ${getEmailErr.message}`, { status: 500 });
        }

        let userId: string | null = null;
        const existingUser = users?.users[0];
        
        if (existingUser) {
          // Found an existing user with this email
          userId = existingUser.id;
        } else {
          // 2. Create a new user
          const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true, // Changed to true since we're auto-confirming
            user_metadata: {
              has_completed_onboarding: false
            }
          });

          if (createErr) {
            console.error("Error creating user:", createErr.message);
            return new NextResponse(createErr.message, { status: 500 });
          }
          userId = newUser?.user?.id ?? null;

          // 3. Generate a password reset link instead of magic link for better UX
          if (userId) {
            const { error: resetErr } = await supabaseAdmin.auth.admin.generateLink({
              type: "recovery",
              email,
              options: {
                redirectTo: "https://firstserveseattle.com/members/welcome"
              }
            });

            if (resetErr) {
              console.error("Error generating password reset link:", resetErr.message);
              // Not a showstopper for storing subscription, so we continue
            }
          }
        }

        // --- 5b) Upsert the subscription in your subscriptions table ---
        if (userId) {
          const { error: subErr } = await supabaseAdmin
            .from("subscriptions")
            .upsert(
              {
                user_id: userId,
                plan,
                stripe_subscription_id: subscriptionId,
                stripe_payment_intent_id: paymentIntentId,
                status: "active",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              {
                onConflict: "user_id,plan"
              }
            );

          if (subErr) {
            console.error("Supabase subscription upsert error:", subErr.message);
            return new NextResponse(subErr.message, { status: 500 });
          }
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update subscription status to cancelled
        const { error: updateErr } = await supabaseAdmin
          .from("subscriptions")
          .update({ 
            status: "cancelled",
            updated_at: new Date().toISOString()
          })
          .eq("stripe_subscription_id", subscription.id);

        if (updateErr) {
          console.error("Error updating cancelled subscription:", updateErr.message);
          return new NextResponse(updateErr.message, { status: 500 });
        }
        
        break;
      }

      // Handle other event types as needed
      default:
        console.log(`Unhandled event type: ${event.type}`);
        break;
    }

    return new NextResponse("Event processed successfully", { status: 200 });
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