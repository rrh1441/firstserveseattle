import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  try {
    const { plan } = await request.json();
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string;
    const stripeMonthlyPriceId = process.env.STRIPE_MONTHLY_PRICE_ID as string;
    const stripeAnnualPriceId = process.env.STRIPE_ANNUAL_PRICE_ID as string;

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
    });

    const priceId = plan === "monthly" ? stripeMonthlyPriceId : stripeAnnualPriceId;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Failed to create checkout session." }, { status: 500 });
  }
}