import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  try {
    // 1. Parse data from request body (only plan now, no user_id)
    const { plan } = await request.json();

    // 2. Load environment variables
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string;
    const stripeMonthlyPriceId = process.env.STRIPE_MONTHLY_PRICE_ID as string;
    const stripeAnnualPriceId = process.env.STRIPE_ANNUAL_PRICE_ID as string;

    // 3. Initialize Stripe with your desired API version (cast to avoid TS error)
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
    });

    // 4. Determine which Price ID to use
    let priceId: string;
    switch (plan) {
      case "monthly":
        priceId = stripeMonthlyPriceId;
        break;
      case "annual":
        priceId = stripeAnnualPriceId;
        break;
      default:
        throw new Error("Invalid plan");
    }

    // 5. Create a Checkout Session
    // Both monthly and annual are recurring, so mode: "subscription"
    // customer_creation: "always" ensures Stripe creates a Customer record for every session,
    // capturing the user's email at checkout.
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
      customer_creation: "always",
      metadata: {
        plan,
      },
    });

    // 6. Return the session URL to the client
    return NextResponse.json({ url: session.url });
  } catch (unknownError: unknown) {
    let message = "Error creating checkout session.";
    if (unknownError instanceof Error) {
      message = unknownError.message;
      console.error("Error creating checkout session:", message);
    } else {
      console.error("Unknown error type:", unknownError);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}