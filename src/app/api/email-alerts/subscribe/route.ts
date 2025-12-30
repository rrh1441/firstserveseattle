import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GmailEmailService } from '@/lib/gmail/email-service';
import type { SubscribeRequest, SubscribeResponse } from '@/lib/emailAlerts/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request): Promise<NextResponse<SubscribeResponse>> {
  try {
    const body: SubscribeRequest = await request.json();
    const { email, name, abGroup } = body;

    // Validate email
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already a paid subscriber
    const { data: existingSubscriber } = await supabaseAdmin
      .from('subscribers')
      .select('id, status')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingSubscriber && ['active', 'trialing', 'paid'].includes(existingSubscriber.status)) {
      return NextResponse.json(
        { success: false, error: 'You already have an active subscription. Please sign in instead.' },
        { status: 400 }
      );
    }

    // Calculate extension expiration (7 days from now)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Check if email already has an alert subscription
    const { data: existingAlert } = await supabaseAdmin
      .from('email_alert_subscribers')
      .select('id, extension_expires_at, unsubscribe_token')
      .eq('email', normalizedEmail)
      .maybeSingle();

    let unsubscribeToken: string;

    if (existingAlert) {
      // Update existing record with new extension
      const { error: updateError } = await supabaseAdmin
        .from('email_alert_subscribers')
        .update({
          extension_granted_at: now.toISOString(),
          extension_expires_at: expiresAt.toISOString(),
          alerts_enabled: true,
          unsubscribed_at: null,
          name: name || existingAlert.id,
          ab_group: abGroup || null,
        })
        .eq('id', existingAlert.id);

      if (updateError) {
        console.error('Error updating email alert subscriber:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update subscription. Please try again.' },
          { status: 500 }
        );
      }

      unsubscribeToken = existingAlert.unsubscribe_token;
    } else {
      // Create new record
      const { data: newSubscriber, error: insertError } = await supabaseAdmin
        .from('email_alert_subscribers')
        .insert({
          email: normalizedEmail,
          name: name || null,
          extension_granted_at: now.toISOString(),
          extension_expires_at: expiresAt.toISOString(),
          ab_group: abGroup || null,
          source: 'paywall_extension',
        })
        .select('unsubscribe_token')
        .single();

      if (insertError || !newSubscriber) {
        console.error('Error creating email alert subscriber:', insertError);
        return NextResponse.json(
          { success: false, error: 'Failed to create subscription. Please try again.' },
          { status: 500 }
        );
      }

      unsubscribeToken = newSubscriber.unsubscribe_token;
    }

    // Build preferences URL with token
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://firstserveseattle.com';
    const preferencesUrl = `${baseUrl}/alerts?token=${unsubscribeToken}`;

    // Send welcome email (async, don't block response)
    GmailEmailService.sendAlertTrialWelcome(normalizedEmail, preferencesUrl, expiresAt)
      .then(result => {
        if (!result.success) {
          console.error('Failed to send alert trial welcome email:', result.error);
        }
      })
      .catch(err => console.error('Error sending alert trial welcome email:', err));

    return NextResponse.json({
      success: true,
      extensionExpiresAt: expiresAt.toISOString(),
      preferencesUrl,
      unsubscribeToken,
    });

  } catch (error) {
    console.error('Error in email-alerts/subscribe:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
