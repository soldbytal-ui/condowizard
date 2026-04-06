-- Run this in Supabase SQL Editor BEFORE running seed-pending-projects.ts
-- Dashboard → SQL Editor → New query → paste → Run

-- Remove all existing placeholder/dummy projects and developers
TRUNCATE TABLE projects RESTART IDENTITY CASCADE;
TRUNCATE TABLE developers RESTART IDENTITY CASCADE;

SELECT 'Old projects and developers cleared.' AS result;
