-- Tennis facility reviews table
CREATE TABLE IF NOT EXISTS facility_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_slug TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 5),
  review_text TEXT,
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  moderation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Anonymous user info (if not logged in)
  reviewer_name TEXT,
  reviewer_email TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_facility_reviews_slug ON facility_reviews(facility_slug);
CREATE INDEX IF NOT EXISTS idx_facility_reviews_status ON facility_reviews(moderation_status);
CREATE INDEX IF NOT EXISTS idx_facility_reviews_created ON facility_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_facility_reviews_approved_slug ON facility_reviews(facility_slug, moderation_status) WHERE moderation_status = 'approved';

-- Row Level Security
ALTER TABLE facility_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON facility_reviews;
CREATE POLICY "Reviews are viewable by everyone" ON facility_reviews
  FOR SELECT USING (moderation_status = 'approved');

DROP POLICY IF EXISTS "Users can insert their own reviews" ON facility_reviews;
CREATE POLICY "Users can insert their own reviews" ON facility_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can view their own pending reviews" ON facility_reviews;
CREATE POLICY "Users can view their own pending reviews" ON facility_reviews
  FOR SELECT USING (auth.uid() = user_id AND moderation_status = 'pending');

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_facility_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS facility_reviews_updated_at ON facility_reviews;
CREATE TRIGGER facility_reviews_updated_at
  BEFORE UPDATE ON facility_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_facility_reviews_updated_at();