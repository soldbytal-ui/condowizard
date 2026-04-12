-- Run this in the Supabase SQL Editor to delete fake listings
-- This bypasses RLS since SQL Editor runs as postgres superuser

-- First, back up the fake projects to a temp table
CREATE TABLE IF NOT EXISTS _backup_fake_projects AS
SELECT * FROM projects WHERE name IN (
  'Lux Park', 'Crest 269 Lofts', 'Apex Lofts', 'Arc Park', 'Novo 242 Place',
  'Alto Residences', 'Cloud Living', 'Summit Suites', 'Lux Living', 'Sola Residences',
  'Crest Suites', 'Brio 214 Lofts', 'Rise Towers', 'Cloud 232 Condos', 'Apex Collection',
  'Brio Living', 'Vantage 144 Condos', 'Rise Living', 'Sola 278 Towers', 'Zen 216 Park',
  'Skyline 110 Lofts', 'Novo Living', 'Vantage Suites', 'Skyline Collection',
  'Alto 153 Collection', 'Alto 243 Condos', 'Alto Living', 'Alto Park', 'Alto Square',
  'Apex 143 Place', 'Apex Suites', 'Apex Towers', 'Arc 189 Living', 'Arc 279 Square',
  'Arc Lofts', 'Arc Suites', 'Aura 132 Lofts', 'Aura 191 Suites', 'Aura Collection',
  'Aura Park', 'Aura Suites', 'Brio Condos', 'Brio Suites', 'Cloud Suites',
  'Crest Residences', 'Novo Park', 'Novo Suites', 'Rise Lofts', 'Sola Living',
  'Summit 246 Condos'
);

-- Count before delete
SELECT count(*) AS before_count FROM projects;

-- Delete the fakes
DELETE FROM projects WHERE name IN (
  'Lux Park', 'Crest 269 Lofts', 'Apex Lofts', 'Arc Park', 'Novo 242 Place',
  'Alto Residences', 'Cloud Living', 'Summit Suites', 'Lux Living', 'Sola Residences',
  'Crest Suites', 'Brio 214 Lofts', 'Rise Towers', 'Cloud 232 Condos', 'Apex Collection',
  'Brio Living', 'Vantage 144 Condos', 'Rise Living', 'Sola 278 Towers', 'Zen 216 Park',
  'Skyline 110 Lofts', 'Novo Living', 'Vantage Suites', 'Skyline Collection',
  'Alto 153 Collection', 'Alto 243 Condos', 'Alto Living', 'Alto Park', 'Alto Square',
  'Apex 143 Place', 'Apex Suites', 'Apex Towers', 'Arc 189 Living', 'Arc 279 Square',
  'Arc Lofts', 'Arc Suites', 'Aura 132 Lofts', 'Aura 191 Suites', 'Aura Collection',
  'Aura Park', 'Aura Suites', 'Brio Condos', 'Brio Suites', 'Cloud Suites',
  'Crest Residences', 'Novo Park', 'Novo Suites', 'Rise Lofts', 'Sola Living',
  'Summit 246 Condos'
);

-- Count after delete
SELECT count(*) AS after_count FROM projects;

-- Also create an RPC function for future deletes
CREATE OR REPLACE FUNCTION delete_projects_by_names(names text[])
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM projects WHERE name = ANY(names);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
