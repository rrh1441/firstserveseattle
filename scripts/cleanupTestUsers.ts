import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import 'dotenv/config';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface CleanupOptions {
  dryRun?: boolean;
}

async function deleteUserByEmail(email: string, options: CleanupOptions = {}): Promise<void> {
  const { dryRun } = options;
  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}🧹 Cleaning up: ${email}`);

  // 1. Find subscriber record
  const { data: subscriber } = await supabaseAdmin
    .from('subscribers')
    .select('user_id, stripe_customer_id, stripe_subscription_id')
    .eq('email', email)
    .single();

  // 2. Cancel Stripe subscription if exists
  if (subscriber?.stripe_subscription_id) {
    if (!dryRun) {
      try {
        await stripe.subscriptions.cancel(subscriber.stripe_subscription_id);
        console.log(`  ✓ Canceled Stripe subscription: ${subscriber.stripe_subscription_id}`);
      } catch {
        console.log(`  - Subscription already canceled or not found`);
      }
    } else {
      console.log(`  → Would cancel subscription: ${subscriber.stripe_subscription_id}`);
    }
  }

  // 3. Delete Stripe customer if exists
  if (subscriber?.stripe_customer_id) {
    if (!dryRun) {
      try {
        await stripe.customers.del(subscriber.stripe_customer_id);
        console.log(`  ✓ Deleted Stripe customer: ${subscriber.stripe_customer_id}`);
      } catch {
        console.log(`  - Stripe customer not found`);
      }
    } else {
      console.log(`  → Would delete Stripe customer: ${subscriber.stripe_customer_id}`);
    }
  }

  // 4. Delete subscriber record
  if (subscriber) {
    if (!dryRun) {
      await supabaseAdmin.from('subscribers').delete().eq('email', email);
      console.log(`  ✓ Deleted subscriber record`);
    } else {
      console.log(`  → Would delete subscriber record`);
    }
  } else {
    console.log(`  - No subscriber record found`);
  }

  // 5. Delete from email_alert_subscribers if exists
  const { data: alertSubscriber } = await supabaseAdmin
    .from('email_alert_subscribers')
    .select('id')
    .eq('email', email)
    .single();

  if (alertSubscriber) {
    if (!dryRun) {
      await supabaseAdmin.from('email_alert_subscribers').delete().eq('email', email);
      console.log(`  ✓ Deleted email alert subscriber record`);
    } else {
      console.log(`  → Would delete email alert subscriber record`);
    }
  }

  // 6. Find and delete auth user
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const authUser = users?.users.find((u) => u.email === email);

  if (authUser) {
    if (!dryRun) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      console.log(`  ✓ Deleted auth user: ${authUser.id}`);
    } else {
      console.log(`  → Would delete auth user: ${authUser.id}`);
    }
  } else {
    console.log(`  - No auth user found`);
  }

  console.log(`${dryRun ? '[DRY RUN] ' : ''}✅ Done: ${email}`);
}

async function listTestUsers(): Promise<void> {
  console.log('\n📋 Listing all users...\n');

  // Get auth users
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
  const authUsers = authData?.users || [];

  // Get subscribers
  const { data: subscribers } = await supabaseAdmin
    .from('subscribers')
    .select('email, status, stripe_customer_id, created_at')
    .order('created_at', { ascending: false });

  console.log('AUTH USERS:');
  console.log('-'.repeat(60));
  for (const user of authUsers) {
    console.log(`  ${user.email} (created: ${user.created_at})`);
  }
  console.log(`\nTotal: ${authUsers.length} auth users\n`);

  console.log('SUBSCRIBERS:');
  console.log('-'.repeat(60));
  for (const sub of subscribers || []) {
    console.log(`  ${sub.email} [${sub.status}] (created: ${sub.created_at})`);
  }
  console.log(`\nTotal: ${(subscribers || []).length} subscribers`);
}

async function deleteAllTestUsers(pattern: string, options: CleanupOptions = {}): Promise<void> {
  const { dryRun } = options;

  // Get all auth users matching pattern
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
  const matchingUsers = authData?.users.filter(u =>
    u.email && (u.email.includes(pattern) || u.email.match(new RegExp(pattern)))
  ) || [];

  if (matchingUsers.length === 0) {
    console.log(`No users found matching pattern: ${pattern}`);
    return;
  }

  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}Found ${matchingUsers.length} users matching "${pattern}":`);
  matchingUsers.forEach(u => console.log(`  - ${u.email}`));

  for (const user of matchingUsers) {
    if (user.email) {
      await deleteUserByEmail(user.email, options);
    }
  }

  console.log(`\n${dryRun ? '[DRY RUN] ' : ''}✅ Cleanup complete for ${matchingUsers.length} users`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: pnpm cleanup-test-users [options] [emails...]

Options:
  --list              List all users (auth and subscribers)
  --pattern <pattern> Delete all users matching pattern (e.g., "test-" or "@example.com")
  --dry-run           Show what would be deleted without actually deleting
  --help, -h          Show this help

Examples:
  pnpm cleanup-test-users test@example.com
  pnpm cleanup-test-users user1@test.com user2@test.com
  pnpm cleanup-test-users --pattern "test-"
  pnpm cleanup-test-users --pattern "@example.com" --dry-run
  pnpm cleanup-test-users --list
`);
    process.exit(0);
  }

  const dryRun = args.includes('--dry-run');
  const options: CleanupOptions = { dryRun };

  if (args.includes('--list')) {
    await listTestUsers();
    process.exit(0);
  }

  const patternIndex = args.indexOf('--pattern');
  if (patternIndex !== -1 && args[patternIndex + 1]) {
    await deleteAllTestUsers(args[patternIndex + 1], options);
    process.exit(0);
  }

  // Delete specific emails
  const emails = args.filter(a => !a.startsWith('--') && a.includes('@'));

  if (emails.length === 0) {
    console.log('No valid emails provided. Use --help for usage.');
    process.exit(1);
  }

  for (const email of emails) {
    await deleteUserByEmail(email, options);
  }

  console.log('\n🎉 All cleanup complete!');
}

main().catch(console.error);
