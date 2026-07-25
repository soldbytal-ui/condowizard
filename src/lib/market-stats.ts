import { repliersRequest } from '@/lib/repliers';

export const CLASS_MAP: Record<string, string | undefined> = {
  all: undefined,
  condo: 'condo',
  freehold: 'residential',
  'condo-townhouse': 'condo townhouse',
};

export const BED_LABELS: Record<string, string> = {
  '0': 'Studio',
  '1': '1 BR',
  '2': '2 BR',
  '3+': '3+ BR',
};

export type SoldStats = {
  count: number;
  medianListPrice: number | null;
  averageListPrice: number | null;
  medianSoldPrice: number | null;
  averageSoldPrice: number | null;
  medianDom: number | null;
  averageDom: number | null;
};

const EMPTY_STATS: SoldStats = {
  count: 0,
  medianListPrice: null,
  averageListPrice: null,
  medianSoldPrice: null,
  averageSoldPrice: null,
  medianDom: null,
  averageDom: null,
};

function numberOrNull(v: unknown): number | null {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

export function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
}

export function shiftYearsISO(iso: string, years: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y - years}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function pctDelta(current: number | null, prior: number | null): number | null {
  if (current == null || prior == null || prior === 0) return null;
  return ((current - prior) / prior) * 100;
}

export async function statsFor(body: Record<string, unknown>): Promise<SoldStats> {
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
    console.error('[market-stats] statsFor error:', err);
    return EMPTY_STATS;
  }
}

export async function countFor(body: Record<string, unknown>): Promise<number> {
  try {
    const data = await repliersRequest<any>({
      path: '/listings',
      body: { resultsPerPage: 1, ...body },
      revalidate: 300,
    });
    return data?.count ?? 0;
  } catch (err) {
    console.error('[market-stats] countFor error:', err);
    return 0;
  }
}

export interface MarketFilters {
  city?: string;
  cls?: string; // 'all' | 'condo' | 'freehold' | 'condo-townhouse'
  bedrooms?: string;
  neighborhood?: string;
  days?: number;
}

const SOLD_STATS_CSV =
  'avg-listPrice,med-listPrice,avg-soldPrice,med-soldPrice,avg-daysOnMarket,med-daysOnMarket,cnt-closed';
const ACTIVE_STATS_CSV = 'avg-listPrice,med-listPrice,cnt-available,cnt-new';

export function buildFilters(f: MarketFilters): Record<string, unknown> {
  const q: Record<string, unknown> = { city: f.city || 'Toronto', type: 'sale' };
  const cls = f.cls ?? 'condo';
  if (CLASS_MAP[cls]) q.class = CLASS_MAP[cls];
  const beds = f.bedrooms ?? 'all';
  if (beds !== 'all') {
    if (beds === '3+') q.minBedrooms = 3;
    else {
      const n = Number(beds);
      q.minBedrooms = n;
      q.maxBedrooms = n;
    }
  }
  if (f.neighborhood) q.neighborhood = f.neighborhood;
  return q;
}

export interface AggregatedMarket {
  filters: { class: string; bedrooms: string; days: number; city: string; neighborhood?: string };
  period: { start: string; end: string; yoyStart: string; yoyEnd: string };
  headline: {
    active: number;
    newListings: number;
    medianSold: number | null;
    averageSold: number | null;
    averageList: number | null;
    medianDom: number | null;
    averageDom: number | null;
    soldCount: number;
    saleToList: number | null;
    monthsOfInventory: number | null;
  };
  yoy: {
    medianSoldDelta: number | null;
    averageSoldDelta: number | null;
    soldCountDelta: number | null;
    averageDomDelta: number | null;
    saleToListDelta: number | null;
  };
  bySuiteType: Array<{
    bedrooms: string;
    label: string;
    soldCount: number;
    medianSold: number | null;
    averageDom: number | null;
  }>;
  priceBands: Array<{ label: string; count: number }>;
  rentalSnapshot: {
    activeCount: number;
    medianAskingRent: number | null;
    averageAskingRent: number | null;
    leasedCount: number;
    medianLeasedRent: number | null;
    averageLeasedRent: number | null;
    averageDom: number | null;
  };
  priceDrops: number;
  terminations: number;
  generatedAt: string;
}

const PRICE_BANDS = [
  { label: 'Under $500K', min: 0, max: 500000 },
  { label: '$500K–$750K', min: 500000, max: 750000 },
  { label: '$750K–$1M', min: 750000, max: 1000000 },
  { label: '$1M–$1.5M', min: 1000000, max: 1500000 },
  { label: '$1.5M–$2M', min: 1500000, max: 2000000 },
  { label: '$2M+', min: 2000000, max: undefined as number | undefined },
];

const BEDROOM_BREAKOUT = ['0', '1', '2', '3+'] as const;

function withBedroomFilter(base: Record<string, unknown>, beds: string): Record<string, unknown> {
  const copy = { ...base };
  if (beds === '3+') {
    copy.minBedrooms = 3;
    delete copy.maxBedrooms;
  } else {
    const n = Number(beds);
    copy.minBedrooms = n;
    copy.maxBedrooms = n;
  }
  return copy;
}

