# Stripe Event Handling Reference

## Event Payload Examples

### checkout.session.completed

```json
{
  "id": "evt_1234",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_abc",
      "customer": "cus_xyz",
      "subscription": "sub_123",
      "client_reference_id": "user_uuid_here",
      "metadata": {
        "userId": "user_uuid_here",
        "plan": "price_monthly_id"
      },
      "customer_details": {
        "email": "user@example.com"
      }
    }
  }
}
```

**Key Fields:**
- `customer`: Stripe customer ID for API lookups
- `subscription`: Subscription ID to retrieve trial info
- `client_reference_id`: Pass user ID here during checkout creation
- `metadata.userId`: Alternative way to pass user ID

### customer.subscription.updated

```json
{
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_123",
      "customer": "cus_xyz",
      "status": "active",
      "trial_end": 1704067200,
      "items": {
        "data": [{
          "price": {
            "id": "price_monthly_id"
          }
        }]
      }
    }
  }
}
```

**Status Values:**
- `trialing` - In trial period
- `active` - Paying customer
- `past_due` - Payment failed, retrying
- `canceled` - Subscription ended
- `unpaid` - All retries failed

### customer.subscription.deleted

Fired when subscription is fully canceled (not just scheduled to cancel).

```json
{
  "type": "customer.subscription.deleted",
  "data": {
    "object": {
      "id": "sub_123",
      "customer": "cus_xyz",
      "status": "canceled"
    }
  }
}
```

### invoice.payment_failed

```json
{
  "type": "invoice.payment_failed",
  "data": {
    "object": {
      "id": "in_123",
      "customer": "cus_xyz",
      "subscription": "sub_123",
      "status": "open",
      "attempt_count": 1,
      "next_payment_attempt": 1704153600
    }
  }
}
```

**Note:** Stripe retries failed payments automatically. Send notification but don't cancel immediately.

## Edge Cases

### Multiple Stripe Accounts

When migrating between Stripe accounts, track which account a subscription belongs to:

```typescript
const updateData = {
  ...fields,
  stripe_account: 'new', // or 'original'
};
```

### Customer Without Email

Some Stripe customers may not have email (e.g., created via API). Always use fallback:

```typescript
const email = customer.email ?? session.customer_details?.email ?? '';
```

### Deleted Customer

When retrieving a deleted customer, Stripe returns a `Stripe.DeletedCustomer`:

```typescript
const customer = await stripe.customers.retrieve(custId);
if (customer.deleted) {
  // Handle deleted customer
  return;
}
const cust = customer as Stripe.Customer;
```

### Trial End Timezone

`trial_end` is a Unix timestamp in seconds (not milliseconds):

```typescript
// Convert to Date
const trialEndDate = new Date(subscription.trial_end * 1000);

// Store as-is for Supabase (BIGINT column)
trialEnd: subscription.trial_end
```

### Idempotency

Stripe may send the same event multiple times. Upsert operations handle this naturally, but be careful with side effects like emails:

```typescript
// Check if already processed
const { data: existing } = await supa
  .from('subscribers')
  .select('status')
  .eq('stripe_subscription_id', subId)
  .single();

// Only send welcome email for new subscriptions
if (!existing) {
  await EmailService.sendWelcomeEmail(email, plan);
}
```

## Common Mistakes

1. **Using anon key instead of service role** - Webhooks run server-side without user context
2. **Not verifying signatures** - Opens you to spoofed events
3. **Relying only on stripe_customer_id** - Pre-signup users may not have one yet
4. **Ignoring deleted customers** - Will throw if you try to access properties
5. **Hardcoding price IDs** - Use environment variables for different environments
