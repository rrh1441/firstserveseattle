import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Use your updated API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the user
    const accessToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!accessToken) {
      console.error("No token provided");
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    // Validate the session and get user
    const { data: { user }, error: sessionError } = await supabaseAdmin.auth.getUser(accessToken);
    if (sessionError || !user) {
      console.error("Invalid session:", sessionError);
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // 2. Look up the subscription ID from your 'subscribers' table
    const { data: subscriberData, error } = await supabaseAdmin
      .from("subscribers")
      .select("stripe_subscription_id")
      .eq("id", user.id)
      .single();

    if (error || !subscriberData?.stripe_subscription_id) {
      console.error("No subscription ID found:", error);
      return NextResponse.json({ error: "No subscription ID found" }, { status: 404 });
    }

    console.log("Retrieved subscription id:", subscriberData.stripe_subscription_id);

    // 3. Fetch the subscription from Stripe to get the customer ID
    const subscription = await stripe.subscriptions.retrieve(subscriberData.stripe_subscription_id);
    console.log("Subscription retrieved:", subscription);
    if (!subscription.customer) {
      console.error("No customer attached to subscription");
      return NextResponse.json({ error: "No customer attached to subscription" }, { status: 400 });
    }

    const customerId = subscription.customer as string;
    console.log("Customer ID:", customerId);

    // 4. Create a Billing Portal Session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: "https://firstserveseattle.com/members", // Make sure this URL is allowed in your Stripe settings
    });
    console.log("Portal session created:", portalSession);

    // 5. Return the portal URL to the client
    return NextResponse.json({ url: portalSession.url });
  } catch (err: unknown) {
    console.error("Portal error:", err);
    let message = "An unknown error occurred.";
    if (err instanceof Error) {
      message = err.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}