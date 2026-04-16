import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { repliersRequest, RepliersListing } from '@/lib/repliers';
import { mapMLSToUnified } from '@/lib/data-merge';
import { supabase } from '@/lib/supabase';
import { parseAddressFromSlug, formatAddress } from '@/lib/building-address';
import { AIRBNB_BUILDINGS, getBuildingBySlug } from '@/data/airbnb-buildings';
import { slugify } from '@/lib/utils';
import ListingCard from '@/components/search/ListingCard';

interface Props {
  params: { slug: string };
  searchParams?: { tab?: string };
}

interface ListingsResponse {
  listings: RepliersListing[];
  count?: number;
}

async function fetchBuildingListings(
  addr: ReturnType<typeof parseAddressFromSlug>,
  extras: Record<string, unknown>,
): Promise<RepliersListing[]> {
  if (!addr) return [];
  try {
    const res = await repliersRequest<ListingsResponse>({
      path: '/listings',
      body: {
        streetNumber: addr.streetNumber,
        streetName: addr.streetName,
        ...(addr.streetSuffix ? { streetSuffix: addr.streetSuffix } : {}),
        ...(addr.streetDirection ? { streetDirection: addr.streetDirection } : {}),
        class: 'condo',
        boardId: 91,
        resultsPerPage: 50,
        ...extras,
      },
      revalidate: 600,
    });
    return res.listings || [];
  } catch {
    return [];
  }
}

async function getBuildingData(slug: string) {
  const addr = parseAddressFromSlug(slug);
  if (!addr) return null;

  const [forSale, forRent, sold] = await Promise.all([
    fetchBuildingListings(addr, { status: 'A', type: 'sale' }),
    fetchBuildingListings(addr, { status: 'A', type: 'lease' }),
    fetchBuildingListings(addr, { status: 'U', lastStatus: 'Sld', resultsPerPage: 20, sortBy: 'soldDateDesc' }),
  ]);

  return { addr, forSale, forRent, sold };
}

