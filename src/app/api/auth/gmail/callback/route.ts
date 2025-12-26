import { NextRequest, NextResponse } from 'next/server';
import { GmailClient } from '@/lib/gmail/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json(
      { error: `OAuth error: ${error}` },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: 'No authorization code received' },
      { status: 400 }
    );
  }

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Gmail credentials not configured' },
      { status: 500 }
    );
  }

  try {
    const client = new GmailClient({
      clientId,
      clientSecret,
      redirectUri: process.env.GMAIL_REDIRECT_URI || 'http://localhost:3333/api/auth/gmail/callback'
    });

    const tokens = await client.getTokensFromCode(code);

    // Return the refresh token to be added to .env
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gmail OAuth Success</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .token-box { background: #f0f0f0; padding: 15px; border-radius: 8px; word-break: break-all; margin: 20px 0; }
            code { background: #e0e0e0; padding: 2px 6px; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>Gmail OAuth Success!</h1>
          <p>Add this to your <code>.env</code> file:</p>
          <div class="token-box">
            <strong>GMAIL_REFRESH_TOKEN=</strong>${tokens.refreshToken}
          </div>
          <p>Then restart your dev server and test with <code>/api/test-gmail</code></p>
        </body>
      </html>
      `,
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.json(
      { error: 'Failed to exchange code for tokens', details: String(err) },
      { status: 500 }
    );
  }
}
