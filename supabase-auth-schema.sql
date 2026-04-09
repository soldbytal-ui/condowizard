-- CondoWizard Auth & VOW Compliance Schema
-- Run in Supabase SQL editor

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  vow_agreed BOOLEAN DEFAULT false,
  vow_agreed_at TIMESTAMPTZ,
  avatar_url TEXT,
  preferred_areas TEXT[],
  is_agent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activity log (TREB audit trail — retain 180+ days)
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  listing_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON user_activity_log(created_at DESC);

-- Saved listings
CREATE TABLE IF NOT EXISTS saved_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('mls', 'precon')),
  list_id UUID REFERENCES saved_lists(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, listing_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_listings(user_id);

-- Saved lists (collections)
CREATE TABLE IF NOT EXISTS saved_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Saved searches with alerts
CREATE TABLE IF NOT EXISTS user_saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT,
  filters_json JSONB NOT NULL,
  alert_frequency TEXT DEFAULT 'daily' CHECK (alert_frequency IN ('daily', 'weekly', 'instant', 'none')),
  last_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_searches ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can manage their own saved data
CREATE POLICY "Users manage own saved listings" ON saved_listings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own saved lists" ON saved_lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own saved searches" ON user_saved_searches FOR ALL USING (auth.uid() = user_id);

-- Activity log: users can insert, only read their own
CREATE POLICY "Users insert activity" ON user_activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own activity" ON user_activity_log FOR SELECT USING (auth.uid() = user_id);

-- Auto-create default "Favourites" list on profile creation
CREATE OR REPLACE FUNCTION create_default_list()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO saved_lists (user_id, name, is_default) VALUES (NEW.id, 'Favourites', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_created ON user_profiles;
CREATE TRIGGER on_profile_created AFTER INSERT ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION create_default_list();
