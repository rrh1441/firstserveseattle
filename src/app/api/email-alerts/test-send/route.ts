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

// Parse available_dates string to get slots for a specific date
function getSlotsForDate(availableDates: string | null, targetDate: string, startHour: number, endHour: number): string[] {
  if (!availableDates) return [];

  const slots: string[] = [];

  for (const line of availableDates.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith(targetDate)) continue;

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

// POST: Send a test alert to a specific email (bypasses hour/day checks)
export async function POST(request: Request): Promise<NextResponse> {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email, useTomorrowDate = false } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get subscriber
    const { data: subscriber, error: subError } = await supabaseAdmin
      .from('email_alert_subscribers')
      .select('*')
      .eq('email', email)
      .single();

    if (subError || !subscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    if (!subscriber.alerts_enabled) {
      return NextResponse.json({ error: 'Alerts are disabled for this subscriber' }, { status: 400 });
    }

    // Get current date or tomorrow's date
    const now = new Date();
    const ptTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));

    let targetDate: Date;
    if (useTomorrowDate) {
      targetDate = new Date(ptTime);
      targetDate.setDate(targetDate.getDate() + 1);
    } else {
      targetDate = ptTime;
    }
    const targetDateStr = targetDate.toISOString().slice(0, 10);

    console.log(`[test-send] Sending test alert to ${email} for date ${targetDateStr}`);

    // Check if user is a paid subscriber
    const { data: paidSubscriber } = await supabaseAdmin
      .from('subscribers')
      .select('status')
      .eq('email', email)
      .eq('status', 'paid')
      .single();

    const isPaidMember = !!paidSubscriber;
    console.log(`[test-send] User ${email} isPaidMember: ${isPaidMember}`);

    // Get all court data
    const { data: allCourts, error: courtsError } = await supabaseAdmin
      .from('tennis_courts')
      .select('id, title, address, google_map_url, available_dates');

    if (courtsError) {
      console.error('[test-send] Error fetching courts:', courtsError);
      return NextResponse.json({ error: 'Failed to fetch courts' }, { status: 500 });
    }

    const courtsMap = new Map<number, Court>();
    for (const court of allCourts || []) {
      courtsMap.set(court.id, court);
    }

    // Get availability for their selected courts
    const availableCourts: Array<{ title: string; address: string; slots: string[]; mapsUrl: string }> = [];

    for (const courtId of subscriber.selected_courts) {
      const court = courtsMap.get(courtId);
      if (!court) continue;

      const slots = getSlotsForDate(
        court.available_dates,
        targetDateStr,
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

    // If no available courts, still send a test with a message
    if (availableCourts.length === 0) {
      // Add a placeholder to show the email would work
      return NextResponse.json({
        success: false,
        message: `No available slots found for ${targetDateStr}. The selected courts (${subscriber.selected_courts.join(', ')}) don't have availability within your preferred hours (${subscriber.preferred_start_hour}:00 - ${subscriber.preferred_end_hour}:00).`,
        subscriber: {
          email: subscriber.email,
          selected_courts: subscriber.selected_courts,
          preferred_hours: `${subscriber.preferred_start_hour}:00 - ${subscriber.preferred_end_hour}:00`,
        },
        courts_checked: subscriber.selected_courts.map((id: number) => {
          const court = courtsMap.get(id);
          return {
            id,
            title: court?.title || 'Unknown',
            available_dates: court?.available_dates || 'None',
          };
        }),
      });
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
      subscriber.email,
      isPaidMember
    );

    // Modify subject to indicate it's a test
    const testSubject = `[TEST] ${emailContent.subject}${useTomorrowDate ? ` (for ${targetDateStr})` : ''}`;

    if (!resend) {
      return NextResponse.json({ error: 'Resend client not configured' }, { status: 500 });
    }

    // Send email via Resend
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: subscriber.email,
      subject: testSubject,
      html: emailContent.html,
    });

    if (emailError) {
      console.error(`[test-send] Resend error for ${subscriber.email}:`, emailError);
      return NextResponse.json({ error: 'Failed to send email', details: emailError }, { status: 500 });
    }

    // Log the test send (but mark it as test)
    await supabaseAdmin.from('email_alert_logs').insert({
      subscriber_id: subscriber.id,
      email: subscriber.email,
      courts_included: availableCourts.map((_, i) => subscriber.selected_courts[i]),
      slots_included: availableCourts.reduce((sum, c) => sum + c.slots.length, 0),
      email_type: 'test_alert',
      resend_message_id: emailResult?.id || null,
    });

    console.log(`[test-send] Sent test alert to ${subscriber.email}: ${availableCourts.length} courts`);

    return NextResponse.json({
      success: true,
      message: `Test alert sent to ${subscriber.email}`,
      date_checked: targetDateStr,
      courts_with_availability: availableCourts.length,
      total_slots: availableCourts.reduce((sum, c) => sum + c.slots.length, 0),
      is_paid_member: isPaidMember,
      resend_id: emailResult?.id,
    });

  } catch (error) {
    console.error('[test-send] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
