import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { repliersRequest, RepliersListingsResponse } from '@/lib/repliers';
import { mapMLSToUnified } from '@/lib/data-merge';
import { getAreaSearchParams, AREA_TO_NEIGHBOURHOODS } from '@/lib/area-mappings';
import ListingCard from '@/components/search/ListingCard';
import { generateBreadcrumbSchema } from '@/lib/seo';
import NeighbourhoodTabsClient from './NeighbourhoodTabs';
import { queryOne } from '@/lib/db';
import { aggregateMarket, type AggregatedMarket } from '@/lib/market-stats';
import MarketPulseSection, { type Snapshot } from '@/components/market/MarketPulseSection';
import MarketBalanceGauge from '@/components/market/MarketBalanceGauge';
import SuiteTypeTable from '@/components/market/SuiteTypeTable';
import RentalSnapshotCard from '@/components/market/RentalSnapshotCard';
import TrendChart from '@/components/market/TrendChart';
import LightningSolds from '@/components/market/LightningSolds';

const ToggleMap = dynamic(() => import('@/components/neighbourhood/ToggleMap'), { ssr: false });

interface Props { params: { slug: string }; }


function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// Resolve slug to exact Repliers community name + boundary
async function resolveNeighbourhood(slug: string) {
  // Fetch all communities from Repliers (cached 24h at API layer)
  try {
    const data = await repliersRequest<any>({
      path: '/locations',
      query: { city: 'Toronto', resultsPerPage: '200' },
      revalidate: 86400,
    });
    const locations = data.locations || [];

    // Also fetch page 2 if needed
    let allLocations = [...locations];
    if (data.numPages > 1) {
      const p2 = await repliersRequest<any>({
        path: '/locations',
        query: { city: 'Toronto', resultsPerPage: '200', pageNum: '2' },
        revalidate: 86400,
      });
      allLocations.push(...(p2.locations || []));
    }

    // Match slug against all community names
    const match = allLocations.find((c: any) => slugify(c.name) === slug);
    if (match) {
      return {
        name: match.name,
        boundary: match.map?.boundary || null,
        city: match.address?.city || 'Toronto',
        lat: parseFloat(match.map?.latitude) || 0,
        lng: parseFloat(match.map?.longitude) || 0,
      };
    }
  } catch (e) {
    console.error('Failed to resolve neighbourhood:', e);
  }

  // Fallback: try naive slug-to-name (works for simple names like "annex")
  const fallbackName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return { name: fallbackName, boundary: null, city: 'Toronto', lat: 0, lng: 0 };
}

// Load the latest daily snapshot for the neighbourhood; fall back to a live
// Repliers aggregation if none exists yet.
async function loadMarketData(slug: string, repliersName: string): Promise<{ snapshot: Snapshot | null; live: AggregatedMarket | null; source: 'snapshot' | 'live' }> {
  try {
    const data = await queryOne<Snapshot>(
      `SELECT * FROM neighbourhood_stats
        WHERE neighborhood_slug = $1 AND class = 'condo' AND bedrooms = 'all' AND window_days = 90
        ORDER BY snapshot_date DESC
        LIMIT 1`,
      [slug]
    );
    if (data) {
      return { snapshot: data, live: null, source: 'snapshot' };
    }
  } catch (err) {
    console.error('[neighbourhood] snapshot load error:', err);
  }
  try {
    const live = await aggregateMarket({ city: 'Toronto', cls: 'condo', bedrooms: 'all', days: 90, neighborhood: repliersName });
    return { snapshot: null, live, source: 'live' };
  } catch (err) {
    console.error('[neighbourhood] live aggregate error:', err);
    return { snapshot: null, live: null, source: 'live' };
  }
}

// Adapts a live aggregation into the same shape as a stored snapshot so we can
// render one set of section components regardless of source.
function liveToSnapshot(live: AggregatedMarket, slug: string, name: string): Snapshot {
  const today = new Date().toISOString().slice(0, 10);
  return {
    snapshot_date: today,
    window_days: live.filters.days,
    active: live.headline.active,
    new_listings: live.headline.newListings,
    sold_count: live.headline.soldCount,
    median_sold: live.headline.medianSold,
    average_sold: live.headline.averageSold,
    median_dom: live.headline.medianDom,
    average_dom: live.headline.averageDom,
    sale_to_list_pct: live.headline.saleToList,
    months_of_inventory: live.headline.monthsOfInventory,
    yoy_median_sold_delta: live.yoy.medianSoldDelta,
    yoy_average_sold_delta: live.yoy.averageSoldDelta,
    yoy_sold_count_delta: live.yoy.soldCountDelta,
    yoy_average_dom_delta: live.yoy.averageDomDelta,
    yoy_sale_to_list_delta: live.yoy.saleToListDelta,
    price_drops: live.priceDrops,
    terminations: live.terminations,
    by_suite_type: live.bySuiteType,
    rental_snapshot: live.rentalSnapshot,
    trend: null,
    generated_at: live.generatedAt,
  } as unknown as Snapshot;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const hood = await resolveNeighbourhood(params.slug);
  return {
    title: `${hood.name} Real Estate — Condos, Homes & Pre-Construction | CondoWizard`,
    description: `Browse MLS listings and pre-construction projects in ${hood.name}, Toronto. Resale condos, homes for sale, rentals, sold data, and new developments.`,
    alternates: { canonical: `https://condowizard.ca/neighbourhood/${params.slug}` },
  };
}

