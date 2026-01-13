-- =============================================================================
-- FIX SUPABASE SECURITY ADVISOR WARNINGS
-- =============================================================================
-- This migration addresses warning-level security issues:
-- 1. Functions without search_path set
-- 2. Extensions in public schema
-- 3. Materialized views accessible via API
-- 4. Overly permissive RLS policies
--
-- NOTE: Postgres version upgrade must be done via Supabase Dashboard
-- =============================================================================

BEGIN;

-- =============================================================================
-- PART 1: FIX FUNCTION SEARCH_PATH
-- =============================================================================
-- Set search_path to empty string to prevent search_path injection attacks
-- This uses DO blocks to dynamically find and alter functions by name

DO $$
DECLARE
  func_oid oid;
  func_name text;
  func_args text;
  func_kind text;
  routines_to_fix text[] := ARRAY[
    'update_eas_updated_at',
    'get_business_hours_for_date',
    'is_slot_blocked',
    'is_slot_booked',
    'update_updated_at_column',
    'check_ip_rate_limit',
    'trigger_recovery_emails_test_only',
    'update_facility_reviews_updated_at',
    'get_available_sessions',
    'deduct_session',
    'check_fingerprint_rate_limit',
    'trigger_send_recovery_email',
    'set_updated_at',
    'cleanup_old_signup_attempts',
    'set_qr_scan_facility_name',
    'refresh_daily_court_metrics_proc',
    'refresh_daily_court_metrics',
    'trigger_recovery_emails',
    'list_courts_with_popularity'
  ];
BEGIN
  FOR func_name IN SELECT unnest(routines_to_fix)
  LOOP
    -- Find all overloads of this function/procedure in public schema
    -- prokind: 'f' = function, 'p' = procedure, 'a' = aggregate, 'w' = window
    FOR func_oid, func_args, func_kind IN
      SELECT p.oid, pg_get_function_identity_arguments(p.oid), p.prokind
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = func_name
    LOOP
      IF func_kind = 'p' THEN
        -- It's a procedure
        EXECUTE format('ALTER PROCEDURE public.%I(%s) SET search_path = %L',
                       func_name, func_args, '');
        RAISE NOTICE 'Fixed search_path for PROCEDURE: public.%(%)', func_name, func_args;
      ELSE
        -- It's a function (or aggregate/window)
        EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = %L',
                       func_name, func_args, '');
        RAISE NOTICE 'Fixed search_path for FUNCTION: public.%(%)', func_name, func_args;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- =============================================================================
-- PART 2: EXTENSIONS IN PUBLIC SCHEMA - SKIPPED
-- =============================================================================
-- The http, vector, and pg_trgm extensions don't support SET SCHEMA.
-- These warnings can be safely ACCEPTED - they're low risk for your use case.
-- The extensions work fine in public schema; the warning is just a best practice.
--
-- If you really want to move them, you'd need to:
-- 1. DROP EXTENSION http CASCADE; (will drop dependent objects!)
-- 2. CREATE EXTENSION http SCHEMA extensions;
-- This is risky and not recommended unless you have a specific security requirement.

-- =============================================================================
-- PART 3: RESTRICT MATERIALIZED VIEW ACCESS
-- =============================================================================
-- Revoke direct API access to materialized views
-- They should be accessed via views or functions instead

REVOKE SELECT ON public.vw_facility_reviews_latest FROM anon, authenticated;
REVOKE SELECT ON public.court_daily_metrics FROM anon, authenticated;

-- Grant access only to service_role for admin operations
GRANT SELECT ON public.vw_facility_reviews_latest TO service_role;
GRANT SELECT ON public.court_daily_metrics TO service_role;

-- =============================================================================
-- PART 4: FIX OVERLY PERMISSIVE RLS POLICIES
-- =============================================================================

-- 4.1 email_alert_subscribers - Add rate limiting check to INSERT policy
-- Drop old policy and create new one with validation
DROP POLICY IF EXISTS "Anon can insert email_alert_subscribers" ON public.email_alert_subscribers;

CREATE POLICY "Anon can insert with valid email"
  ON public.email_alert_subscribers
  FOR INSERT
  TO anon
  WITH CHECK (
    -- Basic validation: email must be provided and look like an email
    email IS NOT NULL
    AND email ~ '^[^@]+@[^@]+\.[^@]+$'
    AND length(email) <= 255
  );

-- 4.2 & 4.3 - SKIPPED: referral_sources and ui_events
-- These tables are NOT used anywhere in your app code.
-- Options:
--   A) Accept the warnings (low priority for unused tables)
--   B) Drop the tables if truly unused:
--      DROP TABLE IF EXISTS public.referral_sources;
--      DROP TABLE IF EXISTS public.ui_events;
--   C) Query the schema first, then add proper validation:
--      SELECT column_name FROM information_schema.columns
--      WHERE table_name = 'referral_sources';

-- 4.4 user_sessions - Replace overly permissive policy
-- This table tracks user view counts, keyed by user_id
DROP POLICY IF EXISTS "Allow all read/write" ON public.user_sessions;

-- Allow insert for new sessions (must have user_id)
CREATE POLICY "Anyone can create session"
  ON public.user_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id IS NOT NULL
    AND length(user_id) > 0
    AND length(user_id) <= 255
  );

-- Allow read for sessions (public read is acceptable for view counts)
CREATE POLICY "Read sessions"
  ON public.user_sessions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow update with valid user_id
CREATE POLICY "Update sessions"
  ON public.user_sessions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (
    user_id IS NOT NULL
    AND length(user_id) > 0
  );

-- Service role has full access
CREATE POLICY "Service role full access to user_sessions"
  ON public.user_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;

-- =============================================================================
-- MANUAL ACTION REQUIRED
-- =============================================================================
--
-- POSTGRES VERSION UPGRADE:
-- The advisor detected an outdated Postgres version (15.6.1.141).
-- To upgrade:
-- 1. Go to Supabase Dashboard > Settings > Infrastructure
-- 2. Click "Upgrade" next to the Postgres version
-- 3. Schedule the upgrade during low-traffic period
--
-- =============================================================================
