import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { aggregateMarket, fetchHotSolds } from '@/lib/market-stats';
import { AREA_TO_NEIGHBOURHOODS } from '@/lib/area-mappings';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const SNAPSHOT_CLASS = 'condo';
const SNAPSHOT_BEDS = 'all';
const SNAPSHOT_WINDOW = 90;
const TREND_MAX_POINTS = 400;

type NeighborhoodRow = { slug: string; name: string };

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

function checkAuth(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev fallback: no secret set → open
  const bearer = req.headers.get('authorization') || '';
  if (bearer === `Bearer ${secret}`) return true;
  const q = new URL(req.url).searchParams.get('secret');
  if (q && q === secret) return true;
  return false;
}

function pickRepliersNeighborhood(slug: string, name: string): string {
  const mapped = AREA_TO_NEIGHBOURHOODS[slug];
  if (mapped && mapped.length > 0) return mapped[0];
  return name;
}

async function loadNeighborhoods(): Promise<NeighborhoodRow[]> {
  return query<NeighborhoodRow>(
    'SELECT slug, name FROM neighborhoods ORDER BY "displayOrder" NULLS LAST, name ASC'
  );
}

async function loadPriorTrend(slug: string): Promise<Array<Record<string, unknown>>> {
  const row = await queryOne<{ trend: any }>(
    `SELECT trend
       FROM neighbourhood_stats
      WHERE neighborhood_slug = $1 AND class = $2 AND bedrooms = $3 AND window_days = $4
      ORDER BY snapshot_date DESC
      LIMIT 1`,
    [slug, SNAPSHOT_CLASS, SNAPSHOT_BEDS, SNAPSHOT_WINDOW]
  );
  const trend = row?.trend;
  return Array.isArray(trend) ? (trend as Array<Record<string, unknown>>) : [];
}

async function upsertSnapshot(row: NeighborhoodRow, repliers: string, todayISO: string) {
  const agg = await aggregateMarket({
    city: 'Toronto',
    cls: SNAPSHOT_CLASS,
    bedrooms: SNAPSHOT_BEDS,
    days: SNAPSHOT_WINDOW,
    neighborhood: repliers,
  });

  const priorTrend = await loadPriorTrend(row.slug);
  const todayPoint = {
    date: todayISO,
    medianSold: agg.headline.medianSold,
    averageSold: agg.headline.averageSold,
    soldCount: agg.headline.soldCount,
    active: agg.headline.active,
    saleToList: agg.headline.saleToList,
    monthsOfInventory: agg.headline.monthsOfInventory,
    averageDom: agg.headline.averageDom,
  };
  const trend = [...priorTrend.filter((p) => (p as any).date !== todayISO), todayPoint]
    .sort((a, b) => String((a as any).date).localeCompare(String((b as any).date)))
    .slice(-TREND_MAX_POINTS);

  await query(
    `INSERT INTO neighbourhood_stats (
      neighborhood_slug, neighborhood_name, repliers_neighborhood,
      class, bedrooms, window_days, snapshot_date,
      active, new_listings, sold_count,
      median_sold, average_sold, average_list, median_dom, average_dom,
      sale_to_list_pct, months_of_inventory,
      yoy_median_sold_delta, yoy_average_sold_delta, yoy_sold_count_delta, yoy_average_dom_delta, yoy_sale_to_list_delta,
      price_drops, terminations,
      by_suite_type, rental_snapshot, trend,
      generated_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
      $11,$12,$13,$14,$15,$16,$17,
      $18,$19,$20,$21,$22,$23,$24,
      $25,$26,$27,$28
    )
    ON CONFLICT (neighborhood_slug, class, bedrooms, window_days, snapshot_date)
    DO UPDATE SET
      neighborhood_name = EXCLUDED.neighborhood_name,
      repliers_neighborhood = EXCLUDED.repliers_neighborhood,
      active = EXCLUDED.active,
      new_listings = EXCLUDED.new_listings,
      sold_count = EXCLUDED.sold_count,
      median_sold = EXCLUDED.median_sold,
      average_sold = EXCLUDED.average_sold,
      average_list = EXCLUDED.average_list,
      median_dom = EXCLUDED.median_dom,
      average_dom = EXCLUDED.average_dom,
      sale_to_list_pct = EXCLUDED.sale_to_list_pct,
      months_of_inventory = EXCLUDED.months_of_inventory,
      yoy_median_sold_delta = EXCLUDED.yoy_median_sold_delta,
      yoy_average_sold_delta = EXCLUDED.yoy_average_sold_delta,
      yoy_sold_count_delta = EXCLUDED.yoy_sold_count_delta,
      yoy_average_dom_delta = EXCLUDED.yoy_average_dom_delta,
      yoy_sale_to_list_delta = EXCLUDED.yoy_sale_to_list_delta,
      price_drops = EXCLUDED.price_drops,
      terminations = EXCLUDED.terminations,
      by_suite_type = EXCLUDED.by_suite_type,
      rental_snapshot = EXCLUDED.rental_snapshot,
      trend = EXCLUDED.trend,
      generated_at = EXCLUDED.generated_at
    `,
    [
      row.slug, row.name, repliers,
      SNAPSHOT_CLASS, SNAPSHOT_BEDS, SNAPSHOT_WINDOW, todayISO,
      agg.headline.active, agg.headline.newListings, agg.headline.soldCount,
      agg.headline.medianSold, agg.headline.averageSold, agg.headline.averageList, agg.headline.medianDom, agg.headline.averageDom,
      agg.headline.saleToList, agg.headline.monthsOfInventory,
      agg.yoy.medianSoldDelta, agg.yoy.averageSoldDelta, agg.yoy.soldCountDelta, agg.yoy.averageDomDelta, agg.yoy.saleToListDelta,
      agg.priceDrops, agg.terminations,
      JSON.stringify(agg.bySuiteType), JSON.stringify(agg.rentalSnapshot), JSON.stringify(trend),
      new Date().toISOString(),
    ]
  );
}

