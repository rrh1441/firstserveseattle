/* src/app/api/create-portal-link/route.ts */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Initialize both Stripe accounts to handle migrations
const stripeOld = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const stripeNew = process.env.STRIPE_SECRET_KEY_NEW
  ? new Stripe(process.env.STRIPE_SECRET_KEY_NEW, {
      apiVersion: '2025-02-24.acacia',
    })
  : null;

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


    // --- Logic to get Stripe Customer ID (Using Subscription ID lookup) ---
    const { data: subscriberData, error: subIdError } = await supabaseAdmin
       .from("subscribers")
       .select("stripe_subscription_id") // Fetch subscription ID
       .eq("email", user.email) // Match logged-in user's email
       .maybeSingle(); // Use maybeSingle in case user exists but has no subscription ID yet

    // Handle case where user has no subscription ID in your DB
    if (subIdError || !subscriberData?.stripe_subscription_id) {
       console.error(`Create Portal Link Error: No subscription ID found for user ${user.email}:`, subIdError);
       // It's possible the user exists but doesn't have an active/recorded subscription
       return NextResponse.json({ error: "Active subscription information not found." }, { status: 404 });
    }
    const subscriptionId = subscriberData.stripe_subscription_id;
    console.log(`Create Portal Link: Found subscription ID ${subscriptionId} for user ${user.email}`);

    // Try to fetch the subscription from both Stripe accounts
    let customerId: string | null = null;
    let stripeToUse: Stripe = stripeOld;
    
    // Check if we should prioritize the NEW account
    const useNewAccount = process.env.USE_NEW_STRIPE_ACCOUNT?.toLowerCase() === 'true';
    
    // Add detailed logging
    console.log(`🔍 Portal Debug:`, {
        USE_NEW_STRIPE_ACCOUNT: process.env.USE_NEW_STRIPE_ACCOUNT,
        useNewAccount,
        hasNewStripe: !!stripeNew,
        subscriptionId,
        userEmail: user.email
    });
    
    // Try NEW account first if configured and enabled
    if (useNewAccount && stripeNew) {
        console.log(`🎯 PORTAL: USE_NEW_STRIPE_ACCOUNT is TRUE, checking NEW account FIRST`);
        try {
            console.log(`🔍 PORTAL: Attempting to retrieve subscription ${subscriptionId} from NEW Stripe account`);
            const subscription = await stripeNew.subscriptions.retrieve(subscriptionId);
            if (!subscription.customer) {
                throw new Error("No customer ID attached to subscription.");
            }
            customerId = subscription.customer as string;
            stripeToUse = stripeNew;
            console.log(`✅ PORTAL: Found subscription in NEW account!`);
            console.log(`✅ PORTAL: Customer ID: ${customerId}`);
            console.log(`✅ PORTAL: Will use NEW Stripe instance for portal creation`);
            
            // Double-check the customer exists in NEW account
            try {
                const customer = await stripeNew.customers.retrieve(customerId);
                console.log(`✅ PORTAL: Confirmed customer exists in NEW account: ${customer.email}`);
            } catch {
                console.error(`⚠️ PORTAL: Customer ${customerId} NOT found in NEW account, but subscription exists!`);
            }
        } catch {
            console.log(`❌ PORTAL: Subscription ${subscriptionId} NOT found in NEW account`);
            console.log(`🔄 PORTAL: Falling back to OLD account...`);
            
            // Fall back to OLD account
            try {
                const subscription = await stripeOld.subscriptions.retrieve(subscriptionId);
                if (!subscription.customer) {
                    throw new Error("No customer ID attached to subscription.");
                }
                customerId = subscription.customer as string;
                stripeToUse = stripeOld;
                console.log(`⚠️ PORTAL: Found subscription in OLD account (fallback)`);
                console.log(`⚠️ PORTAL: Customer ID: ${customerId}`);
                console.log(`⚠️ PORTAL: Will use OLD Stripe instance for portal creation`);
            } catch {
                console.error(`💀 PORTAL: Subscription ${subscriptionId} not found in either Stripe account`);
                return NextResponse.json({ 
                    error: "Could not find subscription in payment system. Please contact support." 
                }, { status: 404 });
            }
        }
    } else {
        // Original logic: try OLD first, then NEW
        try {
            console.log(`Trying OLD Stripe account for subscription ${subscriptionId}`);
            const subscription = await stripeOld.subscriptions.retrieve(subscriptionId);
            if (!subscription.customer) {
                throw new Error("No customer ID attached to subscription.");
            }
            customerId = subscription.customer as string;
            stripeToUse = stripeOld;
            console.log(`Found in OLD account: customer ${customerId}`);
        } catch {
            console.log(`Subscription not found in OLD account, trying NEW...`);
            
            // Try the new account if available
            if (stripeNew) {
                try {
                    const subscription = await stripeNew.subscriptions.retrieve(subscriptionId);
                    if (!subscription.customer) {
                        throw new Error("No customer ID attached to subscription.");
                    }
                    customerId = subscription.customer as string;
                    stripeToUse = stripeNew;
                    console.log(`Found in NEW account: customer ${customerId}`);
                } catch {
                    console.error(`Subscription ${subscriptionId} not found in either Stripe account`);
                    return NextResponse.json({ 
                        error: "Could not find subscription in payment system. Please contact support." 
                    }, { status: 404 });
                }
            } else {
                console.error(`Subscription ${subscriptionId} not found and no NEW account configured`);
                return NextResponse.json({ 
                    error: "Could not retrieve subscription details from payment provider." 
                }, { status: 500 });
            }
        }
    }
    // --- End of Customer ID Logic ---


    // 3. Create a Billing Portal Session
    if (!customerId) {
         // This check is redundant if error handling above is correct, but added for safety
         console.error(`Create Portal Link Error: Customer ID is null or undefined before creating portal session for user ${user.email}`);
         return NextResponse.json({ error: "Could not determine customer details." }, { status: 500 });
    }
    
    // CRITICAL: Check if this customer ID exists in BOTH accounts
    console.log(`🔍 PORTAL: Checking if customer ${customerId} exists in both accounts...`);
    let existsInOld = false;
    let existsInNew = false;
    
    try {
        await stripeOld.customers.retrieve(customerId);
        existsInOld = true;
        console.log(`⚠️ PORTAL: Customer ${customerId} EXISTS in OLD account (Simple Apps)`);
    } catch {
        console.log(`✅ PORTAL: Customer ${customerId} does NOT exist in OLD account`);
    }
    
    if (stripeNew) {
        try {
            await stripeNew.customers.retrieve(customerId);
            existsInNew = true;
            console.log(`✅ PORTAL: Customer ${customerId} EXISTS in NEW account (First Serve Seattle)`);
        } catch {
            console.log(`❌ PORTAL: Customer ${customerId} does NOT exist in NEW account`);
        }
    }
    
    if (existsInOld && existsInNew) {
        console.log(`🚨 PORTAL: CRITICAL - Customer ${customerId} exists in BOTH accounts!`);
        console.log(`🚨 PORTAL: This can cause portal branding issues!`);
        console.log(`🚨 PORTAL: We will use: ${stripeToUse === stripeNew ? 'NEW account' : 'OLD account'}`);
    }

    console.log(`🚀 PORTAL: Creating portal session...`);
    console.log(`🚀 PORTAL: Customer ID: ${customerId}`);
    console.log(`🚀 PORTAL: Using Stripe instance: ${stripeToUse === stripeNew ? '✅ NEW ACCOUNT (First Serve Seattle)' : '⚠️ OLD ACCOUNT (Simple Apps)'}`);
    console.log(`🚀 PORTAL: Stripe instance check:`, {
        isNewInstance: stripeToUse === stripeNew,
        isOldInstance: stripeToUse === stripeOld,
        hasNewStripe: !!stripeNew,
        newKeyPrefix: process.env.STRIPE_SECRET_KEY_NEW?.substring(0, 20),
        oldKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 20)
    });
    
    const portalSession = await stripeToUse.billingPortal.sessions.create({
      customer: customerId,
      return_url: "https://firstserveseattle.com/members",
    });
    
    console.log(`✅ PORTAL: Portal session created successfully!`);
    console.log(`✅ PORTAL: Session ID: ${portalSession.id}`);
    console.log(`✅ PORTAL: Portal URL: ${portalSession.url}`);
    console.log(`✅ PORTAL: Account used: ${stripeToUse === stripeNew ? 'NEW (First Serve Seattle)' : 'OLD (Simple Apps)'}`);

    // 4. Return the portal URL to the client
    return NextResponse.json({ url: portalSession.url });

  } catch (err: unknown) {
    console.error("Create Portal Link Error: Unhandled exception:", err);
    // Avoid sending detailed internal errors to the client
    return NextResponse.json({ error: "An error occurred while creating the customer portal link." }, { status: 500 });
  }
}