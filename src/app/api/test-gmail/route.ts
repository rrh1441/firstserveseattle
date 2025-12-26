import { NextRequest, NextResponse } from 'next/server';
import { GmailEmailService } from '@/lib/gmail/email-service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const to = searchParams.get('to');
  const type = searchParams.get('type') || 'welcome';

  if (!to) {
    return NextResponse.json(
      { error: 'Missing "to" query parameter. Usage: /api/test-gmail?to=email@example.com&type=welcome' },
      { status: 400 }
    );
  }

  try {
    let result;

    switch (type) {
      case 'welcome':
        result = await GmailEmailService.sendWelcomeEmail(to, 'monthly');
        break;
      case 'payment':
        result = await GmailEmailService.sendPaymentSuccessEmail(to, 800, 'monthly');
        break;
      case 'failed':
        result = await GmailEmailService.sendPaymentFailedEmail(to);
        break;
      case 'cancelled':
        result = await GmailEmailService.sendCancellationEmail(to);
        break;
      default:
        return NextResponse.json(
          { error: `Unknown email type: ${type}. Valid types: welcome, payment, failed, cancelled` },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test ${type} email sent to ${to}`,
        data: result.data
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', details: String(error) },
      { status: 500 }
    );
  }
}
