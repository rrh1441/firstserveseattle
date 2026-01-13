import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '7');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Basic event counts
    const { data: eventCounts, error: eventError } = await supabaseAdmin
      .from('event_logs')
      .select('event')
      .gte('timestamp', startDate.toISOString());

    if (eventError) throw eventError;

    // Daily page views
    const { data: dailyViews, error: dailyError } = await supabaseAdmin
      .from('event_logs')
      .select('timestamp, event')
      .gte('timestamp', startDate.toISOString())
      .like('event', '%page_view');

    if (dailyError) throw dailyError;

    // Conversion funnel
    const { data: funnelData, error: funnelError } = await supabaseAdmin
      .from('event_logs')
      .select('event, timestamp, metadata')
      .gte('timestamp', startDate.toISOString())
      .in('event', [
        'landing:page_view', 
        'landing:cta_button_click',
        'courts:page_view', 
        'courts:paywall_hit',
        'signup:page_view',
        'billing:checkout_success_page_view'
      ]);

    if (funnelError) throw funnelError;

    // Process data for charts
    const eventSummary = eventCounts?.reduce((acc: Record<string, number>, item) => {
      acc[item.event] = (acc[item.event] || 0) + 1;
      return acc;
    }, {}) || {};

    // Group daily views by date
    const dailyViewsSummary = dailyViews?.reduce((acc: Record<string, number>, item) => {
      const date = new Date(item.timestamp).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {}) || {};

    // Funnel conversion rates
    const funnelSummary = funnelData?.reduce((acc: Record<string, number>, item) => {
      acc[item.event] = (acc[item.event] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      eventSummary,
      dailyViewsSummary,
      funnelSummary,
      totalEvents: eventCounts?.length || 0,
      dateRange: { days, startDate: startDate.toISOString() }
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

 