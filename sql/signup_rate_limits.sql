-- Signup Rate Limiting Table
-- Tracks signup attempts by IP and fingerprint to prevent abuse of free trials

CREATE TABLE IF NOT EXISTS signup_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    fingerprint TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    blocked BOOLEAN DEFAULT FALSE  -- True if this attempt was blocked
);

-- Indexes for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_signup_attempts_ip ON signup_attempts(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_signup_attempts_fingerprint ON signup_attempts(fingerprint, created_at)
    WHERE fingerprint IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_signup_attempts_created ON signup_attempts(created_at);

-- Enable RLS
ALTER TABLE signup_attempts ENABLE ROW LEVEL SECURITY;

-- Only service role can access (server-side only)
CREATE POLICY "Service role full access to signup_attempts"
    ON signup_attempts
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Helper function to check IP rate limits
-- Returns: { allowed: boolean, reason: string | null }
CREATE OR REPLACE FUNCTION check_ip_rate_limit(check_ip TEXT)
RETURNS TABLE(allowed BOOLEAN, reason TEXT) AS $$
DECLARE
    daily_count INTEGER;
    weekly_count INTEGER;
    monthly_count INTEGER;
BEGIN
    -- Count successful signups (not blocked) in last 24 hours
    SELECT COUNT(*) INTO daily_count
    FROM signup_attempts
    WHERE ip_address = check_ip
      AND blocked = FALSE
      AND created_at > NOW() - INTERVAL '24 hours';

    IF daily_count >= 3 THEN
        RETURN QUERY SELECT FALSE, 'Too many signups today. Please try again tomorrow.';
        RETURN;
    END IF;

    -- Count in last 7 days
    SELECT COUNT(*) INTO weekly_count
    FROM signup_attempts
    WHERE ip_address = check_ip
      AND blocked = FALSE
      AND created_at > NOW() - INTERVAL '7 days';

    IF weekly_count >= 4 THEN
        RETURN QUERY SELECT FALSE, 'Weekly signup limit reached. Please try again next week.';
        RETURN;
    END IF;

    -- Count in last 30 days
    SELECT COUNT(*) INTO monthly_count
    FROM signup_attempts
    WHERE ip_address = check_ip
      AND blocked = FALSE
      AND created_at > NOW() - INTERVAL '30 days';

    IF monthly_count >= 5 THEN
        RETURN QUERY SELECT FALSE, 'Monthly signup limit reached. Please try again next month.';
        RETURN;
    END IF;

    RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check fingerprint rate limit
-- Returns: { allowed: boolean, reason: string | null }
CREATE OR REPLACE FUNCTION check_fingerprint_rate_limit(check_fp TEXT)
RETURNS TABLE(allowed BOOLEAN, reason TEXT) AS $$
DECLARE
    monthly_count INTEGER;
BEGIN
    IF check_fp IS NULL THEN
        -- No fingerprint provided, allow (but IP limits still apply)
        RETURN QUERY SELECT TRUE, NULL::TEXT;
        RETURN;
    END IF;

    -- Count in last 30 days
    SELECT COUNT(*) INTO monthly_count
    FROM signup_attempts
    WHERE fingerprint = check_fp
      AND blocked = FALSE
      AND created_at > NOW() - INTERVAL '30 days';

    IF monthly_count >= 1 THEN
        RETURN QUERY SELECT FALSE, 'You have already signed up for a free trial this month.';
        RETURN;
    END IF;

    RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old records (run periodically via cron)
-- Keep 90 days of history for analysis
CREATE OR REPLACE FUNCTION cleanup_old_signup_attempts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM signup_attempts
    WHERE created_at < NOW() - INTERVAL '90 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
