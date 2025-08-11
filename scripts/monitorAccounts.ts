#!/usr/bin/env node
import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Initialize both Stripe accounts
const oldStripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
});

const newStripe = process.env.STRIPE_SECRET_KEY_NEW 
  ? new Stripe(process.env.STRIPE_SECRET_KEY_NEW, {
      apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
    })
  : null;

async function getAccountStats(stripe: Stripe, accountName: string) {
  console.log(`\n📊 ${accountName} Account Statistics`);
  console.log('='.repeat(50));
  
  try {
    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
    });
    
    const trialingSubs = await stripe.subscriptions.list({
      status: 'trialing',
      limit: 100,
    });
    
    // Count by plan type
    let monthlyCount = 0;
    let annualCount = 0;
    let totalMRR = 0;
    
    [...subscriptions.data, ...trialingSubs.data].forEach(sub => {
      const priceId = sub.items.data[0]?.price.id;
      const amount = sub.items.data[0]?.price.unit_amount || 0;
      
      if (priceId?.includes('Qbm96') || priceId?.includes('monthly')) {
        monthlyCount++;
        totalMRR += amount / 100;
      } else if (priceId?.includes('QowMR') || priceId?.includes('annual')) {
        annualCount++;
        totalMRR += (amount / 100) / 12; // Convert annual to monthly
      }
    });
    
    console.log(`✅ Active Subscriptions: ${subscriptions.data.length}`);
    console.log(`🔄 Trial Subscriptions: ${trialingSubs.data.length}`);
    console.log(`📅 Monthly Plans: ${monthlyCount}`);
    console.log(`📆 Annual Plans: ${annualCount}`);
    console.log(`💰 Total MRR: $${totalMRR.toFixed(2)}`);
    
    // Get recent signups (last 7 days)
    const weekAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
    const recentCustomers = await stripe.customers.list({
      created: { gte: weekAgo },
      limit: 100,
    });
    
    console.log(`🆕 New Customers (7 days): ${recentCustomers.data.length}`);
    
    // Get failed payments
    const failedCharges = await stripe.charges.list({
      created: { gte: weekAgo },
      limit: 100,
    });
    
    const failedCount = failedCharges.data.filter(c => c.status === 'failed').length;
    console.log(`❌ Failed Payments (7 days): ${failedCount}`);
    
  } catch (error) {
    console.error(`Error fetching stats for ${accountName}:`, error);
  }
}

async function main() {
  console.log('🚀 Stripe Account Monitoring Dashboard');
  console.log(`📅 ${new Date().toLocaleString()}`);
  
  // Monitor old account
  await getAccountStats(oldStripe, 'Original (SimpleApps)');
  
  // Monitor new account if configured
  if (newStripe) {
    await getAccountStats(newStripe, 'New (First Serve Seattle)');
    
    // Show migration status
    console.log('\n' + '🔄 '.repeat(20));
    console.log('MIGRATION STATUS');
    console.log('🔄 '.repeat(20));
    console.log(`Current Mode: ${process.env.USE_NEW_STRIPE_ACCOUNT === 'true' ? 'NEW ACCOUNT' : 'OLD ACCOUNT'}`);
    console.log('Next Steps:');
    console.log('1. Monitor both accounts daily');
    console.log('2. New signups will go to selected account');
    console.log('3. Let old subscriptions naturally expire over time');
    console.log('4. Full migration complete when old account reaches 0 active');
  } else {
    console.log('\n⚠️  New Stripe account not configured yet');
    console.log('Add STRIPE_SECRET_KEY_NEW to your .env.local to enable monitoring');
  }
}

main();