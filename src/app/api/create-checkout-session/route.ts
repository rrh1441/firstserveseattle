/* src/app/api/create-portal-link/route.ts */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Use the API version required by the installed Stripe library
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia', // <<<< UPDATED API Version
});

// Ensure Supabase Admin client uses appropriate keys from environment variables
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Ensure this env var is set in Vercel
);

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the user via Authorization header
    const accessToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!accessToken) {
      console.error("Create Portal Link Error: No token provided");
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    // Validate the session and get user details using the admin client
    const { data: { user }, error: sessionError } = await supabaseAdmin.auth.getUser(accessToken);

    if (sessionError || !user) {
      console.error("Create Portal Link Error: Invalid session.", sessionError);
      // Avoid leaking detailed error messages in production responses
      return NextResponse.json({ error: "Invalid session or user not found." }, { status: 401 });
    }

    // Log the user ID being processed
    console.log(`Create Portal Link: Processing request for user ID: ${user.id}`);

    // 2. Look up the Stripe Customer ID from your 'subscribers' table (or directly if stored)
    // Assuming stripe_customer_id is stored on subscribers table for direct lookup
    // If only subscription ID is stored, keep the original logic
    // Let's assume you have customer_id for simplicity here, adjust if needed:
    /*
    const { data: subscriberData, error: dbError } = await supabaseAdmin
      .from("subscribers")
      .select("stripe_customer_id") // Assuming you store customer ID
      .eq("id", user.id)
      .single();

    if (dbError || !subscriberData?.stripe_customer_id) {
      console.error(`Create Portal Link Error: No Stripe customer ID found for user ${user.id}:`, dbError);
      return NextResponse.json({ error: "Subscription details not found." }, { status: 404 });
    }
    const customerId = subscriberData.stripe_customer_id;
    */

    // --- ALTERNATIVE: Original Logic if only subscription_id is stored ---
    const { data: subscriberData, error: subIdError } = await supabaseAdmin
       .from("subscribers")
       .select("stripe_subscription_id") // Fetch subscription ID
       .eq("id", user.id)
       .single();

    if (subIdError || !subscriberData?.stripe_subscription_id) {
       console.error(`Create Portal Link Error: No subscription ID found for user ${user.id}:`, subIdError);
       return NextResponse.json({ error: "Active subscription not found." }, { status: 404 });
    }
    const subscriptionId = subscriberData.stripe_subscription_id;
    console.log(`Create Portal Link: Found subscription ID ${subscriptionId} for user ${user.id}`);

    // Fetch the subscription from Stripe to get the customer ID
    let customerId: string | null = null;
    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (!subscription.customer) {
            throw new Error("No customer ID attached to subscription.");
        }
        customerId = subscription.customer as string; // Assuming customer is always a string ID here
        console.log(`Create Portal Link: Retrieved customer ID ${customerId} from subscription ${subscriptionId}`);
    } catch (stripeError) {
        console.error(`Create Portal Link Error: Failed to retrieve subscription ${subscriptionId} from Stripe:`, stripeError);
        return NextResponse.json({ error: "Could not retrieve subscription details from payment provider." }, { status: 500 });
    }
    // --- End of Alternative Logic ---


    // 3. Create a Billing Portal Session
    console.log(`Create Portal Link: Creating portal session for customer ID: ${customerId}`);
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: "https://firstserveseattle.com/members", // Ensure this URL matches your site and Stripe settings
    });
    console.log(`Create Portal Link: Portal session created successfully for customer ID: ${customerId}`);

    // 4. Return the portal URL to the client
    return NextResponse.json({ url: portalSession.url });

  } catch (err: unknown) {
    console.error("Create Portal Link Error: Unhandled exception:", err);
    // Avoid sending detailed internal errors to the client
    return NextResponse.json({ error: "An error occurred while creating the customer portal link." }, { status: 500 });
  }
}