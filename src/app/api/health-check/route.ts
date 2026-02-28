/**
 * Daily Health Check API Route
 *
 * Gathers comprehensive health metrics and sends an email report.
 * Called by Vercel cron at 7:00 AM PT daily.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';

// ─────────────────────────────  TYPES  ────────────────────────────────
interface HealthStatus {
  status: 'healthy' | 'warning' | 'error';
  message: string;
}

interface CourtDataHealth {
  status: HealthStatus;
  totalCourts: number;
  courtsWithTodayData: number;
  courtsWithTomorrowData: number;
  staleCourts: number;
}

interface VisitorAnalytics {
  status: HealthStatus;
  pageViews24h: number;
  uniqueVisitors24h: number;
  paywallHits24h: number;
  signups24h: number;
  previousDayViews: number;
  changePercent: number;
}

interface StripeMetrics {
  accountName: string;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  monthlyMRR: number;
  annualMRR: number;
  totalMRR: number;
  newCustomers24h: number;
  failedPayments24h: number;
  cancellations24h: number;
  trialConversions24h: number;
  trialUsersWithoutCards: number;
}

interface EmailAlertHealth {
  status: HealthStatus;
  activeSubscribers: number;
  emailsSent24h: number;
  totalEmailsSent: number;
}

interface HealthReport {
  generatedAt: string;
  overallStatus: 'healthy' | 'warning' | 'error';
  courtData: CourtDataHealth;
  stripeMetrics: StripeMetrics[];
  emailAlerts: EmailAlertHealth;
  alerts: string[];
}

// ─────────────────────────────  CLIENTS  ──────────────────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const oldStripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
    })
  : null;

const newStripe = process.env.STRIPE_SECRET_KEY_NEW
  ? new Stripe(process.env.STRIPE_SECRET_KEY_NEW, {
      apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
    })
  : null;

const mailer = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  : null;

// ─────────────────────────  HEALTH CHECKS  ────────────────────────────

// Get date in Pacific Time (matches how courts store dates)
function getDatePacific(daysOffset = 0): string {
  const date = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function checkCourtDataFreshness(): Promise<CourtDataHealth> {
  try {
    const today = getDatePacific(0);
    const tomorrow = getDatePacific(1);

    const { data: courts, error } = await supabaseAdmin
      .from('tennis_courts')
      .select('id, title, available_dates')
      .not('available_dates', 'is', null);

    if (error) throw error;

    const totalCourts = courts?.length || 0;
    let courtsWithTodayData = 0;
    let courtsWithTomorrowData = 0;

    for (const court of courts || []) {
      if (court.available_dates?.includes(today)) courtsWithTodayData++;
      if (court.available_dates?.includes(tomorrow)) courtsWithTomorrowData++;
    }

    const staleCourts = totalCourts - courtsWithTodayData;
    const stalePercent = totalCourts > 0 ? (staleCourts / totalCourts) * 100 : 0;

    let status: HealthStatus;
    if (stalePercent > 50) {
      status = { status: 'error', message: `${stalePercent.toFixed(0)}% of courts have stale data` };
    } else if (stalePercent > 20) {
      status = { status: 'warning', message: `${stalePercent.toFixed(0)}% of courts have stale data` };
    } else {
      status = { status: 'healthy', message: `${courtsWithTodayData}/${totalCourts} courts have today's data` };
    }

    return { status, totalCourts, courtsWithTodayData, courtsWithTomorrowData, staleCourts };
  } catch (error) {
    return {
      status: { status: 'error', message: `Failed to check court data: ${error}` },
      totalCourts: 0, courtsWithTodayData: 0, courtsWithTomorrowData: 0, staleCourts: 0,
    };
  }
}

async function checkVisitorAnalytics(): Promise<VisitorAnalytics> {
  try {
    // Use current time, looking back 24h and 48h
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const { data: last24h } = await supabaseAdmin
      .from('event_logs')
      .select('event, metadata')
      .gte('timestamp', yesterday.toISOString());

    const { data: prev24h } = await supabaseAdmin
      .from('event_logs')
      .select('event')
      .gte('timestamp', twoDaysAgo.toISOString())
      .lt('timestamp', yesterday.toISOString());

    const pageViews24h = last24h?.filter(e => e.event.includes('page_view')).length || 0;
    const fingerprints = new Set(last24h?.map(e => (e.metadata as Record<string, unknown>)?.fingerprint).filter(Boolean));
    const uniqueVisitors24h = fingerprints.size;
    const paywallHits24h = last24h?.filter(e => e.event === 'courts:paywall_hit').length || 0;
    const signups24h = last24h?.filter(e => e.event === 'billing:checkout_success_page_view').length || 0;
    const previousDayViews = prev24h?.filter(e => e.event.includes('page_view')).length || 0;

    const changePercent = previousDayViews > 0 ? ((pageViews24h - previousDayViews) / previousDayViews) * 100 : 0;

    let status: HealthStatus;
    if (pageViews24h === 0) {
      status = { status: 'error', message: 'No page views in 24h' };
    } else if (changePercent < -50) {
      status = { status: 'warning', message: `Traffic down ${Math.abs(changePercent).toFixed(0)}%` };
    } else {
      status = { status: 'healthy', message: `${pageViews24h} views (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(0)}%)` };
    }

    return { status, pageViews24h, uniqueVisitors24h, paywallHits24h, signups24h, previousDayViews, changePercent };
  } catch (error) {
    return {
      status: { status: 'error', message: `Failed: ${error}` },
      pageViews24h: 0, uniqueVisitors24h: 0, paywallHits24h: 0, signups24h: 0, previousDayViews: 0, changePercent: 0,
    };
  }
}

async function checkStripeMetrics(stripe: Stripe, accountName: string): Promise<StripeMetrics> {
  try {
    const yesterday = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);

    const [activeSubs, trialingSubs, canceledSubs, recentCustomers, recentCharges] = await Promise.all([
      stripe.subscriptions.list({ status: 'active', limit: 100 }),
      stripe.subscriptions.list({ status: 'trialing', limit: 100 }),
      stripe.subscriptions.list({ status: 'canceled', limit: 100 }),
      stripe.customers.list({ created: { gte: yesterday }, limit: 100 }),
      stripe.charges.list({ created: { gte: yesterday }, limit: 100 }),
    ]);

    let monthlyMRR = 0;
    let annualMRR = 0;

    [...activeSubs.data, ...trialingSubs.data].forEach(sub => {
      const amount = sub.items.data[0]?.price.unit_amount || 0;
      const interval = sub.items.data[0]?.price.recurring?.interval;
      if (interval === 'month') monthlyMRR += amount / 100;
      else if (interval === 'year') annualMRR += (amount / 100) / 12;
    });

    const failedPayments24h = recentCharges.data.filter(c => c.status === 'failed').length;

    // Cancellations in last 24h
    const cancellations24h = canceledSubs.data.filter(sub =>
      sub.canceled_at && sub.canceled_at >= yesterday
    ).length;

    // Trial conversions: active subs that started as trials and converted in last 24h
    const trialConversions24h = activeSubs.data.filter(sub => {
      // Had a trial and trial ended in last 24h (meaning they just converted)
      const trialEnd = sub.trial_end;
      return trialEnd && trialEnd >= yesterday && trialEnd <= Math.floor(Date.now() / 1000);
    }).length;

    // Check trial users without cards
    let trialUsersWithoutCards = 0;
    for (const sub of trialingSubs.data.slice(0, 10)) { // Limit to avoid rate limits
      try {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: sub.customer as string,
          type: 'card',
        });
        if (paymentMethods.data.length === 0) trialUsersWithoutCards++;
      } catch { /* ignore */ }
    }

    return {
      accountName,
      activeSubscriptions: activeSubs.data.length,
      trialingSubscriptions: trialingSubs.data.length,
      monthlyMRR, annualMRR, totalMRR: monthlyMRR + annualMRR,
      newCustomers24h: recentCustomers.data.length,
      failedPayments24h,
      cancellations24h,
      trialConversions24h,
      trialUsersWithoutCards,
    };
  } catch (error) {
    console.error(`Stripe error (${accountName}):`, error);
    return {
      accountName, activeSubscriptions: 0, trialingSubscriptions: 0,
      monthlyMRR: 0, annualMRR: 0, totalMRR: 0,
      newCustomers24h: 0, failedPayments24h: 0, cancellations24h: 0,
      trialConversions24h: 0, trialUsersWithoutCards: 0,
    };
  }
}

