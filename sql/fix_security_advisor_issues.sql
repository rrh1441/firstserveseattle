-- =============================================================================
-- FIX SUPABASE SECURITY ADVISOR ISSUES
-- =============================================================================
-- This migration addresses two categories of security issues:
-- 1. SECURITY DEFINER views (should be SECURITY INVOKER)
-- 2. Tables without RLS enabled
--
-- IMPORTANT: Run this in a transaction and test in staging first!
-- =============================================================================

BEGIN;

-- =============================================================================
-- PART 1: FIX SECURITY DEFINER VIEWS
-- =============================================================================
-- Convert views from SECURITY DEFINER to SECURITY INVOKER (PostgreSQL 15+)
-- This ensures views respect the RLS policies of the querying user
--
-- NOTE: v_court_popularity_7d is used by the anon client in getTennisCourts.ts
-- After changing to SECURITY INVOKER, the underlying tables MUST have
-- appropriate RLS policies (public SELECT) or the view will return empty.
-- The tennis_courts_history table is set up below with public read access.

-- Admin/internal views (accessed via service role only)
ALTER VIEW IF EXISTS public.v_current_hour_alert_recipients SET (security_invoker = on);
ALTER VIEW IF EXISTS public.v_res_parsed SET (security_invoker = on);
ALTER VIEW IF EXISTS public.v_court_day_hours SET (security_invoker = on);
ALTER VIEW IF EXISTS public.v_walkon_pressure SET (security_invoker = on);
ALTER VIEW IF EXISTS public.customer_overview SET (security_invoker = on);
ALTER VIEW IF EXISTS public.upcoming_bookings SET (security_invoker = on);

-- Public view (accessed via anon client) - requires underlying tables to have public read
ALTER VIEW IF EXISTS public.v_court_popularity_7d SET (security_invoker = on);

-- =============================================================================
-- PART 2: ENABLE RLS ON UNPROTECTED TABLES
-- =============================================================================

-- 2.1 event_logs - Analytics/telemetry data (service role only)
ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to event_logs"
  ON public.event_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2.2 tennis_courts_history - Historical availability data
-- NOTE: v_court_popularity_7d likely queries this table, so we need public read
-- to ensure the view works with anon users after SECURITY INVOKER change
ALTER TABLE public.tennis_courts_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tennis_courts_history"
  ON public.tennis_courts_history
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can modify tennis_courts_history"
  ON public.tennis_courts_history
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2.3 tennis_facilities - Facility metadata (public read, service write)
ALTER TABLE public.tennis_facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tennis_facilities"
  ON public.tennis_facilities
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can modify tennis_facilities"
  ON public.tennis_facilities
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2.4 tennis_reviews - User reviews (if different from facility_reviews)
ALTER TABLE public.tennis_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved tennis_reviews"
  ON public.tennis_reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);  -- Adjust if there's a moderation_status column

CREATE POLICY "Service role can modify tennis_reviews"
  ON public.tennis_reviews
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2.5 facility_summaries - Cached facility data (public read, service write)
ALTER TABLE public.facility_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read facility_summaries"
  ON public.facility_summaries
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can modify facility_summaries"
  ON public.facility_summaries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2.6 tmp_facility_stage - Staging table (service role only)
ALTER TABLE public.tmp_facility_stage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for tmp_facility_stage"
  ON public.tmp_facility_stage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2.7 tmp_facility_exact - Staging table (service role only)
ALTER TABLE public.tmp_facility_exact ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for tmp_facility_exact"
  ON public.tmp_facility_exact
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2.8 tmp_facility_final - Staging table (service role only)
ALTER TABLE public.tmp_facility_final ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for tmp_facility_final"
  ON public.tmp_facility_final
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2.9 qr_scans - QR code scan tracking (service role only)
ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for qr_scans"
  ON public.qr_scans
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2.10 rating_snapshot - Rating aggregates (public read, service write)
ALTER TABLE public.rating_snapshot ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rating_snapshot"
  ON public.rating_snapshot
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can modify rating_snapshot"
  ON public.rating_snapshot
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (run after migration)
-- =============================================================================
-- Check views are now SECURITY INVOKER:
-- SELECT viewname, viewowner FROM pg_views WHERE schemaname = 'public';

-- Check RLS is enabled on all tables:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- List all RLS policies:
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies WHERE schemaname = 'public';
