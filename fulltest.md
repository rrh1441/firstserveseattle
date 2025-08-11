# First Serve Seattle - New Stripe Account Testing Guide

## Pre-Test Setup Checklist

### 1. Environment Variables (.env.local)
Ensure these are set in your `.env.local`:

```env
# EXISTING ACCOUNT (keep as-is)
STRIPE_SECRET_KEY=sk_live_51PwnjIKSaqiJUYkj...
STRIPE_PUBLISHABLE_KEY=pk_live_51PwnjIKSaqiJUYkj...
STRIPE_WEBHOOK_SECRET=whsec_JHMV1xOrdtAvuDbdLTSgwaoKrk3tkLzT

# NEW STRIPE ACCOUNT (First Serve Seattle)
STRIPE_SECRET_KEY_NEW=[YOUR_NEW_SECRET_KEY]
STRIPE_PUBLISHABLE_KEY_NEW=[YOUR_NEW_PUBLISHABLE_KEY]
STRIPE_WEBHOOK_SECRET_NEW=[YOUR_NEW_WEBHOOK_SECRET]
STRIPE_MONTHLY_PRICE_ID_NEW=[YOUR_MONTHLY_PRICE_ID]
STRIPE_ANNUAL_PRICE_ID_NEW=[YOUR_ANNUAL_PRICE_ID]
STRIPE_FIFTY_OFF_PROMO_NEW=[YOUR_50_PERCENT_OFF_PROMO_CODE]

# RESEND EMAIL SERVICE
RESEND_API_KEY=[YOUR_RESEND_API_KEY]

# MIGRATION CONTROL - START WITH FALSE
USE_NEW_STRIPE_ACCOUNT=false
```

### 2. Stripe Dashboard Setup

In your NEW Stripe account dashboard:

1. **Create Products & Prices:**
   - Monthly subscription product
   - Annual subscription product
   - Note the price IDs for env vars

2. **Create 50% Off Promotion:**
   - Go to Products → Coupons
   - Create "50% off first month" 
   - Duration: Once
   - Note the promo code ID

3. **Configure Webhook:**
   - Go to Developers → Webhooks
   - Add endpoint: `https://firstserveseattle.com/api/stripe-webhook-new`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `customer.updated`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `payment_method.attached`
   - Copy signing secret to `STRIPE_WEBHOOK_SECRET_NEW`

### 3. Resend Setup

1. Get API key from https://resend.com/api-keys
2. Verify domain `firstserveseattle.com` is configured
3. Add to `RESEND_API_KEY` env var

---

## Test Phase 1: Verify Old Account Still Works (USE_NEW_STRIPE_ACCOUNT=false)

### Test 1.1: Existing Flow
1. Go to https://firstserveseattle.com
2. Click "Start Free Trial" or sign up
3. Enter test email
4. Complete checkout
5. **Verify:** Payment processes through OLD Stripe account
6. **Verify:** No automated emails sent (old system behavior)

### Test 1.2: Monitor Accounts
```bash
npm run monitor-accounts
```
**Expected:** Shows 39 subscribers in old account, 0 in new

---

## Test Phase 2: Switch to New Account (USE_NEW_STRIPE_ACCOUNT=true)

### Update and Deploy:
```bash
# Update .env.local
USE_NEW_STRIPE_ACCOUNT=true

# Rebuild and deploy
npm run build
npm run start
```

### Test 2.1: New Customer Signup - Monthly
1. Go to https://firstserveseattle.com
2. Click sign up
3. Use test email: `testmonthly@example.com`
4. Select **Monthly** plan
5. Use test card: `4242 4242 4242 4242`
6. Complete checkout

**Verify:**
- [ ] Payment appears in NEW Stripe dashboard
- [ ] Welcome email received with:
  - Professional v0-style formatting
  - Correct monthly plan details
  - Login link to `/tennis-courts`
  - Billing portal link
- [ ] Database record created with `stripe_account: 'new'`

