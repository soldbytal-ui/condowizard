-- CondoWizard.ca Supabase Schema
-- Run this in the Supabase SQL editor

-- Pre-construction projects
CREATE TABLE IF NOT EXISTS precon_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address TEXT,
  city TEXT DEFAULT 'Toronto',
  neighborhood TEXT,
  community TEXT,
  lat FLOAT,
  lng FLOAT,
  developer TEXT,
  architect TEXT,
  price_from INTEGER,
  price_to INTEGER,
  price_per_sqft INTEGER,
  beds_from INTEGER,
  beds_to INTEGER,
  baths_from INTEGER,
  baths_to INTEGER,
  sqft_from INTEGER,
  sqft_to INTEGER,
  floors INTEGER,
  units INTEGER,
  occupancy_year INTEGER CHECK (occupancy_year IS NULL OR (occupancy_year >= 2026 AND occupancy_year <= 2035)),
  occupancy_quarter TEXT CHECK (occupancy_quarter IS NULL OR occupancy_quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
  status TEXT DEFAULT 'Selling' CHECK (status IN ('Selling', 'Upcoming', 'Sold Out', 'Registration')),
  building_type TEXT DEFAULT 'condo' CHECK (building_type IN ('condo', 'townhome', 'stacked-townhome', 'detached', 'mixed')),
  description TEXT,
  features TEXT[],
  amenities TEXT[],
  deposit_structure TEXT,
  incentives TEXT,
  walk_score INTEGER,
  transit_score INTEGER,
  images TEXT[],
  floorplan_images TEXT[],
  brochure_url TEXT,
  website_url TEXT,
  source TEXT CHECK (source IS NULL OR source IN ('manual', 'livabl', 'gtahomes', 'precondo', 'buzzbuzzhome')),
  source_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_precon_slug ON precon_projects (slug);
CREATE INDEX IF NOT EXISTS idx_precon_neighborhood ON precon_projects (neighborhood);
CREATE INDEX IF NOT EXISTS idx_precon_status ON precon_projects (status);
CREATE INDEX IF NOT EXISTS idx_precon_developer ON precon_projects (developer);
CREATE INDEX IF NOT EXISTS idx_precon_published ON precon_projects (is_published);

-- Pre-construction developers
CREATE TABLE IF NOT EXISTS precon_developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  website TEXT,
  description TEXT,
  projects_count INTEGER DEFAULT 0,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Neighborhoods with TRREB boundaries
CREATE TABLE IF NOT EXISTS neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  community_code TEXT,
  description TEXT,
  image_url TEXT,
  boundary_geojson JSONB,
  avg_price INTEGER,
  avg_rent INTEGER,
  walk_score INTEGER,
  transit_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_neighborhoods_slug ON neighborhoods (slug);
CREATE INDEX IF NOT EXISTS idx_neighborhoods_community ON neighborhoods (community_code);

-- Leads (enhanced)
CREATE TABLE IF NOT EXISTS leads_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  listing_id TEXT,
  listing_type TEXT CHECK (listing_type IS NULL OR listing_type IN ('mls', 'precon')),
  source TEXT DEFAULT 'listing_page' CHECK (source IN ('listing_page', 'chat', 'contact', 'saved_search')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_v2_email ON leads_v2 (email);
CREATE INDEX IF NOT EXISTS idx_leads_v2_created ON leads_v2 (created_at DESC);

-- Blog posts
CREATE TABLE IF NOT EXISTS blog_posts_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  slug TEXT UNIQUE,
  content TEXT,
  excerpt TEXT,
  image_url TEXT,
  author TEXT DEFAULT 'Tal Shelef',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Saved searches / alerts
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT,
  name TEXT,
  filters_json JSONB,
  alert_frequency TEXT DEFAULT 'daily' CHECK (alert_frequency IN ('daily', 'weekly', 'instant')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_email ON saved_searches (user_email);

-- Updated_at trigger for precon_projects
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_precon_projects_updated_at ON precon_projects;
CREATE TRIGGER update_precon_projects_updated_at
    BEFORE UPDATE ON precon_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE precon_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE precon_developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public read precon_projects" ON precon_projects FOR SELECT USING (is_published = true);
CREATE POLICY "Public read precon_developers" ON precon_developers FOR SELECT USING (true);
CREATE POLICY "Public read neighborhoods" ON neighborhoods FOR SELECT USING (true);

-- Public insert for leads
CREATE POLICY "Public insert leads" ON leads_v2 FOR INSERT WITH CHECK (true);

-- Public insert for saved searches
CREATE POLICY "Public insert saved_searches" ON saved_searches FOR INSERT WITH CHECK (true);
