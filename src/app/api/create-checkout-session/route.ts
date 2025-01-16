// src/app/api/create-checkout-session/route.ts

import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(request: Request) {
  try {
    // 1. Parse data from request body
    // e.g., plan = 'monthly' or 'annual', user_id = 'uuid-from-supabase'
    const { plan, user_id } = await request.json()

    // 2. Load environment variables
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string
    const stripeMonthlyPriceId = process.env.STRIPE_MONTHLY_PRICE_ID as string
    const stripeAnnualPriceId = process.env.STRIPE_ANNUAL_PRICE_ID as string

    // Initialize Stripe (with your preferred API version)
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-08-16",
    })

    // 3. Determine which Price ID to use
    let priceId: string
    switch (plan) {
      case "monthly":
        priceId = stripeMonthlyPriceId
        break
      case "annual":
        priceId = stripeAnnualPriceId
        break
      default:
        throw new Error("Invalid plan")
    }

    // 4. Create a Checkout Session
    // Both monthly and annual are recurring, so mode: "subscription"
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `https://firstserveseattle.com/tennis-courts?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://firstserveseattle.com/tennis-courts?canceled=true`,
      metadata: {
        user_id,
        plan,
      },
    })

    // 5. Return the session URL to the client
    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
