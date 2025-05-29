/* Strict-mode Node script: back-fills any missing stripe ids.
 *
 *   • Finds rows where subscription id OR customer id is NULL
 *   • Uses Stripe search by e-mail when both are missing
 *   • Uses subscription → customer when subscription id exists
 *   • Updates the row with both ids (UPSERT by primary key)
 *
 * Usage (one-off):
 *   STRIPE_SECRET_KEY=sk_live_… \
 *   DATABASE_URL=postgres://user:pass@host:5432/db \
 *   pnpm ts-node --transpile-only scripts/backfillStripeIds.ts
 */

import Stripe from 'stripe';
import { Pool } from 'pg';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
});

const db = new Pool({ connectionString: process.env.DATABASE_URL });

const row = z.object({
  id:                     z.string().uuid(),
  email:                  z.string().email(),
  stripe_subscription_id: z.string().nullable(),
  stripe_customer_id:     z.string().nullable(),
});
type Row = z.infer<typeof row>;

async function main() {
  const { rows } = await db.query<Row>(`
    SELECT id, email, stripe_subscription_id, stripe_customer_id
    FROM   public.subscribers
    WHERE  stripe_customer_id IS NULL
       OR  stripe_subscription_id IS NULL
  `);

  console.info(`Need to back-fill ${rows.length} row(s).`);

  for (const r of rows) {
    try {
      let custId  = r.stripe_customer_id ?? null;
      let subId   = r.stripe_subscription_id ?? null;

      // Case 1 – we have subscription id, missing customer id
      if (subId && !custId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        custId    = sub.customer as string;
      }

      // Case 2 – we have neither id
      if (!custId && !subId) {
        const search = await stripe.customers.search({
          query: `email:"${r.email}"`,
          limit: 1,
        });
        if (search.data.length === 0) {
          console.warn(`No Stripe customer for ${r.email}, skip.`);
          continue;
        }
        custId = search.data[0].id;

        const subs = await stripe.subscriptions.list({
          customer: custId,
          limit: 1,
        });
        if (subs.data.length === 0) {
          console.warn(`No subscription for ${r.email}, skip.`);
          continue;
        }
        subId  = subs.data[0].id;
      }

      if (!custId || !subId) {
        console.warn(`Could not determine both ids for ${r.email}, skip.`);
        continue;
      }

      await db.query(
        `UPDATE public.subscribers
            SET stripe_customer_id     = $1,
                stripe_subscription_id = $2,
                updated_at             = NOW()
          WHERE id = $3`,
        [custId, subId, r.id],
      );
      console.info(`✓ ${r.email}  →  cust=${custId}  sub=${subId}`);
    } catch (err) {
      console.error(`✗ ${r.email}`, (err as Error).message);
    }
  }

  await db.end();
}

main().catch((e) => {
  console.error('fatal', e);
  process.exit(1);
});
