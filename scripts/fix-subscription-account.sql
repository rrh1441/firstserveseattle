-- First, check your current subscription data
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

-- Once you have the NEW Stripe account subscription ID and customer ID,
-- update the record with this query:
-- 
-- UPDATE subscribers
-- SET 
--     stripe_subscription_id = 'sub_NEW_SUBSCRIPTION_ID_HERE',
--     stripe_customer_id = 'cus_NEW_CUSTOMER_ID_HERE',
--     updated_at = NOW()
-- WHERE email = 'ryanrheger@gmail.com';

-- IMPORTANT: To find your NEW account subscription:
-- 1. Go to your First Serve Seattle Stripe Dashboard
-- 2. Search for your email: ryanrheger@gmail.com
-- 3. Find the ACTIVE subscription
-- 4. Copy the subscription ID (starts with sub_)
-- 5. Copy the customer ID (starts with cus_)
-- 6. Replace the placeholders above and run the UPDATE query