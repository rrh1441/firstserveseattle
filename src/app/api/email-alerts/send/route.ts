import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resend } from '@/lib/resend/client';
import { emailTemplates } from '@/lib/resend/templates';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FROM_EMAIL = 'Ryan from First Serve Seattle <ryan@firstserveseattle.com>';

interface Court {
  id: number;
  title: string;
  address: string | null;
  google_map_url: string | null;
  available_dates: string | null;
}

interface Subscriber {
  id: string;
  email: string;
  selected_courts: number[];
  selected_days: number[];
  preferred_start_hour: number;
  preferred_end_hour: number;
  extension_expires_at: string;
  unsubscribe_token: string;
  emails_sent: number;
}

// Parse available_dates string to get slots for today
function getTodaySlots(availableDates: string | null, startHour: number, endHour: number): string[] {
  if (!availableDates) return [];

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const slots: string[] = [];

  for (const line of availableDates.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith(today)) continue;

    // Format: "2024-01-15 09:00:00-10:30:00"
    const timeMatch = trimmed.match(/\d{4}-\d{2}-\d{2}\s+(\d{2}):(\d{2}):\d{2}-(\d{2}):(\d{2}):\d{2}/);
    if (!timeMatch) continue;

    const slotStart = parseInt(timeMatch[1], 10);
    const slotEnd = parseInt(timeMatch[3], 10);

    // Check if slot is within user's preferred time window
    if (slotStart >= startHour && slotEnd <= endHour) {
      const formatHour = (h: number, m: string) => {
        const suffix = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 === 0 ? 12 : h % 12;
        return `${h12}:${m} ${suffix}`;
      };
      slots.push(`${formatHour(slotStart, timeMatch[2])}-${formatHour(slotEnd, timeMatch[4])}`);
    }
  }

  return slots;
}

// POST: Trigger sending alerts (called by cron job)
export async function POST(request: Request): Promise<NextResponse> {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get current hour in Pacific Time
    const now = new Date();
    const ptTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const currentHour = ptTime.getHours();
    const currentDOW = ptTime.getDay(); // 0 = Sunday

    console.log(`[send-alerts] Running for hour ${currentHour}, DOW ${currentDOW}`);

    // Get subscribers who should receive alerts now
    const { data: subscribers, error: subError } = await supabaseAdmin
      .from('email_alert_subscribers')
      .select('*')
      .eq('alerts_enabled', true)
      .is('unsubscribed_at', null)
      .gt('extension_expires_at', now.toISOString())
      .eq('alert_hour', currentHour)
      .contains('selected_days', [currentDOW]);

    if (subError) {
      console.error('[send-alerts] Error fetching subscribers:', subError);
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    console.log(`[send-alerts] Found ${subscribers?.length || 0} subscribers`);

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ sent: 0, skipped: 0 });
    }

    // Get all court data
    const { data: allCourts, error: courtsError } = await supabaseAdmin
      .from('tennis_courts')
      .select('id, title, address, google_map_url, available_dates');

    if (courtsError) {
      console.error('[send-alerts] Error fetching courts:', courtsError);
      return NextResponse.json({ error: 'Failed to fetch courts' }, { status: 500 });
    }

    const courtsMap = new Map<number, Court>();
    for (const court of allCourts || []) {
      courtsMap.set(court.id, court);
    }

    // Batch check: Get all subscribers who already received emails today (fixes N+1 query)
    const todayStart = new Date(ptTime);
    todayStart.setHours(0, 0, 0, 0);

    const subscriberIds = (subscribers as Subscriber[]).map(s => s.id);
    const { data: alreadySentLogs } = await supabaseAdmin
      .from('email_alert_logs')
      .select('subscriber_id')
      .eq('email_type', 'daily_alert')
      .gte('sent_at', todayStart.toISOString())
      .in('subscriber_id', subscriberIds);

    const alreadySentSet = new Set(alreadySentLogs?.map(log => log.subscriber_id) || []);
    console.log(`[send-alerts] ${alreadySentSet.size} subscribers already received emails today`);

    let sent = 0;
    let skipped = 0;

    for (const subscriber of subscribers as Subscriber[]) {
      // Check if already sent today (using pre-fetched Set instead of N+1 query)
      if (alreadySentSet.has(subscriber.id)) {
        console.log(`[send-alerts] Skipping ${subscriber.email} - already sent today`);
        skipped++;
        continue;
      }

      // Get availability for their selected courts
      const availableCourts: Array<{ title: string; address: string; slots: string[]; mapsUrl: string }> = [];

      for (const courtId of subscriber.selected_courts) {
        const court = courtsMap.get(courtId);
        if (!court) continue;

        const slots = getTodaySlots(
          court.available_dates,
          subscriber.preferred_start_hour,
          subscriber.preferred_end_hour
        );

        if (slots.length > 0) {
          availableCourts.push({
            title: court.title || 'Unknown Court',
            address: court.address || '',
            slots,
            mapsUrl: court.google_map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(court.address || '')}`,
          });
        }
      }

      // Skip if no available courts
      if (availableCourts.length === 0) {
        console.log(`[send-alerts] Skipping ${subscriber.email} - no available slots`);
        skipped++;
        continue;
      }

      // Calculate days remaining
      const expiresAt = new Date(subscriber.extension_expires_at);
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Build URLs
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://firstserveseattle.com';
      const preferencesUrl = `${baseUrl}/alerts?token=${subscriber.unsubscribe_token}`;
      const unsubscribeUrl = `${baseUrl}/api/email-alerts/unsubscribe?token=${subscriber.unsubscribe_token}`;

      // Generate email
      const emailContent = emailTemplates.dailyCourtAlert(
        availableCourts,
        daysRemaining,
        preferencesUrl,
        unsubscribeUrl,
        subscriber.email
      );

      try {
        if (!resend) {
          console.error('[send-alerts] Resend client not configured');
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
          console.error(`[send-alerts] Resend error for ${subscriber.email}:`, emailError);
          continue;
        }

        // Log the send
        await supabaseAdmin.from('email_alert_logs').insert({
          subscriber_id: subscriber.id,
          email: subscriber.email,
          courts_included: availableCourts.map((_, i) => subscriber.selected_courts[i]),
          slots_included: availableCourts.reduce((sum, c) => sum + c.slots.length, 0),
          email_type: 'daily_alert',
          resend_message_id: emailResult?.id || null,  // Gmail message ID
        });

        // Update subscriber stats
        await supabaseAdmin
          .from('email_alert_subscribers')
          .update({
            emails_sent: subscriber.emails_sent + 1,
            last_email_sent_at: new Date().toISOString(),
          })
          .eq('id', subscriber.id);

        console.log(`[send-alerts] Sent to ${subscriber.email}: ${availableCourts.length} courts`);
        sent++;
      } catch (err) {
        console.error(`[send-alerts] Error sending to ${subscriber.email}:`, err);
      }
    }

    console.log(`[send-alerts] Complete: ${sent} sent, ${skipped} skipped`);
    return NextResponse.json({ sent, skipped });

  } catch (error) {
    console.error('[send-alerts] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
