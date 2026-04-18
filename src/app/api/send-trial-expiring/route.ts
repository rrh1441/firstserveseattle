import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resend } from '@/lib/resend/client';
import { emailTemplates } from '@/lib/resend/templates';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FROM_EMAIL = 'Ryan from First Serve Seattle <ryan@firstserveseattle.com>';

// POST: Send trial expiring emails to users whose trial ends in 24-48 hours
// Use ?test=email@example.com to send a test email to a specific address
export async function POST(request: Request): Promise<NextResponse> {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check for test mode
    const url = new URL(request.url);
    const testEmail = url.searchParams.get('test');

    if (testEmail) {
      // Send a single test email
      const emailContent = emailTemplates.alertTrialExpiring(testEmail);

      if (!resend) {
        return NextResponse.json({ error: 'Resend client not configured' }, { status: 500 });
      }

      const { data: emailResult, error: emailError } = await resend.emails.send({
        from: FROM_EMAIL,
        to: testEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      if (emailError) {
        console.error(`[trial-expiring] Test email error:`, emailError);
        return NextResponse.json({ error: 'Failed to send test email', details: emailError }, { status: 500 });
      }

      console.log(`[trial-expiring] Test email sent to ${testEmail}`);
      return NextResponse.json({
        test: true,
        sent_to: testEmail,
        subject: emailContent.subject,
        message_id: emailResult?.id
      });
    }

    const now = Math.floor(Date.now() / 1000);
    const in24Hours = now + (24 * 60 * 60);
    const in48Hours = now + (48 * 60 * 60);

    // Get trial subscribers whose trial ends between 24-48 hours from now
    // This means their trial ends "tomorrow"
    const { data: expiringTrials, error: fetchError } = await supabaseAdmin
      .from('subscribers')
      .select('id, email, status, trial_end')
      .eq('status', 'trialing')
      .gte('trial_end', in24Hours)
      .lte('trial_end', in48Hours);

    if (fetchError) {
      console.error('[trial-expiring] Error fetching expiring trials:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    console.log(`[trial-expiring] Found ${expiringTrials?.length || 0} trials expiring in 24-48 hours`);

    if (!expiringTrials || expiringTrials.length === 0) {
      return NextResponse.json({ sent: 0, skipped: 0, message: 'No expiring trials found' });
    }

    // Check which ones already received trial_expiring email
    const subscriberEmails = expiringTrials.map(s => s.email);
    const { data: alreadySentLogs } = await supabaseAdmin
      .from('email_alert_logs')
      .select('email')
      .eq('email_type', 'trial_expiring')
      .in('email', subscriberEmails);

    const alreadySentSet = new Set(alreadySentLogs?.map(log => log.email) || []);
    console.log(`[trial-expiring] ${alreadySentSet.size} already received trial_expiring email`);

    let sent = 0;
    let skipped = 0;

    for (const subscriber of expiringTrials) {
      // Skip if already sent trial_expiring email
      if (alreadySentSet.has(subscriber.email)) {
        console.log(`[trial-expiring] Skipping ${subscriber.email} - already sent`);
        skipped++;
        continue;
      }

      // Generate email with subscriber's email for pre-filled checkout
      const emailContent = emailTemplates.alertTrialExpiring(subscriber.email);

      try {
        if (!resend) {
          console.error('[trial-expiring] Resend client not configured');
          continue;
        }

        // Send email via Resend
        const { data: emailResult, error: emailError } = await resend.emails.send({
          from: FROM_EMAIL,
          to: subscriber.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });

        if (emailError) {
          console.error(`[trial-expiring] Resend error for ${subscriber.email}:`, emailError);
          continue;
        }

        // Log the send to prevent duplicates
        const { error: logError } = await supabaseAdmin.from('email_alert_logs').insert({
          email: subscriber.email,
          courts_included: [],
          slots_included: 0,
          email_type: 'trial_expiring',
          resend_message_id: emailResult?.id || null,
        });

        if (logError) {
          console.error(`[trial-expiring] Failed to log send for ${subscriber.email}:`, logError);
        }

        console.log(`[trial-expiring] Sent to ${subscriber.email}`);
        sent++;
      } catch (err) {
        console.error(`[trial-expiring] Error sending to ${subscriber.email}:`, err);
      }
    }

    console.log(`[trial-expiring] Complete: ${sent} sent, ${skipped} skipped`);

    return NextResponse.json({ sent, skipped });

  } catch (error) {
    console.error('[trial-expiring] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Preview list of expiring trials that would receive the email
export async function GET(request: Request): Promise<NextResponse> {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const in24Hours = now + (24 * 60 * 60);
    const in48Hours = now + (48 * 60 * 60);

    // Get trial subscribers whose trial ends between 24-48 hours from now
    const { data: expiringTrials, error: fetchError } = await supabaseAdmin
      .from('subscribers')
      .select('id, email, status, trial_end')
      .eq('status', 'trialing')
      .gte('trial_end', in24Hours)
      .lte('trial_end', in48Hours);

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    // Check which ones already received trial_expiring email
    const subscriberEmails = expiringTrials?.map(s => s.email) || [];
    const { data: alreadySentLogs } = await supabaseAdmin
      .from('email_alert_logs')
      .select('email')
      .eq('email_type', 'trial_expiring')
      .in('email', subscriberEmails);

    const alreadySentSet = new Set(alreadySentLogs?.map(log => log.email) || []);

    // Filter to only those who haven't been sent
    const pendingEmails = expiringTrials?.filter(s => !alreadySentSet.has(s.email)) || [];

    return NextResponse.json({
      total_expiring: expiringTrials?.length || 0,
      already_sent: alreadySentSet.size,
      pending_to_send: pendingEmails.length,
      emails: pendingEmails.map(s => ({
        email: s.email,
        trial_ends: new Date(s.trial_end * 1000).toISOString(),
      })),
    });

  } catch (error) {
    console.error('[trial-expiring] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
