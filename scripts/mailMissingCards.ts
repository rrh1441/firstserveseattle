/* scripts/mailMissingCards.ts
 *
 * Sends "add-payment-method" e-mails to any subscriber whose trial:
 *   • already ended  ── OR ──
 *   • ends in ≤ 24 h
 * and who still has no card on file.
 *
 * Optionally forces trial_end = now so Stripe invoices immediately.
 * Designed to be called by:
 *   • CLI:  pnpm mail-missing-cards          (via ts-node)
 *   • GitHub Actions: runs daily at 17:30 UTC (10:30 AM PT during DST)
 */

import Stripe from 'stripe';
import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import { z } from 'zod';

// ─────────────────────────────  ENV  ────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
});
const db = new Pool({ connectionString: process.env.DATABASE_URL });

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: Boolean(process.env.SMTP_SECURE ?? false), // true = 465
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

// ────────────────────────────  TYPES  ───────────────────────────────
const rowSchema = z.object({
  email: z.string().email(),
  stripe_customer_id: z.string().min(1),
  stripe_subscription_id: z.string().min(1),
  trial_end: z.number(), // epoch seconds
});
type Row = z.infer<typeof rowSchema>;

// ──────────────────────────  CONFIG  ────────────────────────────────
const FORCE_END_TRIAL = true; // shorten past-due trials
const LOOKAHEAD_HOURS = 24; // reminder window
const PORTAL_RETURN = 'https://firstserveseattle.com/billing-done';

// ───────────────────────  CORE HELPERS  ─────────────────────────────
async function fetchCandidates(): Promise<Row[]> {
  const { rows } = await db.query<{
    email: string;
    stripe_customer_id: string;
    stripe_subscription_id: string;
    trial_end: number;
  }>(`
    SELECT email,
           stripe_customer_id,
           stripe_subscription_id,
           trial_end
      FROM public.subscribers
     WHERE has_card = FALSE
       AND status   IN ('trialing','past_due')
       AND to_timestamp(trial_end) <= NOW() + INTERVAL '${LOOKAHEAD_HOURS} hours'
  `);
  return rows.map((r) => rowSchema.parse(r));
}

async function createPortalLink(customerId: string): Promise<string> {
  const { url } = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: PORTAL_RETURN,
  });
  return url;
}

async function endTrialNow(subId: string): Promise<void> {
  await stripe.subscriptions.update(subId, {
    trial_end: 'now',
    proration_behavior: 'none',
  });
}

async function sendEmail(
  to: string,
  link: string,
  trialEnd: number
): Promise<void> {
  const dateStr = new Date(trialEnd * 1e3).toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
  });

  await mailer.sendMail({
    from: 'FirstServeSeattle Billing <billing@firstserveseattle.com>',
    to,
    subject: 'Action required – add a payment method',
    text: `Your free trial ends on ${dateStr}. Add a card here: ${link}`,
    html: `<p>Your free trial ends on <strong>${dateStr}</strong>.</p>
              <p>Please <a href="${link}">add a card</a> to keep your subscription active.</p>`,
  });
  console.info(`✉️  Sent to ${to}`);
}

// ─────────────────────────  MAIN RUNNER  ────────────────────────────
export default async function run(): Promise<void> {
  const todo = await fetchCandidates();
  console.info(`Found ${todo.length} subscriber(s) without cards.`);

  for (const row of todo) {
    if (FORCE_END_TRIAL && row.trial_end * 1e3 < Date.now()) {
      await endTrialNow(row.stripe_subscription_id);
    }

    const portal = await createPortalLink(row.stripe_customer_id);
    await sendEmail(row.email, portal, row.trial_end);
  }

  await db.end();
  console.info('Done.');
}

// ───────── CLI entry-point (ts-node / node) ─────────
if (require.main === module) {
  run().catch((err) => {
    console.error('mailMissingCards failure:', err);
    process.exit(1);
  });
} 