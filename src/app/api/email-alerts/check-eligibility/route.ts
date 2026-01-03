import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get client IP from request headers
function getClientIp(headersList: Headers): string {
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return headersList.get('x-real-ip') ||
         headersList.get('cf-connecting-ip') ||
         'unknown';
}

export interface EligibilityResponse {
  eligible: boolean;
  reason?: 'ip_daily' | 'ip_weekly' | 'ip_monthly' | 'fingerprint';
}

export async function POST(request: Request): Promise<NextResponse<EligibilityResponse>> {
  try {
    const headersList = await headers();
    const clientIp = getClientIp(headersList);

    const body = await request.json();
    const { fingerprint } = body as { fingerprint?: string };

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Check IP daily limit (3/day)
    const { count: dailyCount } = await supabaseAdmin
      .from('signup_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', clientIp)
      .eq('blocked', false)
      .gte('created_at', oneDayAgo.toISOString());

    if ((dailyCount ?? 0) >= 3) {
      return NextResponse.json({ eligible: false, reason: 'ip_daily' });
    }

    // Check IP weekly limit (4/week)
    const { count: weeklyCount } = await supabaseAdmin
      .from('signup_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', clientIp)
      .eq('blocked', false)
      .gte('created_at', oneWeekAgo.toISOString());

    if ((weeklyCount ?? 0) >= 4) {
      return NextResponse.json({ eligible: false, reason: 'ip_weekly' });
    }

    // Check IP monthly limit (5/month)
    const { count: monthlyCount } = await supabaseAdmin
      .from('signup_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', clientIp)
      .eq('blocked', false)
      .gte('created_at', oneMonthAgo.toISOString());

    if ((monthlyCount ?? 0) >= 5) {
      return NextResponse.json({ eligible: false, reason: 'ip_monthly' });
    }

    // Check fingerprint limit (1/month)
    if (fingerprint) {
      const { count: fpCount } = await supabaseAdmin
        .from('signup_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('fingerprint', fingerprint)
        .eq('blocked', false)
        .gte('created_at', oneMonthAgo.toISOString());

      if ((fpCount ?? 0) >= 1) {
        return NextResponse.json({ eligible: false, reason: 'fingerprint' });
      }
    }

    return NextResponse.json({ eligible: true });

  } catch (error) {
    console.error('Error checking eligibility:', error);
    // On error, allow (fail open) - actual signup will catch abuse
    return NextResponse.json({ eligible: true });
  }
}
