import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id parameter' },
        { status: 400 }
      );
    }
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    const email = session.customer_details?.email || session.customer_email;
    
    if (!email) {
      return NextResponse.json(
        { error: 'No email found in session' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ email });
  } catch (error) {
    console.error('Error fetching checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session details' },
      { status: 500 }
    );
  }
} 