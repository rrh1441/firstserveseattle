import { NextResponse } from 'next/server';
import { GmailClient } from '@/lib/gmail/client';

export async function GET() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Gmail credentials not configured' },
      { status: 500 }
    );
  }

  const client = new GmailClient({
    clientId,
    clientSecret,
    redirectUri: process.env.GMAIL_REDIRECT_URI || 'http://localhost:3333/api/auth/gmail/callback'
  });

  const authUrl = client.getAuthUrl();

  return NextResponse.redirect(authUrl);
}
