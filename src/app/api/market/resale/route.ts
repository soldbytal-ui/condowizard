import { NextRequest, NextResponse } from 'next/server';
import { repliersRequest } from '@/lib/repliers';

export const revalidate = 300;

const CITY_DEFAULT = 'Toronto';

const CLASS_MAP: Record<string, string | undefined> = {
  all: undefined,
  condo: 'condo',
  freehold: 'residential',
  'condo-townhouse': 'condo townhouse',
};

// Curated Toronto neighborhoods → Repliers `neighborhood` names
const NEIGHBORHOODS: Array<{ name: string; repliers: string; slug?: string }> = [
  { name: 'Downtown / Waterfront', repliers: 'Waterfront Communities C1', slug: 'downtown-core' },
  { name: 'Bay Street Corridor', repliers: 'Bay Street Corridor' },
  { name: 'The Annex', repliers: 'Annex', slug: 'the-annex' },
  { name: 'Yonge-Eglinton', repliers: 'Yonge-Eglinton', slug: 'yonge-eglinton' },
  { name: 'King West / Niagara', repliers: 'Niagara', slug: 'king-west' },
  { name: 'Leslieville', repliers: 'South Riverdale', slug: 'leslieville' },
  { name: 'Leaside', repliers: 'Leaside', slug: 'leaside' },
  { name: 'Willowdale East', repliers: 'Willowdale East' },
  { name: 'Mimico (Etobicoke)', repliers: 'Mimico' },
  { name: 'High Park', repliers: 'High Park-Swansea', slug: 'high-park' },
];

type SoldStats = {
  count: number;
  medianListPrice: number | null;
  averageListPrice: number | null;
  medianSoldPrice: number | null;
  averageSoldPrice: number | null;
  medianDom: number | null;
  averageDom: number | null;
};

async function statsFor(body: Record<string, unknown>): Promise<SoldStats> {
  try {
    const data = await repliersRequest<any>({
      path: '/listings',
      body: { resultsPerPage: 1, ...body },
      revalidate: 300,
    });
    const s = (data?.statistics || {}) as Record<string, any>;
    return {
      count: data?.count ?? 0,
      medianListPrice: numberOrNull(s.listPrice?.med),
      averageListPrice: numberOrNull(s.listPrice?.avg),
      medianSoldPrice: numberOrNull(s.soldPrice?.med),
      averageSoldPrice: numberOrNull(s.soldPrice?.avg),
      medianDom: numberOrNull(s.daysOnMarket?.med),
      averageDom: numberOrNull(s.daysOnMarket?.avg),
    };
  } catch (err) {
    console.error('[market/resale] statsFor error:', err);
    return {
      count: 0,
      medianListPrice: null,
      averageListPrice: null,
      medianSoldPrice: null,
      averageSoldPrice: null,
      medianDom: null,
      averageDom: null,
    };
  }
}