### Test 2.2: New Customer Signup - Annual
1. Repeat signup flow
2. Use test email: `testannual@example.com`
3. Select **Annual** plan
4. Complete checkout

**Verify:**
- [ ] Payment in NEW Stripe dashboard
- [ ] Welcome email with annual plan details
- [ ] Correct pricing displayed

### Test 2.3: 50% Off First Month
1. Go to signup with special offer link
2. Use test email: `testdiscount@example.com`
3. Select **Monthly** plan
4. **Verify:** 50% discount applied at checkout
5. Complete purchase

**Verify:**
- [ ] Discounted price shown in Stripe
- [ ] Welcome email sent
- [ ] Discount mentioned in email

---

## Test Phase 3: Webhook Events

### Test 3.1: Payment Success (Recurring)
1. In Stripe dashboard, trigger test webhook for `invoice.payment_succeeded`
2. **Verify:** Payment success email sent
3. **Check email contains:**
   - [ ] Correct amount
   - [ ] Professional formatting
   - [ ] Link to court availability

### Test 3.2: Payment Failed
1. In Stripe dashboard, trigger test webhook for `invoice.payment_failed`
2. **Verify:** Payment failed email sent
3. **Check email contains:**
   - [ ] Warning about failed payment
   - [ ] Update payment method button
   - [ ] 7-day grace period notice

### Test 3.3: Subscription Cancelled
1. Cancel a test subscription in Stripe dashboard
2. **Verify:** Cancellation email sent
3. **Check email contains:**
   - [ ] Access until end of billing period
   - [ ] Reactivation link
   - [ ] Thank you message

---

## Test Phase 4: Dual Account Operation

### Test 4.1: Verify Old Customers Unaffected
1. Check an existing customer can still:
   - [ ] Log in normally
   - [ ] Access billing portal (old Stripe)
   - [ ] Payments process through old account

### Test 4.2: Monitor Both Accounts
```bash
npm run monitor-accounts
```
**Expected Output:**
```
📊 Original (SimpleApps) Account Statistics
✅ Active Subscriptions: 37-39
📅 Monthly Plans: 37
📆 Annual Plans: 2

📊 New (First Serve Seattle) Account Statistics
✅ Active Subscriptions: 3 (your test accounts)
📅 Monthly Plans: 2
📆 Annual Plans: 1
```

---

## Test Phase 5: Edge Cases

### Test 5.1: Invalid Card
1. Try signup with card `4000 0000 0000 0002` (declined)
2. **Verify:** Appropriate error message
3. **Verify:** No welcome email sent

### Test 5.2: Webhook Replay
1. In Stripe dashboard, resend a webhook event
2. **Verify:** No duplicate emails sent
3. **Verify:** Database updated correctly

### Test 5.3: Email Delivery Issues
1. Check Resend dashboard for:
   - [ ] Delivery success rate
   - [ ] Any bounced emails
   - [ ] Email preview rendering

---

## Production Checklist

Before going fully live:

- [ ] All test emails received and formatted correctly
- [ ] Both Stripe accounts processing correctly
- [ ] No errors in server logs
- [ ] Database records have correct `stripe_account` field
- [ ] Webhook endpoints responding with 200 status
- [ ] Monitor shows correct subscriber counts
- [ ] Existing customers unaffected
- [ ] Support email `support@firstserveseattle.com` monitored

## Rollback Plan

If issues arise:
1. Set `USE_NEW_STRIPE_ACCOUNT=false`
2. Redeploy immediately
3. All new signups revert to old account
4. Investigate issues with new account offline

---

## Support Ticket Template

For customer issues, gather:
- Email address
- Stripe account (old/new)
- Subscription status
- Last payment date
- Error messages
- Screenshot if applicable

---

## Success Metrics

After 1 week, verify:
- [ ] Reduced support tickets about login/access
- [ ] Automated emails reducing manual work
- [ ] New customers successfully subscribing
- [ ] Old customers unaffected
- [ ] Clean separation between accounts