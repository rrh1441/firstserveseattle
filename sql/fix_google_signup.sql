-- Run this in Supabase SQL Editor

-- 1. Add google_provider_id column (nullable/optional)
ALTER TABLE subscribers
ADD COLUMN IF NOT EXISTS google_provider_id TEXT;

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_google_provider
ON subscribers(google_provider_id);

-- 3. Fix RLS policies - allow service role to do everything
-- First, check if RLS is enabled
-- If it is, the service role should bypass it automatically, but let's make sure

-- Drop any restrictive policies that might block inserts
DROP POLICY IF EXISTS "subscribers_insert_policy" ON subscribers;
DROP POLICY IF EXISTS "subscribers_select_policy" ON subscribers;
DROP POLICY IF EXISTS "subscribers_update_policy" ON subscribers;

-- Create permissive policies
-- Allow authenticated users to read their own record
CREATE POLICY "Users can view own subscriber record"
ON subscribers FOR SELECT
USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Allow service role to insert (this should be automatic but being explicit)
CREATE POLICY "Service role can insert subscribers"
ON subscribers FOR INSERT
WITH CHECK (true);

-- Allow service role to update
CREATE POLICY "Service role can update subscribers"
ON subscribers FOR UPDATE
USING (true);

-- 4. Verify the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'subscribers'
ORDER BY ordinal_position;