function parseSqftMid(sqft?: string): number {
  if (!sqft) return 0;
  const m = sqft.match(/(\d+)\s*-?\s*(\d+)?/);
  if (!m) return 0;
  const lo = parseInt(m[1]);
  const hi = m[2] ? parseInt(m[2]) : lo;
  return (lo + hi) / 2;
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function flag(v: unknown): boolean {
  return v === 'Y' || v === true || v === 'y' || v === 'Yes';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const addr = parseAddressFromSlug(params.slug);
  if (!addr) {
    return { title: 'Building Not Found | CondoWizard' };
  }
  const displayAddr = formatAddress(addr);
  const airbnb = getBuildingBySlug(params.slug);
  const name = airbnb?.buildingName || displayAddr;
  return {
    title: `${name} | ${displayAddr} Condos for Sale & Rent | CondoWizard`,
    description: `View active listings, rentals, sold history, amenities and maintenance fees at ${displayAddr}${airbnb?.neighbourhood ? `, ${airbnb.neighbourhood}` : ''}, Toronto.`,
  };
}

export default async function BuildingPage({ params, searchParams }: Props) {
  const data = await getBuildingData(params.slug);
  if (!data) notFound();

  const { addr, forSale, forRent, sold } = data;
  const displayAddr = formatAddress(addr);
  const airbnb = getBuildingBySlug(params.slug);

  // Building info from first available listing
  const firstListing = forSale[0] || forRent[0] || sold[0];
  const condo = (firstListing?.condominium as Record<string, unknown> | undefined) || {};
  const fees = (condo.fees as Record<string, unknown> | undefined) || {};
  const amenities: string[] = (condo.ammenities as string[] | undefined)
    || (condo.buildingAmenities as string[] | undefined)
    || [];
  const stories = firstListing?.details?.stories || null;
  const yearBuilt = firstListing?.details?.yearBuilt || null;
  const neighborhood = firstListing?.address?.neighborhood || airbnb?.neighbourhood || '';
  const lat = firstListing?.map?.latitude || airbnb?.lat || null;
  const lng = firstListing?.map?.longitude || airbnb?.lng || null;
  const condoCorp = (condo.condoCorp as string | undefined) || null;

  // Stats
  const salePrices = forSale.map((l) => l.listPrice).filter((p): p is number => !!p && p > 0);
  const rentPrices = forRent.map((l) => l.listPrice).filter((p): p is number => !!p && p > 0);
  const soldPrices = sold.map((l) => l.soldPrice || l.listPrice).filter((p): p is number => !!p && p > 0);
  const avgSale = avg(salePrices);
  const avgRent = avg(rentPrices);
  const avgSold = avg(soldPrices);

  // Maintenance analysis across every listing
  const allListings = [...forSale, ...forRent];
  const feesData = allListings
    .map((l) => {
      const maintStr = l.condominium?.fees?.maintenance || l.details?.maintenanceFee;
      const maintenance = maintStr ? parseFloat(String(maintStr)) : 0;
      const sqft = parseSqftMid(l.details?.sqft);
      return { maintenance, sqft };
    })
    .filter((f) => f.maintenance > 0);
  const avgMaintenance = avg(feesData.map((f) => f.maintenance));
  const withSqft = feesData.filter((f) => f.sqft > 0);
  const avgPerSqft = avg(withSqft.map((f) => f.maintenance / f.sqft));
  const annualEstimate = avgMaintenance * 12;

  const includes = [
    { label: 'Heat', included: flag(fees.heatIncl) },
    { label: 'Water', included: flag(fees.waterIncl) },
    { label: 'Hydro', included: flag(fees.hydroIncl) },
    { label: 'Parking', included: flag(fees.parkingIncl) },
    { label: 'Cable', included: flag(fees.cableIncl) || flag(fees.cableInlc) },
    { label: 'Building Insurance', included: flag(fees.buildingInsurance) || flag(fees.insuranceIncl) },
  ];

  // Gallery: first image from each listing, deduplicated
  const exteriorImages: string[] = [];
  const seen = new Set<string>();
  for (const l of [...forSale, ...forRent]) {
    const img = l.images?.[0];
    if (!img) continue;
    const url = img.startsWith('http') ? img : `https://cdn.repliers.io/${img}`;
    if (!seen.has(url)) {
      seen.add(url);
      exteriorImages.push(url);
    }
    if (exteriorImages.length >= 5) break;
  }

  // Investment metrics
  const minRent = rentPrices.length ? Math.min(...rentPrices) : 0;
  const rentalYield = avgRent > 0 && avgSale > 0 ? (avgRent * 12) / avgSale * 100 : 0;

  // Pre-con cross-reference
  let preconMatch: { name: string; developer: string | null; slug: string } | null = null;
  try {
    const { data: preconRows } = await supabase
      .from('precon_projects')
      .select('name, developer, slug')
      .ilike('address', `%${addr.streetNumber} ${addr.streetName}%`)
      .limit(1);
    if (preconRows && preconRows.length > 0) {
      preconMatch = preconRows[0] as { name: string; developer: string | null; slug: string };
    }
  } catch {}

  // Nearby buildings from airbnb dataset (same neighbourhood)
  const nearby = airbnb
    ? AIRBNB_BUILDINGS.filter((b) => b.neighbourhood === airbnb.neighbourhood && b.slug !== airbnb.slug).slice(0, 6)
    : [];

  // Tab
  const tab = (searchParams?.tab as string) || 'sale';

  const unifiedForSale = forSale.map(mapMLSToUnified);
  const unifiedForRent = forRent.map(mapMLSToUnified);
  const unifiedSold = sold.map(mapMLSToUnified);

  const sortedSale = [...unifiedForSale].sort((a, b) => a.price - b.price);
  const sortedRent = [...unifiedForRent].sort((a, b) => a.price - b.price);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Residence',
    name: airbnb?.buildingName || displayAddr,
    address: {
      '@type': 'PostalAddress',
      streetAddress: displayAddr,
      addressLocality: 'Toronto',
      addressRegion: 'ON',
      addressCountry: 'CA',
    },
    ...(lat && lng ? { geo: { '@type': 'GeoCoordinates', latitude: lat, longitude: lng } } : {}),
  };

  return (
    <div className="pt-14 bg-bg min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container-main py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link href="/" className="hover:text-accent-blue">Home</Link>
          <span>/</span>
          <Link href="/condos" className="hover:text-accent-blue">Condos</Link>
          <span>/</span>
          <span className="text-text-primary">{displayAddr}</span>
        </nav>

        {/* HERO */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <h1 className="font-serif text-4xl font-bold text-text-primary">
              {airbnb?.buildingName || displayAddr}
            </h1>
            {airbnb?.buildingName && (
              <p className="text-lg text-text-muted mt-1">{displayAddr}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {neighborhood && (
                <Link
                  href={`/neighborhood/${slugify(neighborhood)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-blue/10 text-accent-blue text-sm font-medium hover:bg-accent-blue/20"
                >
                  {neighborhood}
                </Link>
              )}
              <span className="text-sm text-text-muted">
                {stories ? `${stories} storeys · ` : ''}
                {forSale.length} for sale · {forRent.length} for rent
              </span>
            </div>

            {/* Gallery */}
            {exteriorImages.length > 0 && (
              <div className="grid grid-cols-4 grid-rows-2 gap-2 mt-6 h-[360px]">
                <img
                  src={exteriorImages[0]}
                  alt={displayAddr}
                  className="col-span-2 row-span-2 rounded-xl object-cover w-full h-full"
                />
                {exteriorImages.slice(1, 5).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`${displayAddr} ${i + 2}`}
                    className="rounded-xl object-cover w-full h-full"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Stats sidebar */}
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs text-text-muted uppercase tracking-wide">For Sale</p>
              <p className="font-serif text-3xl font-bold mt-1">{forSale.length}</p>
              {avgSale > 0 && <p className="text-sm text-text-muted mt-1">Avg ${Math.round(avgSale).toLocaleString()}</p>}
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs text-text-muted uppercase tracking-wide">For Rent</p>
              <p className="font-serif text-3xl font-bold mt-1">{forRent.length}</p>
              {avgRent > 0 && <p className="text-sm text-text-muted mt-1">Avg ${Math.round(avgRent).toLocaleString()}/mo</p>}
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs text-text-muted uppercase tracking-wide">Recently Sold</p>
              <p className="font-serif text-3xl font-bold mt-1">{sold.length}</p>
              {avgSold > 0 && <p className="text-sm text-text-muted mt-1">Avg ${Math.round(avgSold).toLocaleString()}</p>}
            </div>
          </div>
        </section>

        {/* STATS ROW */}
        <section className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'For Sale', value: forSale.length },
            { label: 'Avg Sale', value: avgSale ? `$${Math.round(avgSale / 1000)}K` : '—' },
            { label: 'For Rent', value: forRent.length },
            { label: 'Avg Rent', value: avgRent ? `$${Math.round(avgRent).toLocaleString()}` : '—' },
            { label: 'Avg Maint Fee', value: avgMaintenance ? `$${Math.round(avgMaintenance)}` : '—' },
            { label: 'Storeys', value: stories || '—' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-border p-4 text-center">
              <p className="font-serif text-xl font-bold text-text-primary">{s.value}</p>
              <p className="text-[11px] text-text-muted uppercase tracking-wide mt-0.5">{s.label}</p>
            </div>
          ))}
        </section>

        {/* MAINTENANCE FEE ANALYSIS */}
        {feesData.length > 0 && (
          <section className="bg-white rounded-xl border border-border p-6 mb-8">
            <h2 className="font-serif text-2xl font-bold text-text-primary mb-1">Maintenance Fees</h2>
            <p className="text-sm text-text-muted mb-4">Based on {feesData.length} listing{feesData.length === 1 ? '' : 's'} in this building</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-surface2 rounded-lg p-4">
                <p className="text-xs text-text-muted uppercase tracking-wide">Average Monthly Fee</p>
                <p className="font-serif text-2xl font-bold mt-1">${Math.round(avgMaintenance).toLocaleString()}<span className="text-sm font-normal text-text-muted">/mo</span></p>
              </div>
              <div className="bg-surface2 rounded-lg p-4">
                <p className="text-xs text-text-muted uppercase tracking-wide">Average Per Sqft</p>
                <p className="font-serif text-2xl font-bold mt-1">
                  {avgPerSqft > 0 ? `$${avgPerSqft.toFixed(2)}` : '—'}
                  <span className="text-sm font-normal text-text-muted">/sqft/mo</span>
                </p>
              </div>
              <div className="bg-surface2 rounded-lg p-4">
                <p className="text-xs text-text-muted uppercase tracking-wide">Annual Estimate</p>
                <p className="font-serif text-2xl font-bold mt-1">${Math.round(annualEstimate).toLocaleString()}<span className="text-sm font-normal text-text-muted">/yr</span></p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary mb-2">What's Included</p>
              <div className="flex flex-wrap gap-3">
                {includes.map((inc) => (
                  <div
                    key={inc.label}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                      inc.included ? 'bg-accent-green/10 text-accent-green' : 'bg-red-50 text-red-600'
                    }`}
                  >
                    <span className="text-base leading-none">{inc.included ? '✅' : '❌'}</span>
                    <span className="font-medium">{inc.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* TABS */}
        <section className="mb-8">
          <div className="border-b border-border flex gap-0 overflow-x-auto">
            {[
              { key: 'sale', label: `For Sale (${forSale.length})` },
              { key: 'rent', label: `For Rent (${forRent.length})` },
              { key: 'sold', label: `Recently Sold (${sold.length})` },
              { key: 'info', label: 'Building Info' },
            ].map((t) => (
              <Link
                key={t.key}
                href={`/building/${params.slug}?tab=${t.key}`}
                scroll={false}
                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  tab === t.key ? 'border-accent-blue text-accent-blue' : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>

          <div className="mt-6">
            {tab === 'sale' && (
              sortedSale.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedSale.map((l) => <ListingCard key={l.id} listing={l} />)}
                </div>
              ) : (
                <p className="text-text-muted py-12 text-center">No active listings for sale in this building right now.</p>
              )
            )}
            {tab === 'rent' && (
              sortedRent.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedRent.map((l) => <ListingCard key={l.id} listing={l} isRentView />)}
                </div>
              ) : (
                <p className="text-text-muted py-12 text-center">No active rentals in this building right now.</p>
              )
            )}
            {tab === 'sold' && (
              unifiedSold.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unifiedSold.map((l) => <ListingCard key={l.id} listing={l} isSoldView />)}
                </div>
              ) : (
                <p className="text-text-muted py-12 text-center">No recent sold data for this building.</p>
              )
            )}
            {tab === 'info' && (
              <div className="space-y-6">
                {amenities.length > 0 && (
                  <div>
                    <h3 className="font-serif text-xl font-bold text-text-primary mb-3">Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {amenities.map((a) => (
                        <span key={a} className="inline-block px-3 py-1.5 rounded-full bg-surface2 text-sm text-text-primary border border-border">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {condoCorp && (
                    <div className="bg-white rounded-lg border border-border p-4">
                      <p className="text-xs text-text-muted uppercase tracking-wide">Condo Corporation</p>
                      <p className="font-medium text-text-primary mt-1">{condoCorp}</p>
                    </div>
                  )}
                  <div className="bg-white rounded-lg border border-border p-4">
                    <p className="text-xs text-text-muted uppercase tracking-wide">Storeys</p>
                    <p className="font-medium text-text-primary mt-1">{stories || 'Unknown'}</p>
                  </div>
                  {yearBuilt && (
                    <div className="bg-white rounded-lg border border-border p-4">
                      <p className="text-xs text-text-muted uppercase tracking-wide">Year Built</p>
                      <p className="font-medium text-text-primary mt-1">{yearBuilt}</p>
                    </div>
                  )}
                  {avgMaintenance > 0 && (
                    <div className="bg-white rounded-lg border border-border p-4">
                      <p className="text-xs text-text-muted uppercase tracking-wide">Avg Maintenance</p>
                      <p className="font-medium text-text-primary mt-1">${Math.round(avgMaintenance).toLocaleString()}/mo</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* INVESTMENT SECTION */}
        {(rentalYield > 0 || airbnb) && (
          <section className="bg-white rounded-xl border border-border p-6 mb-8">
            <h2 className="font-serif text-2xl font-bold text-text-primary mb-4">Investment Snapshot</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rentalYield > 0 && (
                <div className="bg-surface2 rounded-lg p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wide">Est. Rental Yield</p>
                  <p className="font-serif text-2xl font-bold mt-1">{rentalYield.toFixed(1)}%</p>
                  <p className="text-xs text-text-muted mt-1">Avg rent × 12 ÷ avg sale</p>
                </div>
              )}
              {minRent > 0 && (
                <div className="bg-surface2 rounded-lg p-4">
                  <p className="text-xs text-text-muted uppercase tracking-wide">Rent From</p>
                  <p className="font-serif text-2xl font-bold mt-1">${minRent.toLocaleString()}/mo</p>
                </div>
              )}
              {airbnb && (
                <div className="bg-accent-green/5 rounded-lg p-4 border border-accent-green/20">
                  <p className="text-xs text-accent-green uppercase tracking-wide font-medium">Airbnb-Friendly</p>
                  <p className="font-serif text-2xl font-bold mt-1">{airbnb.registrations}</p>
                  <p className="text-xs text-text-muted mt-1">STR registrations on file</p>
                  <Link href={`/airbnb-friendly/${airbnb.slug}`} className="inline-block mt-2 text-sm text-accent-blue hover:underline">
                    View Airbnb profile →
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* PRE-CON CROSS-REF */}
        {preconMatch && (
          <section className="bg-gradient-to-r from-accent-blue/5 to-accent-green/5 rounded-xl border border-accent-blue/20 p-6 mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs text-accent-blue uppercase tracking-wide font-medium">Originally Launched As</p>
                <h2 className="font-serif text-2xl font-bold text-text-primary mt-1">{preconMatch.name}</h2>
                {preconMatch.developer && (
                  <p className="text-text-muted mt-1">by {preconMatch.developer}</p>
                )}
              </div>
              <Link
                href={`/pre-construction/${preconMatch.slug}`}
                className="px-4 py-2 rounded-lg bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue/90"
              >
                View Pre-Construction Profile →
              </Link>
            </div>
          </section>
        )}

        {/* NEARBY BUILDINGS */}
        {nearby.length > 0 && (
          <section className="mb-8">
            <h2 className="font-serif text-2xl font-bold text-text-primary mb-4">Nearby Buildings in {airbnb?.neighbourhood}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {nearby.map((b) => (
                <Link
                  key={b.slug}
                  href={`/building/${b.slug}`}
                  className="bg-white rounded-lg border border-border p-3 hover:border-accent-blue/40 hover:shadow-sm transition-all"
                >
                  <p className="font-medium text-text-primary text-sm">{b.buildingName || b.address}</p>
                  <p className="text-xs text-text-muted mt-1">{b.address}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* RECO footer */}
        <div className="mt-12 p-4 bg-white rounded-xl border border-border text-xs text-text-muted">
          <p>Tal Shelef, Sales Representative | Rare Real Estate Inc., Brokerage | 1701 Avenue Rd, Toronto, ON M5M 3Y3 | 647-890-4082</p>
          <p className="mt-1">Listing data courtesy of TRREB. Last updated: {new Date().toLocaleDateString('en-CA')}.</p>
        </div>
      </div>
    </div>
  );
}
