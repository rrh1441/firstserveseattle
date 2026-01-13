-- =============================================================================
-- FIX SUPABASE PERFORMANCE WARNINGS
-- =============================================================================
-- This migration addresses performance issues:
-- 1. auth_rls_initplan - Wrap auth.uid() in (SELECT ...) for better perf
-- 2. multiple_permissive_policies - Consolidate overlapping policies
-- 3. duplicate_index - Remove duplicate indexes
-- =============================================================================

BEGIN;

-- =============================================================================
-- PART 1: FIX AUTH RLS INITPLAN - SERVICE ROLE POLICIES
-- =============================================================================
-- These tables have "Service role has full access" policies that trigger warnings.
-- Fix by recreating with explicit TO service_role (not PUBLIC).

-- 1.1 bookings table
DROP POLICY IF EXISTS "Service role has full access" ON public.bookings;
CREATE POLICY "Service role full access"
  ON public.bookings FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 1.2 calendly_webhooks table
DROP POLICY IF EXISTS "Service role has full access" ON public.calendly_webhooks;
CREATE POLICY "Service role full access"
  ON public.calendly_webhooks FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 1.3 customers table
DROP POLICY IF EXISTS "Service role has full access" ON public.customers;
CREATE POLICY "Service role full access"
  ON public.customers FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 1.4 email_logs table
DROP POLICY IF EXISTS "Service role has full access" ON public.email_logs;
CREATE POLICY "Service role full access"
  ON public.email_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 1.5 manual_adjustments table
DROP POLICY IF EXISTS "Service role has full access" ON public.manual_adjustments;
CREATE POLICY "Service role full access"
  ON public.manual_adjustments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 1.6 purchases table
DROP POLICY IF EXISTS "Service role has full access" ON public.purchases;
CREATE POLICY "Service role full access"
  ON public.purchases FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 1.7 session_credits table
DROP POLICY IF EXISTS "Service role has full access" ON public.session_credits;
CREATE POLICY "Service role full access"
  ON public.session_credits FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 1.8 session_usage table
DROP POLICY IF EXISTS "Service role has full access" ON public.session_usage;
CREATE POLICY "Service role full access"
  ON public.session_usage FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 1.9 subscribers table
DROP POLICY IF EXISTS "service-role only" ON public.subscribers;
CREATE POLICY "Service role only"
  ON public.subscribers FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =============================================================================
-- PART 2: FIX USER-SPECIFIC POLICIES WITH (SELECT auth.uid())
-- =============================================================================
-- These need to be recreated with the optimized auth.uid() call.
-- We use DO blocks to check if columns exist before creating policies.

DO $$
BEGIN
  -- bookings.user_id
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'user_id') THEN
    DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
    CREATE POLICY "Users can view own bookings"
      ON public.bookings FOR SELECT TO authenticated
      USING (user_id = (SELECT auth.uid()));
  END IF;

  -- customers.user_id
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'user_id') THEN
    DROP POLICY IF EXISTS "Users can view own customer data" ON public.customers;
    CREATE POLICY "Users can view own customer data"
      ON public.customers FOR SELECT TO authenticated
      USING (user_id = (SELECT auth.uid()));
  END IF;

  -- purchases.user_id
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'purchases' AND column_name = 'user_id') THEN
    DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;
    CREATE POLICY "Users can view own purchases"
      ON public.purchases FOR SELECT TO authenticated
      USING (user_id = (SELECT auth.uid()));
  END IF;

  -- session_credits.user_id
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'session_credits' AND column_name = 'user_id') THEN
    DROP POLICY IF EXISTS "Users can view own session credits" ON public.session_credits;
    CREATE POLICY "Users can view own session credits"
      ON public.session_credits FOR SELECT TO authenticated
      USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- =============================================================================
-- PART 3: FIX FACILITY_REVIEWS POLICIES
-- =============================================================================
-- Consolidate multiple SELECT policies into one

DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users can view their own pending reviews" ON public.facility_reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.facility_reviews;

-- Combined SELECT policy: approved reviews OR own pending reviews
CREATE POLICY "View approved or own pending reviews"
  ON public.facility_reviews FOR SELECT TO anon, authenticated
  USING (
    moderation_status = 'approved'
    OR (user_id = (SELECT auth.uid()) AND moderation_status = 'pending')
  );

-- INSERT policy with optimized auth.uid()
CREATE POLICY "Insert own reviews"
  ON public.facility_reviews FOR INSERT TO anon, authenticated
  WITH CHECK (
    user_id IS NULL
    OR user_id = (SELECT auth.uid())
  );

-- =============================================================================
-- PART 2: FIX MULTIPLE PERMISSIVE POLICIES
-- =============================================================================
-- The consolidated policies above already fix this by:
-- - Removing "Service role has full access" from anon/authenticated SELECT
-- - Combining view conditions into single policies
--
-- Service role policies use TO service_role (not TO anon, authenticated)
-- so they won't overlap with user policies.

-- =============================================================================
-- PART 4: DROP DUPLICATE INDEXES/CONSTRAINTS
-- =============================================================================
-- These are UNIQUE constraints backing indexes, so we drop constraints not indexes

-- 3.1 subscribers table - keep subscribers_pkey, drop duplicate unique constraints
-- The pkey already enforces uniqueness, so extra email constraints are redundant
ALTER TABLE public.subscribers DROP CONSTRAINT IF EXISTS subscribers_email_key;
ALTER TABLE public.subscribers DROP CONSTRAINT IF EXISTS unique_email;

-- 3.2 subscribers_duplicate table - appears to be unused backup table
-- Consider dropping entire table: DROP TABLE IF EXISTS public.subscribers_duplicate;
ALTER TABLE public.subscribers_duplicate DROP CONSTRAINT IF EXISTS subscribers_duplicate_email_key;
ALTER TABLE public.subscribers_duplicate DROP CONSTRAINT IF EXISTS subscribers_duplicate_email_key1;

COMMIT;

-- =============================================================================
-- NOTES
-- =============================================================================
--
-- 1. The service_role policies now only apply TO service_role, not all roles.
--    This prevents the "multiple permissive policies" warning.
--
-- 2. User-specific policies use (SELECT auth.uid()) instead of auth.uid()
--    for better query planning.
--
-- 3. The subscribers_duplicate table appears to be a backup/legacy table.
--    Consider dropping it entirely if unused:
--    DROP TABLE IF EXISTS public.subscribers_duplicate;
--
-- =============================================================================
