-- Add identity columns to subscribers table
-- This links subscribers to auth.users and stores Apple provider ID

-- Add user_id column (references Supabase auth.users)
ALTER TABLE subscribers
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add apple_provider_id column (Apple's stable 'sub' identifier)
ALTER TABLE subscribers
ADD COLUMN IF NOT EXISTS apple_provider_id TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_apple_provider_id ON subscribers(apple_provider_id);

-- Backfill user_id from auth.users by matching email
UPDATE subscribers s
SET user_id = u.id
FROM auth.users u
WHERE LOWER(s.email) = LOWER(u.email)
AND s.user_id IS NULL;

-- Backfill apple_provider_id for Apple OAuth users
-- Supabase stores identities as a jsonb array
UPDATE subscribers s
SET apple_provider_id = identity->>'id'
FROM auth.users u,
LATERAL jsonb_array_elements(u.raw_user_meta_data->'identities') AS identity
WHERE LOWER(s.email) = LOWER(u.email)
AND identity->>'provider' = 'apple'
AND s.apple_provider_id IS NULL;

-- Report results
DO $$
DECLARE
  total_subscribers INTEGER;
  linked_by_user_id INTEGER;
  linked_by_apple INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_subscribers FROM subscribers;
  SELECT COUNT(*) INTO linked_by_user_id FROM subscribers WHERE user_id IS NOT NULL;
  SELECT COUNT(*) INTO linked_by_apple FROM subscribers WHERE apple_provider_id IS NOT NULL;

  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  Total subscribers: %', total_subscribers;
  RAISE NOTICE '  Linked by user_id: %', linked_by_user_id;
  RAISE NOTICE '  Linked by Apple ID: %', linked_by_apple;
END $$;
