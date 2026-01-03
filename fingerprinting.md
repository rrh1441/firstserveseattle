 Summary

  1. Fingerprinting (Client-side)

  - Added @fingerprintjs/fingerprintjs to capture stable device ID
  - EmailCaptureModal.tsx now captures fingerprint on load and sends it with signup

  2. Rate Limiting (Server-side)

  IP limits:
  - 3 signups per day
  - 4 signups per week
  - 5 signups per month

  Fingerprint limit:
  - 1 signup per month per device

  3. New Database Table

  Created sql/signup_rate_limits.sql with:
  - signup_attempts table to track all attempts
  - Indexes for fast lookups by IP and fingerprint
  - Helper cleanup function for old records

  To Deploy

  Run the SQL in Supabase:
  -- Copy contents of sql/signup_rate_limits.sql and run in Supabase SQL editor

  How It Works

  1. User submits email → fingerprint collected silently
  2. Server extracts IP from headers (x-forwarded-for, etc.)
  3. Check counts in signup_attempts table
  4. Block with friendly message if limits exceeded
  5. Log attempt (blocked or successful)
  6. Proceed with trial creation if allowed

  The error messages are user-friendly ("Too many signups today", "You've already signed up this month") rather than technical.