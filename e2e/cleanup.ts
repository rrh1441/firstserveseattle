import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function cleanupTestUser(email: string): Promise<void> {
  console.log(`🧹 Cleaning up test user: ${email}`);

  // 1. Find subscriber record
  const { data: subscriber } = await supabaseAdmin
    .from('subscribers')
    .select('user_id, stripe_customer_id, stripe_subscription_id')
    .eq('email', email)
    .single();

  // 2. Cancel Stripe subscription if exists
  if (subscriber?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(subscriber.stripe_subscription_id);
      console.log(`  ✓ Canceled subscription`);
    } catch {
      console.log(`  - Subscription already canceled`);
    }
  }

  // 3. Delete Stripe customer if exists
  if (subscriber?.stripe_customer_id) {
    try {
      await stripe.customers.del(subscriber.stripe_customer_id);
      console.log(`  ✓ Deleted Stripe customer`);
    } catch {
      console.log(`  - Stripe customer not found`);
    }
  }

  // 4. Delete subscriber record
  if (subscriber) {
    await supabaseAdmin.from('subscribers').delete().eq('email', email);
    console.log(`  ✓ Deleted subscriber record`);
  }

  // 5. Find and delete auth user
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const authUser = users?.users.find((u: { email?: string }) => u.email === email);
  if (authUser) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.id);
    console.log(`  ✓ Deleted auth user`);
  }

  console.log(`✅ Cleanup complete for: ${email}\n`);
}

export async function waitForSubscription(
  email: string,
  maxWaitMs = 60000
): Promise<boolean> {
  const startTime = Date.now();
  let delay = 2000;

  while (Date.now() - startTime < maxWaitMs) {
    const { data: subscriber } = await supabaseAdmin
      .from('subscribers')
      .select('status')
      .eq('email', email)
      .single();

    if (subscriber && ['active', 'trialing'].includes(subscriber.status)) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    delay = Math.min(delay * 1.5, 10000);
  }

  return false;
}

export async function getSubscription(email: string) {
  const { data } = await supabaseAdmin
    .from('subscribers')
    .select('*')
    .eq('email', email)
    .single();
  return data;
}
