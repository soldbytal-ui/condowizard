import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/supabase-server';
import { fetchHotSolds } from '@/lib/market-stats';
import { AREA_TO_NEIGHBOURHOODS } from '@/lib/area-mappings';

export const dynamic = 'force-dynamic';

interface HotSoldRow {
  mls_number: string;
  neighborhood_slug: string;
  repliers_neighborhood: string | null;
  sold_price: number | string | null;
  list_price: number | string | null;
  days_on_market: number | null;
  sold_date: string | null;
  list_date: string | null;
  address: string | null;
  bedrooms: number | string | null;
  bathrooms: number | string | null;
  sqft: string | null;
  class: string | null;
  property_type: string | null;
  refreshed_at: string;
}

async function loadFromCache(slug: string, limit: number): Promise<HotSoldRow[]> {
  return query<HotSoldRow>(
    'SELECT * FROM hot_solds WHERE neighborhood_slug = $1 ORDER BY sold_date DESC NULLS LAST LIMIT $2',
    [slug, limit]
  );
}

function numOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function maskAddress(addr: string | null): string | null {
  if (!addr) return addr;
  return addr.replace(/(^#?[\w\-]+\s+·\s+)?(\d{1,6})\s/, (_m, unit) => `${unit || ''}•••• `);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug') || '';
  const repliersOverride = url.searchParams.get('neighborhood') || '';
  const limit = Math.min(24, parseInt(url.searchParams.get('limit') || '12', 10));

  if (!slug && !repliersOverride) {
    return NextResponse.json({ error: 'slug or neighborhood required' }, { status: 400 });
  }

  const user = await getUserFromRequest(req as unknown as Request);
  const gated = !user;

  let items: Array<Record<string, unknown>> = [];
  let source: 'cache' | 'live' = 'cache';
  if (slug) {
    const cached = await loadFromCache(slug, limit);
    items = cached.map((r) => ({
      mlsNumber: r.mls_number,
      soldPrice: gated ? null : numOrNull(r.sold_price),
      listPrice: gated ? null : numOrNull(r.list_price),
      daysOnMarket: r.days_on_market,
      soldDate: r.sold_date,
      listDate: r.list_date,
      address: gated ? maskAddress(r.address) : r.address,
      bedrooms: numOrNull(r.bedrooms),
      bathrooms: numOrNull(r.bathrooms),
      sqft: r.sqft,
      class: r.class,
      propertyType: r.property_type,
    }));
  }

  if (items.length === 0) {
    source = 'live';
    const mapped = AREA_TO_NEIGHBOURHOODS[slug];
    const neighborhood = repliersOverride || (mapped && mapped[0]) || slug.replace(/-/g, ' ');
    const live = await fetchHotSolds({ city: 'Toronto', cls: 'all', neighborhood }, limit);
    items = live.map((l) => ({
      mlsNumber: l.mlsNumber,
      soldPrice: gated ? null : l.soldPrice,
      listPrice: gated ? null : l.listPrice,
      daysOnMarket: l.daysOnMarket,
      soldDate: l.soldDate,
      listDate: l.listDate,
      address: gated ? maskAddress(l.address) : l.address,
      bedrooms: l.bedrooms,
      bathrooms: l.bathrooms,
      sqft: l.sqft,
      class: l.class,
      propertyType: l.propertyType,
    }));
  }

  return NextResponse.json({ slug, source, gated, items });
}
