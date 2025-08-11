import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    environment: {
      USE_NEW_STRIPE_ACCOUNT: process.env.USE_NEW_STRIPE_ACCOUNT,
      isTrue: process.env.USE_NEW_STRIPE_ACCOUNT === 'true',
      isTrueLowercase: process.env.USE_NEW_STRIPE_ACCOUNT?.toLowerCase() === 'true',
      hasNewKeys: {
        SECRET_KEY_NEW: !!process.env.STRIPE_SECRET_KEY_NEW,
        PUBLISHABLE_KEY_NEW: !!process.env.STRIPE_PUBLISHABLE_KEY_NEW,
        WEBHOOK_SECRET_NEW: !!process.env.STRIPE_WEBHOOK_SECRET_NEW,
        MONTHLY_PRICE_NEW: !!process.env.STRIPE_MONTHLY_PRICE_ID_NEW,
        ANNUAL_PRICE_NEW: !!process.env.STRIPE_ANNUAL_PRICE_ID_NEW,
        PROMO_CODE_NEW: !!process.env.STRIPE_FIFTY_OFF_PROMO_NEW,
        RESEND_KEY: !!process.env.RESEND_API_KEY,
      },
      activeAccount: process.env.USE_NEW_STRIPE_ACCOUNT === 'true' ? 'NEW' : 'OLD',
      timestamp: new Date().toISOString(),
    }
  });
}