async function refreshHotSolds(row: NeighborhoodRow, repliers: string): Promise<number> {
  const listings = await fetchHotSolds({ city: 'Toronto', cls: 'all', neighborhood: repliers }, 24);
  if (listings.length === 0) return 0;
  const now = new Date().toISOString();
  for (const l of listings) {
    await query(
      `INSERT INTO hot_solds (
        mls_number, neighborhood_slug, repliers_neighborhood,
        sold_price, list_price, days_on_market, sold_date, list_date,
        address, bedrooms, bathrooms, sqft, class, property_type, refreshed_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15
      )
      ON CONFLICT (mls_number) DO UPDATE SET
        neighborhood_slug = EXCLUDED.neighborhood_slug,
        repliers_neighborhood = EXCLUDED.repliers_neighborhood,
        sold_price = EXCLUDED.sold_price,
        list_price = EXCLUDED.list_price,
        days_on_market = EXCLUDED.days_on_market,
        sold_date = EXCLUDED.sold_date,
        list_date = EXCLUDED.list_date,
        address = EXCLUDED.address,
        bedrooms = EXCLUDED.bedrooms,
        bathrooms = EXCLUDED.bathrooms,
        sqft = EXCLUDED.sqft,
        class = EXCLUDED.class,
        property_type = EXCLUDED.property_type,
        refreshed_at = EXCLUDED.refreshed_at`,
      [
        l.mlsNumber, row.slug, repliers,
        l.soldPrice, l.listPrice, l.daysOnMarket, l.soldDate, l.listDate,
        l.address, l.bedrooms, l.bathrooms, l.sqft, l.class, l.propertyType, now,
      ]
    );
  }
  return listings.length;
}

async function purgeStaleHotSolds() {
  const cutoff = new Date(Date.now() - 60 * 86400000).toISOString();
  await query('DELETE FROM hot_solds WHERE refreshed_at < $1', [cutoff]);
}

async function runRefresh() {
  const todayISO = new Date().toISOString().slice(0, 10);
  const neighborhoods = await loadNeighborhoods();
  const results: Array<{ slug: string; snapshot: 'ok' | 'error'; hotSolds: number; error?: string }> = [];

  for (const row of neighborhoods) {
    const repliers = pickRepliersNeighborhood(row.slug, row.name);
    try {
      await upsertSnapshot(row, repliers, todayISO);
      const count = await refreshHotSolds(row, repliers);
      results.push({ slug: row.slug, snapshot: 'ok', hotSolds: count });
    } catch (err: any) {
      console.error(`[refresh-market-stats] ${row.slug} failed:`, err);
      results.push({ slug: row.slug, snapshot: 'error', hotSolds: 0, error: String(err?.message || err) });
    }
  }

  await purgeStaleHotSolds();

  return {
    ranAt: new Date().toISOString(),
    snapshotDate: todayISO,
    neighborhoods: results,
    okCount: results.filter((r) => r.snapshot === 'ok').length,
    errCount: results.filter((r) => r.snapshot === 'error').length,
    totalHotSolds: results.reduce((s, r) => s + r.hotSolds, 0),
  };
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();
  try {
    const result = await runRefresh();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[refresh-market-stats] fatal:', err);
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
