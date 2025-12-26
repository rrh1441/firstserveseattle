import { NextRequest, NextResponse } from 'next/server';
import { createGmailClient } from '@/lib/gmail/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '50');

  const gmail = createGmailClient();
  if (!gmail) {
    return NextResponse.json(
      { error: 'Gmail client not configured' },
      { status: 500 }
    );
  }

  try {
    const bounces = await gmail.getBounces(limit);

    return NextResponse.json({
      count: bounces.length,
      bounces: bounces.map(b => ({
        date: b.date,
        subject: b.subject,
        failedRecipient: b.failedRecipient,
        snippet: b.snippet.substring(0, 200)
      }))
    });
  } catch (error) {
    console.error('Error fetching bounces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bounces', details: String(error) },
      { status: 500 }
    );
  }
}
