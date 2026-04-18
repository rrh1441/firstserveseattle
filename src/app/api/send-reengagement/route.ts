import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resend } from '@/lib/resend/client';
import { emailTemplates } from '@/lib/resend/templates';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FROM_EMAIL = 'Ryan from First Serve Seattle <ryan@firstserveseattle.com>';

// POST: Send re-engagement emails to expired trial users
export async function POST(request: Request): Promise<NextResponse> {
  // Verify cron secret or admin access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = Math.floor(Date.now() / 1000);

    // Get expired trial subscribers (created since March 1, 2026)
    // who haven't converted to paid and haven't been sent a re-engagement email
    const marchFirst2026 = new Date('2026-03-01T00:00:00Z');

    const { data: expiredTrials, error: fetchError } = await supabaseAdmin
      .from('subscribers')
      .select('id, email, status, trial_end, created_at')
      .eq('status', 'trialing')
      .lt('trial_end', now)
      .gte('created_at', marchFirst2026.toISOString());

    if (fetchError) {
      console.error('[reengagement] Error fetching expired trials:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    console.log(`[reengagement] Found ${expiredTrials?.length || 0} expired trials`);

    if (!expiredTrials || expiredTrials.length === 0) {
      return NextResponse.json({ sent: 0, skipped: 0, message: 'No expired trials found' });
    }

    // Check which ones already received re-engagement email
    const subscriberEmails = expiredTrials.map(s => s.email);
    const { data: alreadySentLogs } = await supabaseAdmin
      .from('email_alert_logs')
      .select('email')
      .eq('email_type', 'reengagement')
      .in('email', subscriberEmails);

    const alreadySentSet = new Set(alreadySentLogs?.map(log => log.email) || []);
    console.log(`[reengagement] ${alreadySentSet.size} already received re-engagement email`);

    let sent = 0;
    let skipped = 0;

    for (const subscriber of expiredTrials) {
      // Skip if already sent re-engagement email
      if (alreadySentSet.has(subscriber.email)) {
        console.log(`[reengagement] Skipping ${subscriber.email} - already sent`);
        skipped++;
        continue;
      }

      // Generate email with subscriber's email for pre-filled checkout
      const emailContent = emailTemplates.trialExpiredReengagement(subscriber.email);

      try {
        if (!resend) {
          console.error('[reengagement] Resend client not configured');
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
          console.error(`[reengagement] Resend error for ${subscriber.email}:`, emailError);
          continue;
        }

        // Log the send to prevent duplicates
        const { error: logError } = await supabaseAdmin.from('email_alert_logs').insert({
          email: subscriber.email,
          courts_included: [],
          slots_included: 0,
          email_type: 'reengagement',
          resend_message_id: emailResult?.id || null,
        });

        if (logError) {
          console.error(`[reengagement] Failed to log send for ${subscriber.email}:`, logError);
        }

        console.log(`[reengagement] Sent to ${subscriber.email}`);
        sent++;
      } catch (err) {
        console.error(`[reengagement] Error sending to ${subscriber.email}:`, err);
      }
    }

    console.log(`[reengagement] Complete: ${sent} sent, ${skipped} skipped`);

    return NextResponse.json({ sent, skipped });

  } catch (error) {
    console.error('[reengagement] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Preview list of expired trials that would receive the email
export async function GET(request: Request): Promise<NextResponse> {
  // Verify cron secret or admin access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const marchFirst2026 = new Date('2026-03-01T00:00:00Z');

    // Get expired trial subscribers
    const { data: expiredTrials, error: fetchError } = await supabaseAdmin
      .from('subscribers')
      .select('id, email, status, trial_end, created_at')
      .eq('status', 'trialing')
      .lt('trial_end', now)
      .gte('created_at', marchFirst2026.toISOString());

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    // Check which ones already received re-engagement email
    const subscriberEmails = expiredTrials?.map(s => s.email) || [];
    const { data: alreadySentLogs } = await supabaseAdmin
      .from('email_alert_logs')
      .select('email')
      .eq('email_type', 'reengagement')
      .in('email', subscriberEmails);

    const alreadySentSet = new Set(alreadySentLogs?.map(log => log.email) || []);

    // Filter to only those who haven't been sent
    const pendingEmails = expiredTrials?.filter(s => !alreadySentSet.has(s.email)) || [];

    return NextResponse.json({
      total_expired: expiredTrials?.length || 0,
      already_sent: alreadySentSet.size,
      pending_to_send: pendingEmails.length,
      emails: pendingEmails.map(s => ({
        email: s.email,
        trial_ended: new Date(s.trial_end * 1000).toISOString(),
        signed_up: s.created_at,
      })),
    });

  } catch (error) {
    console.error('[reengagement] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
