import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Handle unsubscribe link click
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/alerts/unsubscribe?error=missing_token', request.url));
    }

    // Find subscriber by token
    const { data: subscriber, error: fetchError } = await supabaseAdmin
      .from('email_alert_subscribers')
      .select('id, email')
      .eq('unsubscribe_token', token)
      .single();

    if (fetchError || !subscriber) {
      return NextResponse.redirect(new URL('/alerts/unsubscribe?error=invalid_token', request.url));
    }

    // Update subscriber to disable alerts
    const { error: updateError } = await supabaseAdmin
      .from('email_alert_subscribers')
      .update({
        alerts_enabled: false,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('id', subscriber.id);

    if (updateError) {
      console.error('Error unsubscribing:', updateError);
      return NextResponse.redirect(new URL('/alerts/unsubscribe?error=update_failed', request.url));
    }

    // Redirect to success page
    return NextResponse.redirect(new URL('/alerts/unsubscribe?success=true', request.url));

  } catch (error) {
    console.error('Error in unsubscribe:', error);
    return NextResponse.redirect(new URL('/alerts/unsubscribe?error=unknown', request.url));
  }
}