async function checkEmailAlertHealth(): Promise<EmailAlertHealth> {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [{ count: activeCount }, { count: sent24h }, { count: totalSent }] = await Promise.all([
      supabaseAdmin
        .from('email_alert_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('alerts_enabled', true)
        .is('unsubscribed_at', null)
        .gt('extension_expires_at', new Date().toISOString()),
      supabaseAdmin
        .from('email_alert_logs')
        .select('*', { count: 'exact', head: true })
        .gte('sent_at', yesterday),
      supabaseAdmin
        .from('email_alert_logs')
        .select('*', { count: 'exact', head: true }),
    ]);

    const activeSubscribers = activeCount || 0;
    const emailsSent24h = sent24h || 0;
    const totalEmailsSent = totalSent || 0;

    let status: HealthStatus;
    if (activeSubscribers === 0) {
      status = { status: 'warning', message: 'No active subscribers' };
    } else {
      status = { status: 'healthy', message: `${emailsSent24h} emails to ${activeSubscribers} subs` };
    }

    return { status, activeSubscribers, emailsSent24h, totalEmailsSent };
  } catch (error) {
    return {
      status: { status: 'error', message: `Failed: ${error}` },
      activeSubscribers: 0, emailsSent24h: 0, totalEmailsSent: 0,
    };
  }
}

