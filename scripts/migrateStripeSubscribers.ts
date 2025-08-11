#!/usr/bin/env node
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Initialize clients
const oldStripe = new Stripe(process.env.STRIPE_SECRET_KEY_OLD || process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
});

const newStripe = new Stripe(process.env.STRIPE_SECRET_KEY_NEW!, {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Price ID mappings
const PRICE_MAPPINGS = {
  'price_1Qbm96KSaqiJUYkj7SWySbjU': process.env.STRIPE_MONTHLY_PRICE_ID_NEW!, // Monthly
  'price_1QowMRKSaqiJUYkjgeqLADm4': process.env.STRIPE_ANNUAL_PRICE_ID_NEW!,  // Annual
};

interface MigrationResult {
  email: string;
  oldCustomerId: string;
  newCustomerId?: string;
  oldSubscriptionId: string;
  newSubscriptionId?: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
}

async function migrateSubscriber(oldSubscription: Stripe.Subscription): Promise<MigrationResult> {
  const oldCustomer = await oldStripe.customers.retrieve(oldSubscription.customer as string) as Stripe.Customer;
  const email = oldCustomer.email!;
  
  const result: MigrationResult = {
    email,
    oldCustomerId: oldCustomer.id,
    oldSubscriptionId: oldSubscription.id,
    status: 'failed',
  };

  try {
    // Check if subscription is active
    if (!['active', 'trialing'].includes(oldSubscription.status)) {
      result.status = 'skipped';
      result.error = `Subscription status is ${oldSubscription.status}`;
      return result;
    }

    // Get the old price ID
    const oldPriceId = oldSubscription.items.data[0]?.price.id;
    const newPriceId = PRICE_MAPPINGS[oldPriceId as keyof typeof PRICE_MAPPINGS];
    
    if (!newPriceId) {
      result.error = `No mapping found for price ${oldPriceId}`;
      return result;
    }

    // Step 1: Create or retrieve customer in new account
    let newCustomer: Stripe.Customer;
    const existingCustomers = await newStripe.customers.list({ email });
    
    if (existingCustomers.data.length > 0) {
      newCustomer = existingCustomers.data[0];
      console.log(`  Using existing customer ${newCustomer.id}`);
    } else {
      newCustomer = await newStripe.customers.create({
        email,
        name: oldCustomer.name || undefined,
        metadata: {
          migrated_from: oldCustomer.id,
          migration_date: new Date().toISOString(),
        },
      });
      console.log(`  Created new customer ${newCustomer.id}`);
    }
    result.newCustomerId = newCustomer.id;

    // Step 2: Get payment method from old account
    const oldPaymentMethods = await oldStripe.paymentMethods.list({
      customer: oldCustomer.id,
      type: 'card',
    });

    if (oldPaymentMethods.data.length === 0) {
      result.error = 'No payment method found';
      return result;
    }

    // Note: You cannot directly transfer payment methods between Stripe accounts
    // Customers will need to re-enter their payment information
    console.log(`  ⚠️  Customer will need to update payment method`);

    // Step 3: Create subscription in new account (without payment method initially)
    const newSubscription = await newStripe.subscriptions.create({
      customer: newCustomer.id,
      items: [{ price: newPriceId }],
      // Start billing at the same time as the old subscription's current period end
      trial_end: Math.floor(oldSubscription.current_period_end),
      metadata: {
        migrated_from: oldSubscription.id,
        migration_date: new Date().toISOString(),
      },
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      collection_method: 'send_invoice',
      days_until_due: 7, // Give customer 7 days to update payment
    });
    
    result.newSubscriptionId = newSubscription.id;
    console.log(`  Created new subscription ${newSubscription.id}`);

    // Step 4: Cancel old subscription at period end
    await oldStripe.subscriptions.update(oldSubscription.id, {
      cancel_at_period_end: true,
      metadata: {
        ...oldSubscription.metadata,
        migrated_to: newSubscription.id,
        migration_date: new Date().toISOString(),
      },
    });
    console.log(`  Set old subscription to cancel at period end`);

    // Step 5: Update Supabase record
    await supabase
      .from('subscribers')
      .update({
        stripe_customer_id: newCustomer.id,
        stripe_subscription_id: newSubscription.id,
        migration_status: 'migrated',
        migration_date: new Date().toISOString(),
        old_stripe_customer_id: oldCustomer.id,
        old_stripe_subscription_id: oldSubscription.id,
      })
      .eq('stripe_customer_id', oldCustomer.id);

    result.status = 'success';
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    return result;
  }
}

async function main() {
  console.log('🚀 Starting Stripe subscription migration...\n');
  
  // Verify environment variables
  if (!process.env.STRIPE_SECRET_KEY_NEW) {
    console.error('❌ Missing STRIPE_SECRET_KEY_NEW environment variable');
    process.exit(1);
  }
  
  if (!process.env.STRIPE_MONTHLY_PRICE_ID_NEW || !process.env.STRIPE_ANNUAL_PRICE_ID_NEW) {
    console.error('❌ Missing new price ID environment variables');
    process.exit(1);
  }

  try {
    // Get all active subscriptions from old account
    const subscriptions = await oldStripe.subscriptions.list({
      status: 'all',
      limit: 100,
    });

    const activeSubscriptions = subscriptions.data.filter(sub => 
      ['active', 'trialing'].includes(sub.status)
    );

    console.log(`Found ${activeSubscriptions.length} active/trialing subscriptions to migrate\n`);

    // Migration results
    const results: MigrationResult[] = [];
    
    // Process each subscription
    for (const subscription of activeSubscriptions) {
      const customer = await oldStripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
      console.log(`\nMigrating: ${customer.email}`);
      
      const result = await migrateSubscriber(subscription);
      results.push(result);
      
      if (result.status === 'success') {
        console.log(`  ✅ Successfully migrated`);
      } else if (result.status === 'skipped') {
        console.log(`  ⏭️  Skipped: ${result.error}`);
      } else {
        console.log(`  ❌ Failed: ${result.error}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📊 Total: ${results.length}`);
    
    // List failures
    if (failed > 0) {
      console.log('\nFailed migrations:');
      results.filter(r => r.status === 'failed').forEach(r => {
        console.log(`  - ${r.email}: ${r.error}`);
      });
    }

    // Important notes
    console.log('\n' + '⚠️ '.repeat(20));
    console.log('IMPORTANT POST-MIGRATION STEPS:');
    console.log('1. Customers need to update their payment methods in the new system');
    console.log('2. Send migration emails to customers with instructions');
    console.log('3. Monitor webhook events in both Stripe accounts');
    console.log('4. Update USE_NEW_STRIPE_ACCOUNT=true when ready to switch');
    console.log('⚠️ '.repeat(20));

  } catch (error) {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  }
}

// Dry run mode for testing
if (process.argv.includes('--dry-run')) {
  console.log('🔍 DRY RUN MODE - No actual changes will be made\n');
  // You can add dry run logic here
} else {
  main();
}