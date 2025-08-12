import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}
if (!process.env.STRIPE_SECRET_KEY_NEW) {
  console.error('❌ Missing STRIPE_SECRET_KEY_NEW');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripeOld = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
});

const stripeNew = new Stripe(process.env.STRIPE_SECRET_KEY_NEW!, {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
});

async function findCorrectSubscription() {
  const email = 'ryanrheger@gmail.com';
  
  console.log('🔍 Finding correct subscription for:', email);
  console.log('================================================\n');
  
  // Get current database record
  const { data: subscriber } = await supabase
    .from('subscribers')
    .select('*')
    .eq('email', email)
    .single();
    
  if (!subscriber) {
    console.log('❌ No subscriber found in database');
    return;
  }
  
  console.log('📊 Current Database Record:');
  console.log('  Subscription ID:', subscriber.stripe_subscription_id);
  console.log('  Customer ID:', subscriber.stripe_customer_id);
  console.log('  Status:', subscriber.status);
  console.log('');
  
  // Check OLD account
  console.log('🏢 OLD Account (Simple Apps):');
  try {
    const oldSub = await stripeOld.subscriptions.retrieve(subscriber.stripe_subscription_id);
    console.log('  ✅ Subscription FOUND');
    console.log('  Status:', oldSub.status);
    console.log('  Customer:', oldSub.customer);
    console.log('  Created:', new Date(oldSub.created * 1000).toISOString());
    
    const oldCustomer = await stripeOld.customers.retrieve(oldSub.customer as string);
    console.log('  Customer Email:', (oldCustomer as Stripe.Customer).email);
  } catch (err) {
    console.log('  ❌ Subscription NOT found');
  }
  console.log('');
  
  // Check NEW account
  console.log('🏢 NEW Account (First Serve Seattle):');
  
  // Search by email in NEW account
  const customers = await stripeNew.customers.list({
    email: email,
    limit: 10
  });
  
  if (customers.data.length === 0) {
    console.log('  ❌ No customer found with email:', email);
  } else {
    for (const customer of customers.data) {
      console.log(`  Customer ID: ${customer.id}`);
      console.log(`  Customer Email: ${customer.email}`);
      
      // Get subscriptions for this customer
      const subs = await stripeNew.subscriptions.list({
        customer: customer.id,
        limit: 10
      });
      
      if (subs.data.length === 0) {
        console.log('    ❌ No subscriptions');
      } else {
        console.log(`    ✅ Found ${subs.data.length} subscription(s):`);
        for (const sub of subs.data) {
          console.log(`\n    📍 Subscription ID: ${sub.id}`);
          console.log(`       Status: ${sub.status}`);
          console.log(`       Created: ${new Date(sub.created * 1000).toISOString()}`);
          console.log(`       Current Period: ${new Date(sub.current_period_start * 1000).toISOString()} to ${new Date(sub.current_period_end * 1000).toISOString()}`);
          
          // Get the price/product info
          const item = sub.items.data[0];
          if (item) {
            const price = item.price;
            console.log(`       Price ID: ${price.id}`);
            console.log(`       Amount: $${(price.unit_amount || 0) / 100}`);
            
            if (typeof price.product === 'string') {
              const product = await stripeNew.products.retrieve(price.product);
              console.log(`       Product: ${product.name}`);
            }
          }
          
          if (sub.status === 'active') {
            console.log(`\n    🎯 THIS IS THE ACTIVE SUBSCRIPTION!`);
            console.log(`    🔧 To fix, update database with:`);
            console.log(`       stripe_subscription_id = '${sub.id}'`);
            console.log(`       stripe_customer_id = '${customer.id}'`);
          }
        }
      }
    }
  }
  
  console.log('\n================================================');
  console.log('🚨 RECOMMENDATION:');
  console.log('Your subscription is in the OLD account but should be in the NEW account.');
  console.log('You need to either:');
  console.log('1. Cancel the OLD subscription and create a new one in the NEW account');
  console.log('2. Or update the database to point to the correct NEW account subscription');
}

findCorrectSubscription().catch(console.error);