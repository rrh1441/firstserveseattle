import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const TEST_EMAIL = `e2e-test-${Date.now()}@test.firstserveseattle.com`;
const TEST_PASSWORD = 'TestPassword123!';

async function cleanup(email: string, customerId?: string, subscriptionId?: string) {
  // Cancel subscription
  if (subscriptionId) {
    try {
      await stripe.subscriptions.cancel(subscriptionId);
    } catch {}
  }

  // Delete Stripe customer
  if (customerId) {
    try {
      await stripe.customers.del(customerId);
    } catch {}
  }

  // Delete subscriber record
  await supabaseAdmin.from('subscribers').delete().eq('email', email);

  // Delete auth user
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const authUser = users?.users.find((u: { email?: string }) => u.email === email);
  if (authUser) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.id);
  }
}

export async function runSignupSubscriptionTest(): Promise<boolean> {
  console.log('\n🧪 E2E: Signup + Subscription Flow\n');
  console.log('━'.repeat(50));

  let customerId: string | undefined;
  let subscriptionId: string | undefined;

  try {
    // Step 1: Create user via Supabase Admin
    console.log('\n📋 Step 1: Create test user');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create user: ${authError?.message}`);
    }
    console.log(`  ✓ Created user: ${TEST_EMAIL}`);

    // Step 2: Create Stripe customer
    console.log('\n📋 Step 2: Create Stripe customer');
    const customer = await stripe.customers.create({
      email: TEST_EMAIL,
      metadata: { supabase_user_id: authData.user.id },
    });
    customerId = customer.id;
    console.log(`  ✓ Created Stripe customer: ${customerId}`);

    // Step 3: Create subscription with 100% off coupon
    console.log('\n📋 Step 3: Create subscription with promo code');
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: process.env.STRIPE_MONTHLY_PRICE_ID! }],
      coupon: 'E2E_TEST_100OFF',
    });
    subscriptionId = subscription.id;
    console.log(`  ✓ Created subscription: ${subscriptionId}`);
    console.log(`  ✓ Status: ${subscription.status}`);

    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      throw new Error(`Unexpected subscription status: ${subscription.status}`);
    }

    // Step 4: Verify subscriber record exists (webhook should create it)
    console.log('\n📋 Step 4: Wait for webhook to create subscriber record');
    let subscriber = null;
    for (let i = 0; i < 30; i++) {
      const { data } = await supabaseAdmin
        .from('subscribers')
        .select('*')
        .eq('email', TEST_EMAIL)
        .single();

      if (data && ['active', 'trialing'].includes(data.status)) {
        subscriber = data;
        break;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }

    if (!subscriber) {
      throw new Error('Subscriber record not created by webhook within 60s');
    }
    console.log(`  ✓ Subscriber record created with status: ${subscriber.status}`);

    // Step 5: Cancel subscription
    console.log('\n📋 Step 5: Cancel subscription');
    const canceled = await stripe.subscriptions.cancel(subscriptionId);
    if (canceled.status !== 'canceled') {
      throw new Error(`Expected canceled status, got: ${canceled.status}`);
    }
    console.log(`  ✓ Subscription canceled`);

    // Step 6: Cleanup
    console.log('\n📋 Step 6: Cleanup test data');
    await cleanup(TEST_EMAIL, customerId, undefined); // subscription already canceled
    console.log(`  ✓ Cleaned up test user and Stripe data`);

    console.log('\n' + '━'.repeat(50));
    console.log('✅ E2E Test PASSED\n');
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await cleanup(TEST_EMAIL, customerId, subscriptionId);
    return false;
  }
}