export default async function NeighbourhoodPage({ params }: Props) {
  const hood = await resolveNeighbourhood(params.slug);
  const name = hood.name;
  const boundary = hood.boundary;
  const city = hood.city;

  // Build Repliers location filter from area mappings
  const areaParams = getAreaSearchParams(params.slug);
  const mlsLocationFilter: Record<string, unknown> = {};
  if (areaParams.neighborhoods && areaParams.neighborhoods.length > 0) {
    mlsLocationFilter.neighborhood = areaParams.neighborhoods[0];
    mlsLocationFilter.city = city;
  } else if (areaParams.city) {
    mlsLocationFilter.city = areaParams.city;
  } else {
    mlsLocationFilter.city = city;
    mlsLocationFilter.neighborhood = name;
  }

  // Market snapshot (prefer stored, fall back to live)
  const repliersNeighborhood =
    (areaParams.neighborhoods && areaParams.neighborhoods[0]) ||
    (AREA_TO_NEIGHBOURHOODS[params.slug]?.[0]) ||
    name;
  const market = await loadMarketData(params.slug, repliersNeighborhood);
  const marketSnapshot: Snapshot | null = market.snapshot ?? (market.live ? liveToSnapshot(market.live, params.slug, name) : null);
  const marketSourceLabel = market.source === 'snapshot' ? 'Daily snapshot' : 'Live data';

  // Fetch MLS — For Sale
  let forSale: any[] = [];
  let stats: any = {};
  try {
    const data = await repliersRequest<RepliersListingsResponse>({
      path: '/listings',
      body: { ...mlsLocationFilter, status: 'A', type: 'sale', resultsPerPage: 24, sortBy: 'updatedOnDesc', statistics: 'avg-listPrice,med-listPrice,cnt-available' },
      revalidate: 300,
    });
    forSale = (data.listings || []).map(mapMLSToUnified);
    const rs = data.statistics as Record<string, any> || {};
    stats = { avgPrice: rs.listPrice?.avg, medPrice: rs.listPrice?.med, totalActive: data.count };
  } catch {}

  // Fetch MLS — For Rent
  let forRent: any[] = [];
  let rentCount = 0;
  try {
    const data = await repliersRequest<RepliersListingsResponse>({
      path: '/listings',
      body: { ...mlsLocationFilter, status: 'A', type: 'lease', resultsPerPage: 12, sortBy: 'updatedOnDesc' },
      revalidate: 300,
    });
    forRent = (data.listings || []).map(mapMLSToUnified);
    rentCount = data.count || 0;
  } catch {}

  // Fetch MLS — Recently Sold
  let sold: any[] = [];
  let soldCount = 0;
  try {
    const data = await repliersRequest<RepliersListingsResponse>({
      path: '/listings',
      body: { ...mlsLocationFilter, status: 'U', lastStatus: 'Sld', resultsPerPage: 12, sortBy: 'soldDateDesc', minSoldDate: new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0] },
      revalidate: 600,
    });
    sold = (data.listings || []).map(mapMLSToUnified);
    soldCount = data.count || 0;
  } catch {}

  // Fetch Pre-con projects from Supabase
  const { data: preconRaw } = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
    .neq('status', 'COMPLETED')
    .neq('status', 'ARCHIVED');

  // Filter precon by name match (neighbourhood name in either the Supabase hood name or address)
  const preconProjects = (preconRaw || [])
    .filter((p: any) => {
      const hoodName = p.neighborhood?.name?.toLowerCase() || '';
      const addr = (p.address || '').toLowerCase();
      const searchName = name.toLowerCase();
      return hoodName.includes(searchName) || addr.includes(searchName);
    })
    .map((p: any) => {
      // Estimate floors for visual variety when actual data is missing
      let floors = p.floors;
      if (!floors || floors <= 0) {
        if (p.totalUnits > 500) floors = 50;
        else if (p.totalUnits > 300) floors = 40;
        else if (p.totalUnits > 150) floors = 30;
        else if (p.totalUnits > 50) floors = 20;
        else if (p.totalUnits > 0) floors = 10;
        else if (p.priceMin > 1500000) floors = 40;
        else if (p.priceMin > 800000) floors = 25;
        else floors = 12 + (p.name?.charCodeAt(0) || 0) % 25; // varied default
      }
      return {
        name: p.name, slug: p.slug,
        lat: p.latitude || 0, lng: p.longitude || 0,
        floors, priceMin: p.priceMin,
        developer: p.developer?.name || null,
        image: p.mainImageUrl || null,
        units: p.totalUnits, estCompletion: p.estCompletion,
      };
    });

  const { data: hoodInfo } = await supabase.from('neighborhoods').select('*').eq('slug', params.slug).single();

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name, url: `https://condowizard.ca/neighbourhood/${params.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <div className="pt-14 bg-bg min-h-screen">
        <div className="container-main py-10">
          <nav className="flex items-center gap-2 text-sm text-text-muted mb-4">
            <Link href="/" className="hover:text-accent-blue">Home</Link><span>/</span>
            <span className="text-text-primary">{name}</span>
          </nav>

          <h1 className="text-3xl font-bold text-text-primary">{name}</h1>
          {hoodInfo?.description ? (
            <p className="text-text-muted mt-2 max-w-3xl">{hoodInfo.description}</p>
          ) : (
            <p className="text-text-muted mt-2">MLS listings, pre-construction projects, sold data and market stats for {name}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-8">
            <div className="bg-white rounded-xl border border-border p-4 text-center">
              <p className="font-serif text-xl font-bold text-accent-blue">{stats.totalActive || forSale.length}</p>
              <p className="text-[11px] text-text-muted mt-0.5">For Sale</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-4 text-center">
              <p className="font-serif text-xl font-bold">{stats.avgPrice ? `$${Math.round(stats.avgPrice).toLocaleString()}` : '—'}</p>
              <p className="text-[11px] text-text-muted mt-0.5">Avg Price</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-4 text-center">
              <p className="font-serif text-xl font-bold">{rentCount}</p>
              <p className="text-[11px] text-text-muted mt-0.5">For Rent</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-4 text-center">
              <p className="font-serif text-xl font-bold text-gray-500">{soldCount}</p>
              <p className="text-[11px] text-text-muted mt-0.5">Sold (6mo)</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-4 text-center">
              <p className="font-serif text-xl font-bold text-bt-precon">{preconProjects.length}</p>
              <p className="text-[11px] text-text-muted mt-0.5">Pre-Construction</p>
            </div>
          </div>

          {/* Map with toggle */}
          <section className="mt-10">
            <ToggleMap listings={forSale} preconProjects={preconProjects} boundary={boundary} neighbourhoodName={name} />
          </section>

          {/* Market Pulse */}
          {marketSnapshot ? (
            <section className="mt-12">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">Market Pulse</h2>
                  <p className="text-xs text-text-muted mt-1">
                    Condo resale in {name} · 90-day window · {marketSourceLabel}
                  </p>
                </div>
              </div>
              <MarketPulseSection snapshot={marketSnapshot} neighborhoodName={name} />
            </section>
          ) : null}

          {/* Lightning Solds */}
          <section className="mt-12">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-text-primary">Lightning Solds</h2>
                <p className="text-xs text-text-muted mt-1">Homes in {name} that sold in 7 days or less. Sold prices unlock free after signup.</p>
              </div>
            </div>
            <LightningSolds slug={params.slug} neighborhoodName={name} limit={6} />
          </section>

          {/* Buyer / Seller balance */}
          {marketSnapshot ? (
            <section className="mt-12">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">Buyer&apos;s or Seller&apos;s Market?</h2>
                  <p className="text-xs text-text-muted mt-1">Derived from months of inventory, with price-drop and termination signals.</p>
                </div>
              </div>
              <MarketBalanceGauge
                monthsOfInventory={marketSnapshot.months_of_inventory != null ? Number(marketSnapshot.months_of_inventory) : null}
                priceDrops={marketSnapshot.price_drops}
                terminations={marketSnapshot.terminations}
              />
            </section>
          ) : null}

          {/* Trend from snapshots */}
          {marketSnapshot && marketSnapshot.trend && marketSnapshot.trend.length > 0 ? (
            <section className="mt-12">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">Trend</h2>
                  <p className="text-xs text-text-muted mt-1">Daily snapshots since we started tracking {name}.</p>
                </div>
              </div>
              <TrendChart points={marketSnapshot.trend} metric="medianSold" label="Median sold price" />
            </section>
          ) : null}

          {/* By suite type */}
          {marketSnapshot && marketSnapshot.by_suite_type && marketSnapshot.by_suite_type.length > 0 ? (
            <section className="mt-12">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">By Suite Type</h2>
                  <p className="text-xs text-text-muted mt-1">90-day sold performance by bedroom count.</p>
                </div>
              </div>
              <SuiteTypeTable rows={marketSnapshot.by_suite_type} />
            </section>
          ) : null}

          {/* Rental snapshot */}
          {marketSnapshot && marketSnapshot.rental_snapshot ? (
            <section className="mt-12">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-text-primary">Rental Snapshot</h2>
                  <p className="text-xs text-text-muted mt-1">Active supply, asking rents, and 90-day leased performance.</p>
                </div>
              </div>
              <RentalSnapshotCard data={marketSnapshot.rental_snapshot} />
            </section>
          ) : null}

          {/* Resale tabs */}
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-text-primary">Properties in {name}</h2>
              <Link href={`/search?neighborhood=${encodeURIComponent(name)}`} className="text-sm text-accent-blue hover:underline">View all on map &rarr;</Link>
            </div>
            <NeighbourhoodTabsClient forSale={forSale} forRent={forRent} sold={sold} name={name} />
          </section>

          {/* Pre-con cards */}
          {preconProjects.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-text-primary">New Developments in {name}</h2>
                <Link href="/new-condos" className="text-sm text-accent-blue hover:underline">Browse all &rarr;</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {preconProjects.map((p: any) => (
                  <Link key={p.slug} href={`/properties/${p.slug}`} className="group bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-all">
                    <div className="relative aspect-[16/10] bg-surface2 overflow-hidden">
                      {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-text-muted text-sm">No Image</div>}
                      <div className="absolute top-2 left-2 bg-bt-precon text-black text-[10px] font-bold rounded px-2 py-0.5">PRE-CONSTRUCTION</div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-text-primary group-hover:text-accent-blue transition-colors">{p.name}</h3>
                      {p.developer && <p className="text-xs text-text-muted mt-0.5">{p.developer}</p>}
                      <p className="font-serif font-bold text-sm mt-1">{p.priceMin ? formatPrice(p.priceMin) + '+' : 'Contact for pricing'}</p>
                      <div className="flex gap-2 text-[11px] text-text-muted mt-1">
                        {p.floors && <span>{p.floors} floors</span>}
                        {p.units && <span>{p.units} units</span>}
                        {p.estCompletion && <span>Est. {p.estCompletion}</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Scores */}
          {hoodInfo && (hoodInfo.walk_score || hoodInfo.transit_score) && (
            <section className="mt-10">
              <h2 className="text-xl font-bold text-text-primary mb-4">Scores</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {hoodInfo.walk_score && <div className="bg-white rounded-xl border border-border p-5 text-center"><p className="font-serif text-3xl font-bold text-accent-green">{hoodInfo.walk_score}</p><p className="text-sm text-text-muted mt-1">Walk Score</p></div>}
                {hoodInfo.transit_score && <div className="bg-white rounded-xl border border-border p-5 text-center"><p className="font-serif text-3xl font-bold text-accent-blue">{hoodInfo.transit_score}</p><p className="text-sm text-text-muted mt-1">Transit Score</p></div>}
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="mt-12 bg-white rounded-xl border border-border p-8 text-center">
            <h3 className="text-xl font-bold text-text-primary mb-2">Looking to buy in {name}?</h3>
            <p className="text-text-muted mb-4">Get expert guidance from a licensed real estate professional</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/search?neighborhood=${encodeURIComponent(areaParams.neighborhoods?.[0] || areaParams.city || name)}`} className="bg-accent-blue text-white px-6 py-2.5 rounded-lg font-medium hover:bg-accent-blue/90">View All Listings</Link>
              <Link href="/contact-us" className="border border-border text-text-primary px-6 py-2.5 rounded-lg font-medium hover:border-accent-blue/30">Contact Tal Shelef</Link>
            </div>
          </section>

          <div className="mt-8 p-4 bg-white rounded-xl border border-border text-xs text-text-muted">
            <p>Tal Shelef, Sales Representative | Rare Real Estate Inc., Brokerage | 1701 Avenue Rd, Toronto, ON M5M 3Y3 | 647-890-4082</p>
          </div>
        </div>
      </div>
    </>
  );
}
