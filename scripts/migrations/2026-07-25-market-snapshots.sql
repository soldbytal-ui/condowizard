-- Market data persistence: daily snapshots + hot solds cache
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS neighbourhood_stats (
  id BIGSERIAL PRIMARY KEY,
  neighborhood_slug TEXT NOT NULL,
  neighborhood_name TEXT NOT NULL,
  repliers_neighborhood TEXT,

  class TEXT NOT NULL DEFAULT 'condo',
  bedrooms TEXT NOT NULL DEFAULT 'all',
  window_days INT NOT NULL DEFAULT 90,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,

  active INT,
  new_listings INT,
  sold_count INT,
  median_sold NUMERIC,
  average_sold NUMERIC,
  average_list NUMERIC,
  median_dom NUMERIC,
  average_dom NUMERIC,
  sale_to_list_pct NUMERIC,
  months_of_inventory NUMERIC,

  yoy_median_sold_delta NUMERIC,
  yoy_average_sold_delta NUMERIC,
  yoy_sold_count_delta NUMERIC,
  yoy_average_dom_delta NUMERIC,
  yoy_sale_to_list_delta NUMERIC,

  price_drops INT,
  terminations INT,

  by_suite_type JSONB,
  rental_snapshot JSONB,
  trend JSONB,

  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT neighbourhood_stats_unique
    UNIQUE (neighborhood_slug, class, bedrooms, window_days, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_neighbourhood_stats_slug_date
  ON neighbourhood_stats (neighborhood_slug, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_neighbourhood_stats_filters
  ON neighbourhood_stats (neighborhood_slug, class, bedrooms, window_days);

CREATE TABLE IF NOT EXISTS hot_solds (
  mls_number TEXT PRIMARY KEY,
  neighborhood_slug TEXT NOT NULL,
  repliers_neighborhood TEXT,

  sold_price NUMERIC,
  list_price NUMERIC,
  days_on_market INT,
  sold_date DATE,
  list_date DATE,

  address TEXT,
  bedrooms NUMERIC,
  bathrooms NUMERIC,
  sqft TEXT,
  class TEXT,
  property_type TEXT,

  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hot_solds_slug_sold_date
  ON hot_solds (neighborhood_slug, sold_date DESC);

CREATE INDEX IF NOT EXISTS idx_hot_solds_refreshed
  ON hot_solds (refreshed_at);
