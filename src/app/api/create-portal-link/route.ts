import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role key for secure DB reads
)

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the user
    const accessToken = req.headers.get("Authorization")?.replace("Bearer ", "")
    if (!accessToken) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    // Validate the session and get user
    const {
      data: { user },
      error: sessionError
    } = await supabaseAdmin.auth.getUser(accessToken)
    if (sessionError || !user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    // 2. Look up the subscription ID from your 'subscribers' table
    const { data: subscriberData, error } = await supabaseAdmin
      .from("subscribers")
      .select("stripe_subscription_id")
      .eq("id", user.id)
      .single()

    if (error || !subscriberData?.stripe_subscription_id) {
      return NextResponse.json({ error: "No subscription ID found" }, { status: 404 })
    }

    // 3. Fetch the subscription from Stripe to get the customer ID
    const subscription = await stripe.subscriptions.retrieve(subscriberData.stripe_subscription_id)
    if (!subscription.customer) {
      return NextResponse.json({ error: "No customer attached to subscription" }, { status: 400 })
    }

    const customerId = subscription.customer as string

    // 4. Create a Billing Portal Session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: "https://yourdomain.com/members" // Where to send them back after management
    })

    // 5. Return the portal URL to the client
    return NextResponse.json({ url: portalSession.url })
  } catch (err: any) {
    console.error("Portal error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}