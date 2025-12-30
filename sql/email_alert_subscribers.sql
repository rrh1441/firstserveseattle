-- Email Alert Subscribers Table
-- Stores users who signed up for the 7-day email trial extension
-- They receive personalized court availability alerts based on their preferences

CREATE TABLE IF NOT EXISTS email_alert_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT,

    -- Trial tracking
    extension_granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    extension_expires_at TIMESTAMPTZ NOT NULL,  -- granted_at + 7 days
    converted_to_paid BOOLEAN DEFAULT FALSE,
    converted_at TIMESTAMPTZ,

    -- Court preferences (array of court IDs from tennis_courts table)
    selected_courts INTEGER[] DEFAULT '{}',

    -- Day preferences (0=Sunday, 1=Monday, ..., 6=Saturday)
    selected_days INTEGER[] DEFAULT '{1,2,3,4,5}',  -- weekdays default

    -- Time preferences (hour range, 24h format)
    preferred_start_hour INTEGER DEFAULT 6,   -- 6am
    preferred_end_hour INTEGER DEFAULT 21,    -- 9pm

    -- Alert delivery time (hour when user wants to receive alerts, PT timezone)
    alert_hour INTEGER DEFAULT 7,  -- 7am PT

    -- Status
    alerts_enabled BOOLEAN DEFAULT TRUE,
    unsubscribe_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    unsubscribed_at TIMESTAMPTZ,

    -- Stats
    emails_sent INTEGER DEFAULT 0,
    last_email_sent_at TIMESTAMPTZ,

    -- Analytics
    source TEXT DEFAULT 'paywall_extension',  -- Track where they signed up
    ab_group TEXT,  -- A/B test group if applicable

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_eas_email ON email_alert_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_eas_alerts_enabled ON email_alert_subscribers(alerts_enabled)
    WHERE alerts_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_eas_alert_hour ON email_alert_subscribers(alert_hour);
CREATE INDEX IF NOT EXISTS idx_eas_expires ON email_alert_subscribers(extension_expires_at);
CREATE INDEX IF NOT EXISTS idx_eas_days ON email_alert_subscribers USING GIN(selected_days);
CREATE INDEX IF NOT EXISTS idx_eas_courts ON email_alert_subscribers USING GIN(selected_courts);
CREATE INDEX IF NOT EXISTS idx_eas_unsubscribe_token ON email_alert_subscribers(unsubscribe_token);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_eas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_eas_updated_at ON email_alert_subscribers;
CREATE TRIGGER trigger_eas_updated_at
    BEFORE UPDATE ON email_alert_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_eas_updated_at();

-- View to get users who should receive alerts at the current hour
-- Filters by: alerts enabled, not unsubscribed, extension not expired, today is in their selected days
CREATE OR REPLACE VIEW v_current_hour_alert_recipients AS
SELECT
    eas.*,
    EXTRACT(DOW FROM NOW() AT TIME ZONE 'America/Los_Angeles')::INTEGER AS today_dow,
    EXTRACT(HOUR FROM NOW() AT TIME ZONE 'America/Los_Angeles')::INTEGER AS current_hour_pt
FROM email_alert_subscribers eas
WHERE eas.alerts_enabled = TRUE
  AND eas.unsubscribed_at IS NULL
  AND eas.extension_expires_at > NOW()
  AND EXTRACT(HOUR FROM NOW() AT TIME ZONE 'America/Los_Angeles')::INTEGER = eas.alert_hour
  AND EXTRACT(DOW FROM NOW() AT TIME ZONE 'America/Los_Angeles')::INTEGER = ANY(eas.selected_days);

-- Email alert logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_alert_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id UUID NOT NULL REFERENCES email_alert_subscribers(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    courts_included INTEGER[] NOT NULL,
    slots_included INTEGER NOT NULL,
    email_type TEXT DEFAULT 'daily_alert',  -- 'daily_alert', 'welcome', 'expiration_reminder'
    resend_message_id TEXT,

    -- Tracking (can be updated via webhooks)
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_eal_subscriber ON email_alert_logs(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_eal_sent_at ON email_alert_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_eal_email_type ON email_alert_logs(email_type);

-- Enable Row Level Security
ALTER TABLE email_alert_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_alert_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Service role can do everything, anon can insert (for signup)
CREATE POLICY "Service role full access to email_alert_subscribers"
    ON email_alert_subscribers
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Anon can insert email_alert_subscribers"
    ON email_alert_subscribers
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Users can read own email_alert_subscribers by token"
    ON email_alert_subscribers
    FOR SELECT
    TO anon
    USING (true);  -- Token validation happens in application layer

CREATE POLICY "Service role full access to email_alert_logs"
    ON email_alert_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
