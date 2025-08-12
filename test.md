# Stripe Customer Portal Fix - Testing Guide

## Problem Summary
The customer portal was showing "Simple Apps, LLC" instead of "First Serve Seattle" even though:
- Payments were processing in the NEW (First Serve Seattle) Stripe account
- `USE_NEW_STRIPE_ACCOUNT=TRUE` was set correctly
- The portal configuration in Stripe was correct

## Root Cause
The database had an OLD subscription ID (`sub_1Rv2sNKSaqiJUYkjmWFBt2Yp`) from the cancelled Simple Apps account, while the ACTIVE subscription (`sub_1Rv96cQRPaPngbWPEGCdtSyf`) was in the NEW First Serve Seattle account.

When the portal tried to open:
1. It looked up the subscription ID from the database
2. Found it in the OLD account
3. Opened the OLD account's portal (showing "Simple Apps, LLC")

## Manual Fix (Completed)
We manually updated the database with the correct subscription information:

```sql
-- Check current subscription data
SELECT 
    email,
    stripe_customer_id,
    stripe_subscription_id,
    status,
    plan,
    created_at,
    updated_at
FROM subscribers
WHERE email = 'ryanrheger@gmail.com';

-- Update with correct NEW account IDs
UPDATE subscribers
SET 
    stripe_subscription_id = 'sub_1Rv96cQRPaPngbWPEGCdtSyf',
    stripe_customer_id = 'cus_SqqoMqklnPnSyU',
    updated_at = NOW()
WHERE email = 'ryanrheger@gmail.com';
```

This immediately fixed the portal to show "First Serve Seattle" and allow subscription management.

## Automated Fix (To Test)

### What We Changed

1. **Portal Route (`/api/create-portal-link/route.ts`)**:
   - Now checks NEW account FIRST when `USE_NEW_STRIPE_ACCOUNT=true`
   - Added extensive logging to track which account is being used
   - Verifies if customer exists in both accounts

2. **Webhook Handler (`/api/stripe-webhook-new/route.ts`)**:
   - Fixed issue where undefined values weren't updating in database
   - Removed strict price ID validation that was rejecting valid subscriptions
   - Added comprehensive logging for all subscription events

### Testing the Automated Fix

#### Test 1: Webhook Update Test
1. Go to Stripe Dashboard (First Serve Seattle account)
2. Navigate to Developers → Webhooks
3. Find the webhook for `https://firstserveseattle.com/api/stripe-webhook-new`
4. Click on a recent `customer.subscription.updated` event
5. Click "Resend"
6. Check Vercel logs for:
   ```
   🔄 [NEW WEBHOOK] Subscription updated
   📝 [NEW WEBHOOK] Upserting subscriber
   ✅ [NEW WEBHOOK] Subscriber updated successfully
   ```
7. Verify database has correct subscription ID

#### Test 2: New Subscription Test
1. Create a test subscription with a new email
2. Check Vercel logs for:
   ```
   🆕 [NEW WEBHOOK] Checkout completed - Creating subscription
   ✅ [NEW WEBHOOK] Subscription created in database
   ```
3. Verify portal works immediately without manual intervention

#### Test 3: Portal Access Test
1. Click "Manage Subscription" button
2. Check Vercel logs for:
   ```
   🎯 PORTAL: USE_NEW_STRIPE_ACCOUNT is TRUE, checking NEW account FIRST
   ✅ PORTAL: Found subscription in NEW account!
   ✅ PORTAL: Portal session created successfully!
   ```
3. Verify portal shows "First Serve Seattle" branding

### Expected Log Output

When working correctly, you should see:

```
🔍 Portal Debug: {
  USE_NEW_STRIPE_ACCOUNT: 'TRUE',
  useNewAccount: true,
  hasNewStripe: true,
  subscriptionId: 'sub_1Rv96cQRPaPngbWPEGCdtSyf',
  userEmail: 'ryanrheger@gmail.com'
}
🎯 PORTAL: USE_NEW_STRIPE_ACCOUNT is TRUE, checking NEW account FIRST
🔍 PORTAL: Attempting to retrieve subscription from NEW Stripe account
✅ PORTAL: Found subscription in NEW account!
✅ PORTAL: Customer ID: cus_SqqoMqklnPnSyU
✅ PORTAL: Will use NEW Stripe instance for portal creation
🚀 PORTAL: Creating portal session...
🚀 PORTAL: Using Stripe instance: ✅ NEW ACCOUNT (First Serve Seattle)
✅ PORTAL: Portal session created successfully!
✅ PORTAL: Account used: NEW (First Serve Seattle)
```

### Environment Variables to Verify

Make sure these are set in Vercel:
```
USE_NEW_STRIPE_ACCOUNT=TRUE
STRIPE_SECRET_KEY_NEW=[your new account secret key]
STRIPE_PUBLISHABLE_KEY_NEW=[your new account publishable key]
STRIPE_WEBHOOK_SECRET_NEW=[your new webhook secret]
STRIPE_MONTHLY_PRICE_ID_NEW=[your actual monthly price ID]
STRIPE_ANNUAL_PRICE_ID_NEW=[your actual annual price ID]
```

**Important**: Your monthly price ID is `price_1Rv1uTQRPaPngbWPBsQL66v0` - make sure to set `STRIPE_MONTHLY_PRICE_ID_NEW` to this value.

### Troubleshooting

If the automated fix doesn't work:

1. **Check webhook endpoint URL**: Must be `/api/stripe-webhook-new` (not `/api/stripe-webhook`)
2. **Check webhook events**: Must include `customer.subscription.created` and `customer.subscription.updated`
3. **Check Vercel logs**: Look for any error messages in the webhook processing
4. **Verify environment variables**: Especially the price IDs

### Success Criteria

✅ New subscriptions automatically use NEW account IDs in database
✅ Portal shows "First Serve Seattle" for all users
✅ Cancel subscription option is available
✅ No manual SQL updates required