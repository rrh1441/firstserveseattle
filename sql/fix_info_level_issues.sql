-- =============================================================================
-- FIX INFO-LEVEL ADVISOR ISSUES (Optional)
-- =============================================================================
-- These are low priority but easy wins
-- =============================================================================

BEGIN;

-- =============================================================================
-- PART 1: ADD MISSING FOREIGN KEY INDEXES
-- =============================================================================
-- These indexes improve JOIN performance on foreign key columns

CREATE INDEX IF NOT EXISTS idx_email_logs_booking_id
  ON public.email_logs(booking_id);

CREATE INDEX IF NOT EXISTS idx_facility_reviews_user_id
  ON public.facility_reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_qr_scans_facility_id
  ON public.qr_scans(facility_id);

CREATE INDEX IF NOT EXISTS idx_session_credits_purchase_id
  ON public.session_credits(purchase_id);

COMMIT;

-- =============================================================================
-- NOT FIXING (by design):
-- =============================================================================
--
-- 1. NO PRIMARY KEY on tmp_* tables
--    These are temporary staging tables - primary keys not needed
--
-- 2. NO PRIMARY KEY on backup.* tables
--    These are backup snapshots - primary keys not critical
--
-- 3. UNUSED INDEXES
--    Risky to drop - they might be used by:
--    - Infrequent queries (monthly reports, etc.)
--    - Queries that haven't run since last stats reset
--    - Future features
--
--    If you want to clean up unused indexes, first run this query
--    to see actual usage stats, then decide case-by-case:
--
--    SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
--    FROM pg_stat_user_indexes
--    WHERE idx_scan = 0
--    ORDER BY tablename, indexname;
--
-- 4. AUTH DB CONNECTIONS
--    This is configured in Supabase Dashboard:
--    Settings > Auth > Database Connections
--    Change from absolute (10) to percentage (e.g., 10%)
--
-- =============================================================================
