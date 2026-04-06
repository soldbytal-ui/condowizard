-- CondoWizard.ca Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Neighborhoods
CREATE TABLE IF NOT EXISTS neighborhoods (
  id TEXT PRIMARY KEY DEFAULT replace(uuid_generate_v4()::text, '-', ''),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  region TEXT,
  description TEXT,
  "avgPriceStudio" INTEGER,
  "avgPrice1br" INTEGER,
  "avgPrice2br" INTEGER,
  "avgPrice3br" INTEGER,
  "avgPricePenthouse" INTEGER,
  "lifestyleDescription" TEXT,
  "imageUrl" TEXT,
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "displayOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Developers
CREATE TABLE IF NOT EXISTS developers (
  id TEXT PRIMARY KEY DEFAULT replace(uuid_generate_v4()::text, '-', ''),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  headquarters TEXT,
  "foundedYear" INTEGER,
  "logoUrl" TEXT,
  "websiteUrl" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY DEFAULT replace(uuid_generate_v4()::text, '-', ''),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address TEXT,
  "neighborhoodId" TEXT REFERENCES neighborhoods(id),
  "developerId" TEXT REFERENCES developers(id),
  architect TEXT,
  status TEXT DEFAULT 'PRE_CONSTRUCTION',
  "estCompletion" TEXT,
  "totalUnits" INTEGER,
  floors INTEGER,
  "priceMin" INTEGER,
  "priceMax" INTEGER,
  "pricePerSqft" INTEGER,
  "sizeRangeMin" INTEGER,
  "sizeRangeMax" INTEGER,
  "depositStructure" TEXT,
  description TEXT,
  amenities JSONB,
  images JSONB,
  footprint JSONB,
  "modelUrl" TEXT,
  "mainImageUrl" TEXT,
  category TEXT DEFAULT 'PREMIUM',
  "websiteUrl" TEXT,
  featured BOOLEAN DEFAULT FALSE,
  "unitTypes" TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  "longDescription" TEXT,
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "faqJson" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_neighborhood ON projects("neighborhoodId");
CREATE INDEX IF NOT EXISTS idx_projects_developer ON projects("developerId");
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);

-- Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY DEFAULT replace(uuid_generate_v4()::text, '-', ''),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  "targetKeyword" TEXT,
  "featuredImage" TEXT,
  "publishedAt" TIMESTAMPTZ,
  author TEXT DEFAULT 'CondoWizard.ca',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts("publishedAt");

-- Agents (for CRM)
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY DEFAULT replace(uuid_generate_v4()::text, '-', ''),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  "passwordHash" TEXT NOT NULL,
  "avatarUrl" TEXT,
  bio TEXT,
  "licenseNumber" TEXT,
  brokerage TEXT,
  neighborhoods TEXT[] DEFAULT '{}',
  role TEXT DEFAULT 'agent',
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "lastLoginAt" TIMESTAMPTZ
);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY DEFAULT replace(uuid_generate_v4()::text, '-', ''),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  "projectId" TEXT REFERENCES projects(id),
  "neighborhoodId" TEXT REFERENCES neighborhoods(id),
  message TEXT,
  source TEXT DEFAULT 'inquiry',
  "assignedAgentId" TEXT REFERENCES agents(id),
  status TEXT DEFAULT 'new',
  notes TEXT,
  priority TEXT DEFAULT 'warm',
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  "contactedAt" TIMESTAMPTZ,
  "closedAt" TIMESTAMPTZ,
  "dealValue" INTEGER,
  "twilioProxyNumber" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads("createdAt");
CREATE INDEX IF NOT EXISTS idx_leads_agent ON leads("assignedAgentId");
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Deal Activities
CREATE TABLE IF NOT EXISTS deal_activities (
  id TEXT PRIMARY KEY DEFAULT replace(uuid_generate_v4()::text, '-', ''),
  "leadId" TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  "agentId" TEXT REFERENCES agents(id),
  type TEXT NOT NULL,
  content TEXT,
  duration INTEGER,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_lead ON deal_activities("leadId");
CREATE INDEX IF NOT EXISTS idx_activities_agent ON deal_activities("agentId");

-- Portfolio Items
CREATE TABLE IF NOT EXISTS portfolio_items (
  id TEXT PRIMARY KEY DEFAULT replace(uuid_generate_v4()::text, '-', ''),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address TEXT,
  neighborhood TEXT,
  price INTEGER,
  status TEXT DEFAULT 'for_sale',
  bedrooms INTEGER,
  bathrooms INTEGER,
  sqft INTEGER,
  description TEXT,
  "imageUrl" TEXT,
  images JSONB,
  featured BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS on all tables for now (enable later with proper policies)
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read neighborhoods" ON neighborhoods FOR SELECT USING (true);
CREATE POLICY "Public read developers" ON developers FOR SELECT USING (true);
CREATE POLICY "Public read projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Public read blog_posts" ON blog_posts FOR SELECT USING (true);
CREATE POLICY "Public read portfolio_items" ON portfolio_items FOR SELECT USING (true);

-- Create policies for anon insert (leads and activities)
CREATE POLICY "Anon insert leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon insert activities" ON deal_activities FOR INSERT WITH CHECK (true);

-- Create policies for anon insert (for seeding - remove later)
CREATE POLICY "Anon insert neighborhoods" ON neighborhoods FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon insert developers" ON developers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon insert projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon insert blog_posts" ON blog_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon insert portfolio_items" ON portfolio_items FOR INSERT WITH CHECK (true);

-- Allow anon to update projects (for seeding geocode/descriptions)
CREATE POLICY "Anon update projects" ON projects FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anon update neighborhoods" ON neighborhoods FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anon update developers" ON developers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anon update blog_posts" ON blog_posts FOR UPDATE USING (true) WITH CHECK (true);

-- Allow agents table operations for admin
CREATE POLICY "Anon read agents" ON agents FOR SELECT USING (true);
CREATE POLICY "Anon insert agents" ON agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update agents" ON agents FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anon read leads" ON leads FOR SELECT USING (true);
CREATE POLICY "Anon update leads" ON leads FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anon read activities" ON deal_activities FOR SELECT USING (true);

SELECT 'All tables created successfully!' as result;