function numberOrNull(v: unknown): number | null {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

function shiftYearsISO(iso: string, years: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y - years}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function pctDelta(current: number | null, prior: number | null): number | null {
  if (current == null || prior == null || prior === 0) return null;
  return ((current - prior) / prior) * 100;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cls = searchParams.get('class') || 'condo';
  const bedrooms = searchParams.get('bedrooms') || 'all';
  const daysRaw = parseInt(searchParams.get('days') || '90', 10);
  const days = [30, 90, 365].includes(daysRaw) ? daysRaw : 90;
  const city = searchParams.get('city') || CITY_DEFAULT;

  const filters: Record<string, unknown> = { city, type: 'sale' };
  if (CLASS_MAP[cls]) filters.class = CLASS_MAP[cls];
  if (bedrooms !== 'all') {
    if (bedrooms === '3+') {
      filters.minBedrooms = 3;
    } else {
      const n = Number(bedrooms);
      filters.minBedrooms = n;
      filters.maxBedrooms = n;
    }
  }

  const soldStart = daysAgoISO(days);
  const soldEnd = daysAgoISO(0);
  const newListingsStart = daysAgoISO(30);
  const yoyStart = shiftYearsISO(soldStart, 1);
  const yoyEnd = shiftYearsISO(soldEnd, 1);

  const soldStatsCsv = 'avg-listPrice,med-listPrice,avg-soldPrice,med-soldPrice,avg-daysOnMarket,med-daysOnMarket,cnt-closed';
  const activeStatsCsv = 'avg-listPrice,med-listPrice,cnt-available,cnt-new';

  const activeBody = { ...filters, status: 'A', statistics: activeStatsCsv };
  const newListBody = { ...filters, status: 'A', minListDate: newListingsStart, statistics: 'cnt-available' };
  const soldBody = { ...filters, status: 'U', lastStatus: 'Sld', minSoldDate: soldStart, maxSoldDate: soldEnd, statistics: soldStatsCsv };
  const yoyBody = { ...filters, status: 'U', lastStatus: 'Sld', minSoldDate: yoyStart, maxSoldDate: yoyEnd, statistics: soldStatsCsv };

  const [active, newl, sold, yoy] = await Promise.all([
    statsFor(activeBody),
    statsFor(newListBody),
    statsFor(soldBody),
    statsFor(yoyBody),
  ]);

  const neighborhoods = await Promise.all(
    NEIGHBORHOODS.map(async (h) => {
      const [a, s] = await Promise.all([
        statsFor({ ...filters, neighborhood: h.repliers, status: 'A', statistics: activeStatsCsv }),
        statsFor({
          ...filters,
          neighborhood: h.repliers,
          status: 'U',
          lastStatus: 'Sld',
          minSoldDate: soldStart,
          maxSoldDate: soldEnd,
          statistics: soldStatsCsv,
        }),
      ]);
      return {
        name: h.name,
        neighborhood: h.repliers,
        slug: h.slug || null,
        active: a.count,
        activeMedianPrice: a.medianListPrice,
        sold: s.count,
        soldMedianPrice: s.medianSoldPrice,
        averageDom: s.averageDom,
      };
    })
  );

  const priceBands = [
    { label: 'Under $500K', min: 0, max: 500000 },
    { label: '$500K–$750K', min: 500000, max: 750000 },
    { label: '$750K–$1M', min: 750000, max: 1000000 },
    { label: '$1M–$1.5M', min: 1000000, max: 1500000 },
    { label: '$1.5M–$2M', min: 1500000, max: 2000000 },
    { label: '$2M+', min: 2000000, max: undefined },
  ];

  const bands = await Promise.all(
    priceBands.map(async (b) => {
      const body: Record<string, unknown> = {
        ...filters,
        status: 'U',
        lastStatus: 'Sld',
        minSoldDate: soldStart,
        maxSoldDate: soldEnd,
        minSoldPrice: b.min,
        resultsPerPage: 1,
      };
      if (b.max !== undefined) body.maxSoldPrice = b.max;
      try {
        const data = await repliersRequest<any>({ path: '/listings', body, revalidate: 300 });
        return { label: b.label, count: data?.count ?? 0 };
      } catch {
        return { label: b.label, count: 0 };
      }
    })
  );

  const saleToList =
    sold.averageSoldPrice && sold.averageListPrice
      ? (sold.averageSoldPrice / sold.averageListPrice) * 100
      : null;

  const yoySaleToList =
    yoy.averageSoldPrice && yoy.averageListPrice
      ? (yoy.averageSoldPrice / yoy.averageListPrice) * 100
      : null;

  const soldPerMonth = sold.count > 0 && days > 0 ? sold.count / (days / 30) : null;
  const monthsOfInventory =
    active.count && soldPerMonth && soldPerMonth > 0 ? active.count / soldPerMonth : null;

  return NextResponse.json(
    {
      filters: { class: cls, bedrooms, days, city },
      period: { start: soldStart, end: soldEnd, yoyStart, yoyEnd },
      headline: {
        active: active.count,
        newListings: newl.count,
        medianSold: sold.medianSoldPrice,
        averageSold: sold.averageSoldPrice,
        averageList: sold.averageListPrice,
        medianDom: sold.medianDom,
        averageDom: sold.averageDom,
        soldCount: sold.count,
        saleToList,
        monthsOfInventory,
      },
      yoy: {
        medianSoldDelta: pctDelta(sold.medianSoldPrice, yoy.medianSoldPrice),
        averageSoldDelta: pctDelta(sold.averageSoldPrice, yoy.averageSoldPrice),
        soldCountDelta: pctDelta(sold.count, yoy.count),
        averageDomDelta: pctDelta(sold.averageDom, yoy.averageDom),
        saleToListDelta:
          saleToList != null && yoySaleToList != null ? saleToList - yoySaleToList : null,
      },
      neighborhoods,
      priceBands: bands,
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  );
}