// ─────────────────────────  REPORT GENERATION  ────────────────────────

function generateHtmlReport(report: HealthReport): string {
  const badge = (s: 'healthy' | 'warning' | 'error') => {
    const c = { healthy: ['#d1fae5', '#065f46'], warning: ['#fef3c7', '#92400e'], error: ['#fee2e2', '#991b1b'] }[s];
    return `<span style="background:${c[0]};color:${c[1]};padding:4px 12px;border-radius:12px;font-weight:bold;font-size:14px;">${s.toUpperCase()}</span>`;
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background:#f8fafc;}
    .container{max-width:700px;margin:0 auto;background:#fff;}
    .header{background:#0c372b;padding:32px;color:#fff;}
    .header h1{margin:0;font-size:24px;} .header p{color:#86efac;margin:8px 0 0 0;font-size:14px;}
    .section{padding:24px 32px;border-bottom:1px solid #e5e7eb;}
    .section-title{font-size:18px;font-weight:bold;color:#111827;margin:0 0 16px 0;display:flex;align-items:center;gap:12px;}
    .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
    .metric{background:#f9fafb;padding:16px;border-radius:8px;}
    .metric-label{font-size:12px;color:#6b7280;text-transform:uppercase;margin:0 0 4px 0;}
    .metric-value{font-size:24px;font-weight:bold;color:#111827;margin:0;}
    .metric-sub{font-size:12px;color:#6b7280;margin:4px 0 0 0;}
    .alert{background:#fef3c7;border:1px solid #f59e0b;padding:16px;border-radius:8px;margin-bottom:12px;}
    .alert.error{background:#fee2e2;border-color:#ef4444;}
    .alert p{margin:0;font-size:14px;color:#92400e;} .alert.error p{color:#991b1b;}
    .footer{background:#111827;padding:24px 32px;} .footer p{color:#9ca3af;margin:0;font-size:12px;}
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Daily Health Check</h1>
    <p>${new Date(report.generatedAt).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'full', timeStyle: 'short' })}</p>
  </div>

  <div class="section">
    <div class="section-title">Overall ${badge(report.overallStatus)}</div>
    ${report.alerts.length > 0
      ? report.alerts.map(a => `<div class="alert ${report.overallStatus === 'error' ? 'error' : ''}"><p>${a}</p></div>`).join('')
      : '<p style="color:#059669;margin:0;">All systems operating normally.</p>'}
  </div>

  <div class="section">
    <div class="section-title">Court Data ${badge(report.courtData.status.status)}</div>
    <div class="grid">
      <div class="metric"><p class="metric-label">Total Courts</p><p class="metric-value">${report.courtData.totalCourts}</p></div>
      <div class="metric"><p class="metric-label">With Today's Data</p><p class="metric-value">${report.courtData.courtsWithTodayData}</p></div>
      <div class="metric"><p class="metric-label">With Tomorrow's Data</p><p class="metric-value">${report.courtData.courtsWithTomorrowData}</p></div>
      <div class="metric"><p class="metric-label">Stale</p><p class="metric-value">${report.courtData.staleCourts}</p></div>
    </div>
  </div>


  ${report.stripeMetrics.map(s => `
  <div class="section">
    <div class="section-title">Stripe: ${s.accountName}</div>
    <div class="grid">
      <div class="metric"><p class="metric-label">Active</p><p class="metric-value">${s.activeSubscriptions}</p></div>
      <div class="metric"><p class="metric-label">Trialing</p><p class="metric-value">${s.trialingSubscriptions}</p>${s.trialUsersWithoutCards > 0 ? `<p class="metric-sub" style="color:#f59e0b;">${s.trialUsersWithoutCards} no card</p>` : ''}</div>
      <div class="metric"><p class="metric-label">MRR</p><p class="metric-value" style="color:#059669;">$${s.totalMRR.toFixed(2)}</p></div>
      <div class="metric"><p class="metric-label">New (24h)</p><p class="metric-value">${s.newCustomers24h}</p></div>
      <div class="metric"><p class="metric-label">Conversions (24h)</p><p class="metric-value" style="color:#059669;">${s.trialConversions24h}</p></div>
      <div class="metric"><p class="metric-label">Cancellations (24h)</p><p class="metric-value" style="color:${s.cancellations24h > 0 ? '#ef4444' : '#111827'};">${s.cancellations24h}</p></div>
      <div class="metric"><p class="metric-label">Failed Payments (24h)</p><p class="metric-value" style="color:${s.failedPayments24h > 0 ? '#ef4444' : '#111827'};">${s.failedPayments24h}</p></div>
    </div>
  </div>
  `).join('')}

  <div class="section">
    <div class="section-title">Email Alerts ${badge(report.emailAlerts.status.status)}</div>
    <div class="grid">
      <div class="metric"><p class="metric-label">Active Subscribers</p><p class="metric-value">${report.emailAlerts.activeSubscribers}</p></div>
      <div class="metric"><p class="metric-label">Sent (24h)</p><p class="metric-value">${report.emailAlerts.emailsSent24h}</p></div>
    </div>
  </div>

  <div class="footer"><p>First Serve Seattle Health Check</p></div>
</div>
</body>
</html>`;
}

async function sendEmailReport(html: string, report: HealthReport): Promise<void> {
  if (!mailer) {
    console.error('Gmail not configured');
    return;
  }

  const to = process.env.HEALTH_CHECK_EMAIL || process.env.GMAIL_USER;
  const emoji = { healthy: '✅', warning: '⚠️', error: '🚨' }[report.overallStatus];
  const subject = `${emoji} Health Check - ${report.overallStatus.toUpperCase()} - ${new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' })}`;

  await mailer.sendMail({
    from: `First Serve Seattle <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log(`Health check email sent to ${to}`);
}

// ─────────────────────────────  HANDLER  ──────────────────────────────

export async function GET() {
  console.log('Running daily health check...');
  const alerts: string[] = [];

  // Run checks
  const [courtData, emailAlerts] = await Promise.all([
    checkCourtDataFreshness(),
    checkEmailAlertHealth(),
  ]);

  // Stripe checks
  const stripeMetrics: StripeMetrics[] = [];
  if (oldStripe) stripeMetrics.push(await checkStripeMetrics(oldStripe, 'SimpleApps'));
  if (newStripe) stripeMetrics.push(await checkStripeMetrics(newStripe, 'First Serve Seattle'));

  // Collect alerts
  if (courtData.status.status !== 'healthy') alerts.push(`Court Data: ${courtData.status.message}`);
  if (emailAlerts.status.status === 'error') alerts.push(`Email Alerts: ${emailAlerts.status.message}`);
  for (const s of stripeMetrics) {
    if (s.failedPayments24h > 0) alerts.push(`Stripe (${s.accountName}): ${s.failedPayments24h} failed payments`);
    if (s.cancellations24h > 0) alerts.push(`Stripe (${s.accountName}): ${s.cancellations24h} cancellation(s)`);
  }

  // Overall status
  const statuses = [courtData.status.status, emailAlerts.status.status];
  let overallStatus: 'healthy' | 'warning' | 'error' = 'healthy';
  if (statuses.includes('error')) overallStatus = 'error';
  else if (statuses.includes('warning')) overallStatus = 'warning';
  // Also flag if there are cancellations or failed payments
  if (stripeMetrics.some(s => s.failedPayments24h > 0)) overallStatus = 'warning';

  const report: HealthReport = {
    generatedAt: new Date().toISOString(),
    overallStatus,
    courtData,
    stripeMetrics,
    emailAlerts,
    alerts,
  };

  // Send email
  const html = generateHtmlReport(report);
  await sendEmailReport(html, report);

  return NextResponse.json({
    status: overallStatus,
    alerts,
    courtData: { total: courtData.totalCourts, fresh: courtData.courtsWithTodayData },
    stripe: stripeMetrics.map(s => ({
      account: s.accountName,
      mrr: s.totalMRR,
      active: s.activeSubscriptions,
      trialing: s.trialingSubscriptions,
      conversions24h: s.trialConversions24h,
      cancellations24h: s.cancellations24h,
      failedPayments24h: s.failedPayments24h,
    })),
    emailAlerts: { subscribers: emailAlerts.activeSubscribers, sent24h: emailAlerts.emailsSent24h },
  });
}
