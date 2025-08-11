# Safer Stripe Migration Strategy

## Current Situation
- 37 monthly subscribers
- 2 annual subscribers  
- Total: 39 active subscribers
- Using 50% off first month (no free trials)

## Recommended Migration Approach

### Option 1: Gradual Migration (RECOMMENDED)
Keep both Stripe accounts running simultaneously:

1. **New signups** → New Stripe account (First Serve Seattle)
2. **Existing customers** → Stay on old account (SimpleApps)
3. **Natural migration** → As subscriptions expire/renew, move them

**Pros:**
- Zero disruption to existing customers
- No payment method re-entry required
- Can test thoroughly with new customers first
- Rollback is easy

**Cons:**
- Need to maintain two accounts for 6-12 months
- Slightly more complex webhook handling

### Option 2: Stripe Account Transfer (CLEANEST)
Contact Stripe support to transfer the entire account ownership:

1. Contact Stripe support
2. Request account ownership transfer from SimpleApps to First Serve Seattle
3. Update business details after transfer

**Pros:**
- No code changes needed
- No customer impact
- All history preserved
- Instant migration

**Cons:**
- Requires coordination with Stripe support
- May take 3-5 business days

### Option 3: Customer Communication Migration
Manually migrate with customer cooperation:

1. Email all 39 customers about the change
2. Provide them with a special migration link
3. Offer incentive (extra month free, discount, etc.)
4. Cancel old subscriptions as customers migrate

**Pros:**
- Customers aware of change
- Opportunity to re-engage
- Can offer incentives

**Cons:**
- Requires customer action
- Some customers won't migrate
- Risk of losing customers

## Implementation for Option 1 (Recommended)

### Phase 1: Setup (Week 1)
- ✅ Create new Stripe account
- ✅ Set up products and prices
- ✅ Configure webhook endpoint
- ✅ Add email automation

### Phase 2: Code Updates (Week 1)
- Add environment variables for both accounts
- Update webhook handler to handle both
- Add account switching logic
- Test with test mode

### Phase 3: Launch (Week 2)
- Deploy with USE_NEW_STRIPE_ACCOUNT=false
- Test webhook handling for existing customers
- Switch to USE_NEW_STRIPE_ACCOUNT=true
- Monitor new signups

### Phase 4: Migration (Months 2-12)
- Let existing subscriptions naturally expire
- Optional: Offer migration incentives
- Monitor both accounts
- Gradually phase out old account

## Environment Variables Needed

```env
# Old Account (SimpleApps)
STRIPE_SECRET_KEY_OLD=sk_live_current...
STRIPE_PUBLISHABLE_KEY_OLD=pk_live_current...
STRIPE_WEBHOOK_SECRET_OLD=whsec_current...

# New Account (First Serve Seattle)
STRIPE_SECRET_KEY_NEW=sk_live_new...
STRIPE_PUBLISHABLE_KEY_NEW=pk_live_new...
STRIPE_WEBHOOK_SECRET_NEW=whsec_new...
STRIPE_MONTHLY_PRICE_ID_NEW=price_xxx
STRIPE_ANNUAL_PRICE_ID_NEW=price_yyy
STRIPE_FIFTY_OFF_PROMO_NEW=promo_zzz

# Feature flag
USE_NEW_STRIPE_ACCOUNT=false # Set to true when ready

# Resend for emails
RESEND_API_KEY=re_xxx
```

## Email Templates Already Created
✅ Welcome email on signup
✅ Payment success confirmation
✅ Payment failed notification
✅ Subscription cancelled confirmation

## Next Steps
1. Get your new Stripe account credentials
2. Add them to .env.local
3. Test the dual-account setup
4. Deploy with feature flag OFF
5. Turn ON for new customers when ready

This approach ensures zero risk to your existing 39 subscribers while modernizing your infrastructure.