export async function aggregateMarket(f: MarketFilters): Promise<AggregatedMarket> {
  const cls = f.cls ?? 'condo';
  const bedrooms = f.bedrooms ?? 'all';
  const daysRaw = f.days ?? 90;
  const days = [30, 90, 365].includes(daysRaw) ? daysRaw : 90;
  const city = f.city ?? 'Toronto';

  const base = buildFilters({ ...f, cls, bedrooms, days, city });

  const soldStart = daysAgoISO(days);
  const soldEnd = daysAgoISO(0);
  const newListingsStart = daysAgoISO(30);
  const yoyStart = shiftYearsISO(soldStart, 1);
  const yoyEnd = shiftYearsISO(soldEnd, 1);

  const activeBody = { ...base, status: 'A', statistics: ACTIVE_STATS_CSV };
  const newListBody = { ...base, status: 'A', minListDate: newListingsStart, statistics: 'cnt-available' };
  const soldBody = { ...base, status: 'U', lastStatus: 'Sld', minSoldDate: soldStart, maxSoldDate: soldEnd, statistics: SOLD_STATS_CSV };
  const yoyBody = { ...base, status: 'U', lastStatus: 'Sld', minSoldDate: yoyStart, maxSoldDate: yoyEnd, statistics: SOLD_STATS_CSV };

  const rentalBase = { ...base, type: 'lease' } as Record<string, unknown>;
  const rentalActiveBody = { ...rentalBase, status: 'A', statistics: 'avg-listPrice,med-listPrice,cnt-available,avg-daysOnMarket' };
  const rentalLeasedBody = { ...rentalBase, status: 'U', lastStatus: 'Lsd', minSoldDate: soldStart, maxSoldDate: soldEnd, statistics: 'avg-soldPrice,med-soldPrice,cnt-closed' };

  const priceDropBody = { ...base, status: 'A', minUpdatedOn: daysAgoISO(30), lastPriceChangeType: 'reduced', statistics: 'cnt-available' };
  const terminationBody = { ...base, status: 'U', lastStatus: 'Ter', minSoldDate: soldStart, maxSoldDate: soldEnd, statistics: 'cnt-closed' };

  const [active, newl, sold, yoy, rentalActive, rentalLeased, priceDrops, terminations] = await Promise.all([
    statsFor(activeBody),
    statsFor(newListBody),
    statsFor(soldBody),
    statsFor(yoyBody),
    statsFor(rentalActiveBody),
    statsFor(rentalLeasedBody),
    countFor(priceDropBody),
    countFor(terminationBody),
  ]);

  const bySuiteType = await Promise.all(
    BEDROOM_BREAKOUT.map(async (beds) => {
      const body = withBedroomFilter({ ...base, status: 'U', lastStatus: 'Sld', minSoldDate: soldStart, maxSoldDate: soldEnd, statistics: SOLD_STATS_CSV }, beds);
      const s = await statsFor(body);
      return { bedrooms: beds, label: BED_LABELS[beds], soldCount: s.count, medianSold: s.medianSoldPrice, averageDom: s.averageDom };
    })
  );

  const priceBands = await Promise.all(
    PRICE_BANDS.map(async (b) => {
      const body: Record<string, unknown> = {
        ...base,
        status: 'U',
        lastStatus: 'Sld',
        minSoldDate: soldStart,
        maxSoldDate: soldEnd,
        minSoldPrice: b.min,
        resultsPerPage: 1,
      };
      if (b.max !== undefined) body.maxSoldPrice = b.max;
      return { label: b.label, count: await countFor(body) };
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

  return {
    filters: { class: cls, bedrooms, days, city, neighborhood: f.neighborhood },
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
    bySuiteType,
    priceBands,
    rentalSnapshot: {
      activeCount: rentalActive.count,
      medianAskingRent: rentalActive.medianListPrice,
      averageAskingRent: rentalActive.averageListPrice,
      leasedCount: rentalLeased.count,
      medianLeasedRent: rentalLeased.medianSoldPrice,
      averageLeasedRent: rentalLeased.averageSoldPrice,
      averageDom: rentalActive.averageDom,
    },
    priceDrops,
    terminations,
    generatedAt: new Date().toISOString(),
  };
}

export interface HotSold {
  mlsNumber: string;
  soldPrice: number | null;
  listPrice: number | null;
  daysOnMarket: number | null;
  soldDate: string | null;
  listDate: string | null;
  address: string;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: string | null;
  class: string | null;
  propertyType: string | null;
}

export async function fetchHotSolds(f: MarketFilters, limit = 12): Promise<HotSold[]> {
  const base = buildFilters(f);
  try {
    const data = await repliersRequest<any>({
      path: '/listings',
      body: {
        ...base,
        status: 'U',
        lastStatus: 'Sld',
        maxDaysOnMarket: 7,
        minSoldDate: daysAgoISO(60),
        sortBy: 'soldDateDesc',
        resultsPerPage: limit,
      },
      revalidate: 600,
    });
    const listings: any[] = data.listings || [];
    return listings.map((l) => {
      const a = l.address || {};
      const addr = [a.streetNumber, a.streetName, a.streetSuffix].filter(Boolean).join(' ').trim();
      const unit = a.unitNumber ? `#${a.unitNumber} · ` : '';
      const fullAddress = `${unit}${addr}, ${a.city || ''}`;
      return {
        mlsNumber: l.mlsNumber,
        soldPrice: l.soldPrice != null ? Number(l.soldPrice) : null,
        listPrice: l.listPrice != null ? Number(l.listPrice) : null,
        daysOnMarket: l.daysOnMarket != null ? Number(l.daysOnMarket) : null,
        soldDate: l.soldDate ? String(l.soldDate).slice(0, 10) : null,
        listDate: l.listDate ? String(l.listDate).slice(0, 10) : null,
        address: fullAddress,
        bedrooms: l.details?.numBedrooms != null ? Number(l.details.numBedrooms) : null,
        bathrooms: l.details?.numBathrooms != null ? Number(l.details.numBathrooms) : null,
        sqft: l.details?.sqft || null,
        class: l.class || null,
        propertyType: l.details?.propertyType || null,
      };
    });
  } catch (err) {
    console.error('[market-stats] fetchHotSolds error:', err);
    return [];
  }
}
