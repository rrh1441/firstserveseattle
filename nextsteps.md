# NEXTSTEPS - Fix Stripe Portal Issues

## Problem Summary
1. The Customer Portal is showing "Simple Apps, LLC" (OLD Stripe account) instead of First Serve Seattle account
2. No cancel subscription option is showing even though it's configured
3. New subscriptions may be going to the wrong Stripe account

## Root Cause Analysis
The subscription lookup is finding the customer in the OLD account but there's no active subscription there. This suggests:
- The customer exists in BOTH Stripe accounts
- The subscription is in the NEW account but the portal is opening for the OLD account customer

## Required Fixes

### 1. Verify Environment Variables in Vercel
Go to Vercel Dashboard → Settings → Environment Variables and confirm:
```
USE_NEW_STRIPE_ACCOUNT=TRUE (not true, not True - must be uppercase TRUE)
STRIPE_SECRET_KEY_NEW=[your new account secret key]
STRIPE_PUBLISHABLE_KEY_NEW=[your new account publishable key]
STRIPE_WEBHOOK_SECRET_NEW=[your new webhook secret]
STRIPE_MONTHLY_PRICE_ID_NEW=[monthly price from new account]
STRIPE_ANNUAL_PRICE_ID_NEW=[annual price from new account]
```

### 2. Update create-portal-link Logic
The current logic tries to find the subscription but then creates a portal for whichever customer it finds. Instead, it should:
1. Try to create portal with subscription's customer ID in NEW account first
2. If that fails, try OLD account
3. Don't rely on subscription lookup - use the customer ID directly from subscribers table

### 3. Update Database Schema
Add a flag to track which Stripe account each subscription belongs to:
```sql
ALTER TABLE subscribers 
ADD COLUMN stripe_account VARCHAR(10) DEFAULT 'old';

-- Update existing new account subscriptions
UPDATE subscribers 
SET stripe_account = 'new' 
WHERE created_at > '2024-08-10' -- or whatever date you started using new account
```

### 4. Fix Portal Creation Logic
In `/src/app/api/create-portal-link/route.ts`:
- Don't lookup subscription first
- Use stripe_customer_id directly
- Try creating portal in NEW account first if stripe_account = 'new'
- Fall back to OLD account if it fails

### 5. Configure BOTH Stripe Accounts
Ensure Customer Portal settings are identical in both accounts:
1. Go to each Stripe account → Settings → Billing → Customer portal
2. Enable "Cancel subscriptions" in BOTH
3. Set the same return URL for both
4. Save configuration

### 6. Debug Which Account Has What
Create a simple debug script to check:
```javascript
// Which account has the customer
// Which account has the subscription  
// Which portal configuration is being used
```

## Testing Steps
1. Create a NEW test subscription with a fresh email
2. Verify it goes to NEW Stripe account
3. Test the portal - should show cancel option
4. Check logs to see which account is being used

## Key Issue
The main problem is that customers exist in BOTH Stripe accounts (probably from old signups), but subscriptions only exist in one. The portal is opening for the wrong customer record.

## Quick Fix Option
If you need this working immediately:
1. Manually create the portal session in Stripe Dashboard
2. Go to NEW account → Customers → Find customer → Actions → Customer portal
3. This will show you if the configuration is correct

## Environment Variable Check
Run this in Vercel Functions logs to verify:
```javascript
console.log({
  USE_NEW: process.env.USE_NEW_STRIPE_ACCOUNT,
  HAS_NEW_KEY: !!process.env.STRIPE_SECRET_KEY_NEW,
  NEW_PRICE: process.env.STRIPE_MONTHLY_PRICE_ID_NEW
})
```

## Next Session TODO
1. Verify all environment variables are set correctly
2. Check which Stripe account has your test subscription
3. Ensure portal configuration is enabled in the RIGHT account
4. Update the portal code to use the correct customer from the correct account