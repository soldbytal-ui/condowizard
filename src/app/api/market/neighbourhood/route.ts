import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { aggregateMarket } from '@/lib/market-stats';
import { AREA_TO_NEIGHBOURHOODS } from '@/lib/area-mappings';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug') || '';
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const snapshot = await queryOne(
    `SELECT * FROM neighbourhood_stats
      WHERE neighborhood_slug = $1 AND class = 'condo' AND bedrooms = 'all' AND window_days = 90
      ORDER BY snapshot_date DESC
      LIMIT 1`,
    [slug]
  );
  if (snapshot) {
    return NextResponse.json({ source: 'snapshot', snapshot });
  }

  const mapped = AREA_TO_NEIGHBOURHOODS[slug];
  const neighborhood = (mapped && mapped[0]) || slug.replace(/-/g, ' ');
  const agg = await aggregateMarket({
    city: 'Toronto',
    cls: 'condo',
    bedrooms: 'all',
    days: 90,
    neighborhood,
  });
  return NextResponse.json({ source: 'live', live: agg });
}
