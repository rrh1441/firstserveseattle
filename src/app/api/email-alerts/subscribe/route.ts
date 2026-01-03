import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { GmailEmailService } from '@/lib/gmail/email-service';
import type { SubscribeRequest, SubscribeResponse } from '@/lib/emailAlerts/types';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Get client IP from request headers
function getClientIp(headersList: Headers): string {
  // Vercel/Cloudflare headers
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return headersList.get('x-real-ip') ||
         headersList.get('cf-connecting-ip') ||
         'unknown';
}

// Check rate limits for IP and fingerprint
async function checkRateLimits(ip: string, fingerprint: string | undefined): Promise<{ allowed: boolean; reason: string | null }> {
  // Check IP limits: 3/day, 4/week, 5/month
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Count IP attempts
  const { count: dailyCount } = await supabaseAdmin
    .from('signup_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .eq('blocked', false)
    .gte('created_at', oneDayAgo.toISOString());

  if ((dailyCount ?? 0) >= 3) {
    return { allowed: false, reason: 'Too many signups today. Please try again tomorrow.' };
  }

  const { count: weeklyCount } = await supabaseAdmin
    .from('signup_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .eq('blocked', false)
    .gte('created_at', oneWeekAgo.toISOString());

  if ((weeklyCount ?? 0) >= 4) {
    return { allowed: false, reason: 'Weekly signup limit reached. Please try again next week.' };
  }

  const { count: monthlyCount } = await supabaseAdmin
    .from('signup_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .eq('blocked', false)
    .gte('created_at', oneMonthAgo.toISOString());

  if ((monthlyCount ?? 0) >= 5) {
    return { allowed: false, reason: 'Monthly signup limit reached. Please try again next month.' };
  }

  // Check fingerprint limit: 1/month
  if (fingerprint) {
    const { count: fpCount } = await supabaseAdmin
      .from('signup_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('fingerprint', fingerprint)
      .eq('blocked', false)
      .gte('created_at', oneMonthAgo.toISOString());

    if ((fpCount ?? 0) >= 1) {
      return { allowed: false, reason: 'You have already signed up for a free trial this month.' };
    }
  }

  return { allowed: true, reason: null };
}

// Log signup attempt
async function logSignupAttempt(ip: string, fingerprint: string | undefined, email: string, blocked: boolean) {
  await supabaseAdmin
    .from('signup_attempts')
    .insert({
      ip_address: ip,
      fingerprint: fingerprint || null,
      email,
      blocked,
    });
}

export async function POST(request: Request): Promise<NextResponse<SubscribeResponse>> {
  try {
    const headersList = await headers();
    const clientIp = getClientIp(headersList);

    const body: SubscribeRequest = await request.json();
    const { email, name, abGroup, fingerprint } = body;

    // Validate email
    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check rate limits before proceeding
    const rateLimit = await checkRateLimits(clientIp, fingerprint);
    if (!rateLimit.allowed) {
      // Log blocked attempt
      await logSignupAttempt(clientIp, fingerprint, normalizedEmail, true);
      return NextResponse.json(
        { success: false, error: rateLimit.reason || 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      );
    }

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

    // Log successful signup attempt (don't block response)
    logSignupAttempt(clientIp, fingerprint, normalizedEmail, false)
      .catch(err => console.error('Failed to log signup attempt:', err));

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
