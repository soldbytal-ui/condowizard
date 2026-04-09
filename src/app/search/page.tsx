'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import SearchFilters from '@/components/search/SearchFilters';
import ListingCard from '@/components/search/ListingCard';
import { UnifiedListing, ListingFilters, BUILDING_TYPE_COLORS, BUILDING_TYPE_LABELS } from '@/types/listing';
import { useAuth } from '@/contexts/AuthContext';

const SearchMap = dynamic(() => import('@/components/search/SearchMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-900 animate-pulse" />,
});

function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; }

function dedup(listings: UnifiedListing[]): UnifiedListing[] {
  const seen = new Map<string, UnifiedListing>();
  for (const l of listings) { if (!seen.has(l.id)) seen.set(l.id, l); }
  if (seen.size !== listings.length) console.warn(`[CondoWizard] Removed ${listings.length - seen.size} duplicate listings`);
  return [...seen.values()];
}

// Community boundary type (shared with SearchMap)
interface CommunityBoundary {
  name: string;
  boundary: number[][][];
  lat: number;
  lng: number;
}

// Polygon names that don't match Repliers listing neighbourhood names
const NEIGHBOURHOOD_NAME_MAP: Record<string, string> = {
  'Oakwood-Vaughan': 'Oakwood Village',
  'Toronto': '', // City-level polygon, skip — not a real neighbourhood
};

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { savedListingIds, toggleSaveListing } = useAuth();
  const [listings, setListings] = useState<UnifiedListing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<Record<string, any>>({});
  const fetchCounter = useRef(0);
  const communitiesRef = useRef<CommunityBoundary[]>([]);

  // FIX 3: Collapsible left panel
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  // FIX 4: Listing preview panel
  const [previewListing, setPreviewListing] = useState<UnifiedListing | null>(null);

  const [filters, setFilters] = useState<ListingFilters>(() => {
    const tab = (searchParams.get('tab') as ListingFilters['tab']) || 'sale';
    return {
      tab,
      sortBy: (searchParams.get('sortBy') as ListingFilters['sortBy']) || 'newest',
      priceMin: searchParams.get('priceMin') ? parseInt(searchParams.get('priceMin')!) : undefined,
      priceMax: searchParams.get('priceMax') ? parseInt(searchParams.get('priceMax')!) : undefined,
      bedsMin: searchParams.get('beds') ? parseInt(searchParams.get('beds')!) : undefined,
      neighborhood: searchParams.get('neighborhood') || undefined,
      area: searchParams.get('area') || undefined,
      soldDateRange: tab === 'sold' ? '90' : undefined,
      soldDateMin: tab === 'sold' ? daysAgo(90) : undefined,
      page: 1,
      pageSize: 24,
    };
  });

  function buildRequestBody(f: ListingFilters): Record<string, unknown> {
    const b: Record<string, unknown> = { city: 'Toronto', resultsPerPage: f.pageSize || 24, pageNum: f.page || 1, statistics: true };
    if (f.tab === 'sale') { b.status = 'A'; b.type = 'sale'; }
    else if (f.tab === 'sold') { b.status = 'U'; b.lastStatus = 'Sld'; }
    else if (f.tab === 'rent') { b.status = 'A'; b.type = 'lease'; }
    const sold = f.tab === 'sold';
    switch (f.sortBy) {
      case 'newest': b.sortBy = sold ? 'soldDateDesc' : 'updatedOnDesc'; break;
      case 'price_asc': b.sortBy = sold ? 'soldPriceAsc' : 'listPriceAsc'; break;
      case 'price_desc': b.sortBy = sold ? 'soldPriceDesc' : 'listPriceDesc'; break;
      case 'largest': b.sortBy = 'sqftDesc'; break;
      default: b.sortBy = sold ? 'soldDateDesc' : 'updatedOnDesc';
    }
    if (f.area) b.area = f.area;
    if (f.municipality) b.city = f.municipality;
    if (f.neighborhood) b.neighborhood = f.neighborhood;
    if (f.streetName) b.streetName = f.streetName;
    if (f.streetNumberMin) b.minStreetNumber = f.streetNumberMin;
    if (f.streetNumberMax) b.maxStreetNumber = f.streetNumberMax;
    if (f.streetDirection) b.streetDirection = f.streetDirection;
    if (f.unitNumber) b.unitNumber = f.unitNumber;
    if (f.mlsNumber) b.mlsNumber = f.mlsNumber;
    if (f.propertyType?.length) b.propertyType = f.propertyType;
    if (f.style?.length) b.style = f.style;
    if (f.class) b.class = f.class;
    if (f.priceMin) b.minPrice = f.priceMin;
    if (f.priceMax) b.maxPrice = f.priceMax;
    if (f.maintenanceFeeMax) b.maxMaintenanceFee = f.maintenanceFeeMax;
    if (f.taxMin) b.minTaxes = f.taxMin;
    if (f.taxMax) b.maxTaxes = f.taxMax;
    if (f.bedsMin) b.minBeds = f.bedsMin;
    if (f.bedsMax) b.maxBeds = f.bedsMax;
    if (f.bedsPlus) b.minBedroomsPlus = f.bedsPlus;
    if (f.bathsMin) b.minBaths = f.bathsMin;
    if (f.bathsMax) b.maxBaths = f.bathsMax;
    if (f.sqftMin) b.minSqft = f.sqftMin;
    if (f.sqftMax) b.maxSqft = f.sqftMax;
    if (f.lotSizeMin) b.minLotSizeSqft = f.lotSizeMin;
    if (f.lotSizeMax) b.maxLotSizeSqft = f.lotSizeMax;
    if (f.storiesMin) b.minStories = f.storiesMin;
    if (f.storiesMax) b.maxStories = f.storiesMax;
    if (f.yearBuiltMin) b.minYearBuilt = f.yearBuiltMin;
    if (f.yearBuiltMax) b.maxYearBuilt = f.yearBuiltMax;
    if (f.parkingMin) b.minParkingSpaces = f.parkingMin;
    if (f.garageMin) b.minGarageSpaces = f.garageMin;
    if (f.garageType?.length) b.garage = f.garageType;
    if (f.locker) b.locker = f.locker;
    if (f.basement?.length) b.basement = f.basement;
    if (f.heating?.length) b.heating = f.heating;
    if (f.pool?.length) b.swimmingPool = f.pool;
    if (f.waterfront) b.waterfront = f.waterfront;
    if (f.den) b.den = f.den;
    if (f.lastStatus?.length && f.tab !== 'sold') b.lastStatus = f.lastStatus;
    if (sold) { if (f.domMin) b.minDaysOnMarket = f.domMin; if (f.domMax) b.maxDaysOnMarket = f.domMax; }
    if (f.updatedOnMin) b.minUpdatedOn = f.updatedOnMin;
    if (f.updatedOnMax) b.maxUpdatedOn = f.updatedOnMax;
    if (f.listDateMin) b.minListDate = f.listDateMin;
    if (f.listDateMax) b.maxListDate = f.listDateMax;
    if (f.soldDateMin) b.minSoldDate = f.soldDateMin;
    if (f.soldDateMax) b.maxSoldDate = f.soldDateMax;
    if (f.soldPriceMin) b.minSoldPrice = f.soldPriceMin;
    if (f.soldPriceMax) b.maxSoldPrice = f.soldPriceMax;
    if (f.openHouse) b.minOpenHouseDate = f.openHouseDateMin || new Date().toISOString().split('T')[0];
    if (f.openHouseDateMax) b.maxOpenHouseDate = f.openHouseDateMax;
    if (f.hasImages) b.hasImages = true;
    if (f.hasAgents) b.hasAgents = true;
    return b;
  }

  const handleMlsLookup = useCallback(async (mls: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/repliers/listings/${mls}`);
      if (res.ok) { const data = await res.json(); if (data.listing) { setListings([data.listing]); setTotalCount(1); setStatistics({}); return; } }
      setListings([]); setTotalCount(0);
    } catch { setListings([]); setTotalCount(0); }
    finally { setLoading(false); }
  }, []);

  // Main fetch with FIX 1: polygon fallback for 0-result neighbourhoods
  const fetchListings = useCallback(async () => {
    const fetchId = ++fetchCounter.current;
    setLoading(true);
    try {
      const body = buildRequestBody(filters);
      console.log(`[FETCH #${fetchId}] neighborhood=${filters.neighborhood}, body:`, JSON.stringify(body));

      const res = await fetch('/api/repliers/listings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });

      if (res.ok && fetchId === fetchCounter.current) {
        const data = await res.json();
        let unique = dedup(data.listings || []);
        let total = data.total || 0;

        // FIX 1: If neighbourhood filter returned 0, try polygon boundary fallback
        if (total === 0 && filters.neighborhood && communitiesRef.current.length > 0) {
          console.log(`[FETCH #${fetchId}] 0 results for neighborhood="${filters.neighborhood}", trying polygon fallback`);
          const community = communitiesRef.current.find((c) => c.name === filters.neighborhood);
          if (community?.boundary) {
            const fallbackBody = { ...body };
            delete fallbackBody.neighborhood;
            fallbackBody.map = JSON.stringify({ type: 'Polygon', coordinates: community.boundary });

            const fbRes = await fetch('/api/repliers/listings', {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fallbackBody),
            });
            if (fbRes.ok && fetchId === fetchCounter.current) {
              const fbData = await fbRes.json();
              console.log(`[FETCH #${fetchId}] Polygon fallback: ${fbData.total} results`);
              if (fbData.total > 0) {
                unique = dedup(fbData.listings || []);
                total = fbData.total;
                if (fbData.statistics) setStatistics(fbData.statistics);
              }
            }
          }
        }

        console.log(`[FETCH #${fetchId}] Final: ${total} total, ${unique.length} displayed`);
        setListings(unique); setTotalCount(total);
        if (data.statistics) setStatistics(data.statistics);
      } else if (fetchId !== fetchCounter.current) {
        console.log(`[FETCH #${fetchId}] DISCARDED stale`);
      }
    } catch (error: any) {
      console.error(`[FETCH] Error:`, error);
    } finally {
      if (fetchId === fetchCounter.current) setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (filters.tab !== 'sale') p.set('tab', filters.tab);
    if (filters.sortBy && filters.sortBy !== 'newest') p.set('sortBy', filters.sortBy);
    if (filters.priceMin) p.set('priceMin', String(filters.priceMin));
    if (filters.priceMax) p.set('priceMax', String(filters.priceMax));
    if (filters.bedsMin) p.set('beds', String(filters.bedsMin));
    if (filters.neighborhood) p.set('neighborhood', filters.neighborhood);
    if (filters.area) p.set('area', filters.area);
    if (filters.class) p.set('class', filters.class);
    router.replace(`/search${p.toString() ? '?' + p.toString() : ''}`, { scroll: false });
  }, [filters, router]);

  const handleFilterChange = useCallback((partial: Partial<ListingFilters>) => {
    setFilters((prev) => {
      if (partial.tab && partial.tab !== prev.tab) {
        const base: ListingFilters = {
          tab: partial.tab, page: 1, pageSize: 24, sortBy: 'newest',
          area: prev.area, municipality: prev.municipality, neighborhood: prev.neighborhood,
        };
        if (partial.tab === 'sold') { base.soldDateRange = '90'; base.soldDateMin = daysAgo(90); }
        return base;
      }
      return { ...prev, ...partial };
    });
  }, []);

  const handleCommunityClick = useCallback((code: string, name: string) => {
    // Map polygon name → Repliers listing neighbourhood name
    const repliersName = NEIGHBOURHOOD_NAME_MAP[name];
    if (repliersName === '') {
      console.log(`[COMMUNITY-CLICK] Skipping "${name}" (city-level polygon)`);
      return;
    }
    const filterName = repliersName || name;
    console.log(`[COMMUNITY-CLICK] ${name}${repliersName ? ` → mapped to "${repliersName}"` : ''}`);
    setPreviewListing(null);
    setFilters((prev) => ({ ...prev, neighborhood: filterName, class: undefined, propertyType: undefined, page: 1 }));
  }, []);

  const handleBoundsChange = useCallback((bounds: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } }) => {
    setFilters((prev) => prev.neighborhood ? prev : { ...prev, bounds });
  }, []);

  // Pin CLICK → persistent preview panel (stays open until closed)
  const handlePinClick = useCallback((listing: UnifiedListing) => {
    setPreviewListing(listing);
  }, []);

  // Map background click → close preview panel
  const handleMapBackgroundClick = useCallback(() => {
    setPreviewListing(null);
  }, []);

  // Receive communities from SearchMap
  const handleCommunitiesLoaded = useCallback((communities: CommunityBoundary[]) => {
    communitiesRef.current = communities;
  }, []);

  return (
    <div className="h-screen flex flex-col pt-14">
      <SearchFilters
        filters={filters} onFilterChange={handleFilterChange} onMlsLookup={handleMlsLookup}
        totalCount={totalCount} avgPrice={statistics.averagePrice} avgDom={statistics.averageDom} medianSoldPrice={statistics.medianSoldPrice}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Collapsible left panel — inline style for smooth transition */}
        <div
          className="bg-bg border-r border-border overflow-hidden flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out"
          style={{ width: panelCollapsed ? '0px' : '55%', minWidth: panelCollapsed ? '0px' : '400px' }}
        >
          {!panelCollapsed && <div className="h-full overflow-y-auto">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-border animate-pulse">
                    <div className="aspect-[4/3] bg-surface2 rounded-t-xl" />
                    <div className="p-3 space-y-2"><div className="h-5 bg-surface2 rounded w-24" /><div className="h-4 bg-surface2 rounded w-40" /></div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <svg className="w-16 h-16 text-text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <h3 className="text-lg font-semibold text-text-primary">No listings found</h3>
                <p className="text-sm text-text-muted mt-1">Try adjusting your filters or search area</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                {listings.map((listing) => (
                  <ListingCard key={listing.mlsNumber || listing.id} listing={listing} onHover={setHighlightedId} isHighlighted={listing.id === highlightedId} isSoldView={filters.tab === 'sold'} isRentView={filters.tab === 'rent'} />
                ))}
              </div>
            )}
            {listings.length > 0 && listings.length < totalCount && (
              <div className="p-4 text-center">
                <button onClick={() => handleFilterChange({ page: (filters.page || 1) + 1 })} className="px-6 py-2.5 bg-accent-blue text-white rounded-lg text-sm font-medium hover:bg-accent-blue/90">
                  Load more ({totalCount - listings.length} remaining)
                </button>
              </div>
            )}
            <div className="p-4 text-[10px] text-text-muted border-t border-border">
              <p>Tal Shelef, Sales Representative | Rare Real Estate Inc., Brokerage | 1701 Avenue Rd, Toronto, ON M5M 3Y3 | 647-890-4082</p>
              <p className="mt-1">Data provided by the Toronto Regional Real Estate Board (TRREB). All information is deemed reliable but not guaranteed.</p>
            </div>
          </div>}
        </div>

        {/* Collapse/expand toggle */}
        <button onClick={() => setPanelCollapsed(!panelCollapsed)}
          className="hidden lg:flex items-center justify-center w-6 bg-white border-x border-border hover:bg-gray-50 cursor-pointer z-20 flex-shrink-0"
          title={panelCollapsed ? 'Show listings' : 'Expand map'}>
          <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${panelCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Map — flex-1 fills remaining space */}
        <div className="flex-1 relative min-w-0">
          <SearchMap
            listings={listings} highlightedId={highlightedId} onMarkerHover={setHighlightedId}
            onBoundsChange={handleBoundsChange} isSoldView={filters.tab === 'sold'}
            onCommunityClick={handleCommunityClick} selectedNeighbourhood={filters.neighborhood}
            onPinClick={handlePinClick} onCommunitiesLoaded={handleCommunitiesLoaded}
            onMapBackgroundClick={handleMapBackgroundClick} panelCollapsed={panelCollapsed}
          />

          {/* FIX 4: Listing preview panel */}
          {previewListing && (
            <div className="absolute bottom-4 left-4 w-[360px] bg-white rounded-xl shadow-2xl z-30 overflow-hidden animate-slideUp max-h-[calc(100%-2rem)]">
              <button onClick={(e) => { e.stopPropagation(); setPreviewListing(null); }} className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center z-10 text-sm">
                <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="relative">
                {previewListing.images?.[0] && <img src={previewListing.images[0]} alt={previewListing.address} className="w-full h-48 object-cover rounded-t-2xl" />}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: BUILDING_TYPE_COLORS[previewListing.buildingType] || '#6B7280' }} />
                  <span className="text-[10px] text-white font-medium">{BUILDING_TYPE_LABELS[previewListing.buildingType] || previewListing.buildingType}</span>
                </div>
                {previewListing.images && previewListing.images.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">1/{previewListing.images.length}</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-serif text-xl font-bold text-text-primary">{previewListing.priceDisplay}</h3>
                  <button onClick={(e) => { e.stopPropagation(); toggleSaveListing(previewListing.id, previewListing.source); }}
                    className={`w-8 h-8 flex items-center justify-center rounded-full ${savedListingIds.has(previewListing.id) ? 'text-red-500' : 'text-text-muted'} hover:bg-surface2`}>
                    <svg className="w-5 h-5" fill={savedListingIds.has(previewListing.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </button>
                </div>
                <p className="text-sm font-medium text-text-primary">{previewListing.address}</p>
                <p className="text-xs text-text-muted mt-0.5">{previewListing.neighborhood}, Toronto</p>
                <div className="flex gap-4 mt-3 text-sm text-text-muted">
                  {previewListing.beds > 0 && <span>{previewListing.beds} bed</span>}
                  {previewListing.baths > 0 && <span>{previewListing.baths} bath</span>}
                  {previewListing.sqft && <span>{previewListing.sqft} sqft</span>}
                  {previewListing.parking && previewListing.parking > 0 && <span>{previewListing.parking} park</span>}
                </div>
                {previewListing.maintenanceFee && previewListing.maintenanceFee > 0 && (
                  <p className="text-xs text-text-muted mt-2">${Math.round(previewListing.maintenanceFee)}/mo maintenance</p>
                )}
                <div className="flex justify-between text-xs text-text-muted mt-3">
                  <span>MLS# {previewListing.mlsNumber}</span>
                  <span>{previewListing.dom}d on market</span>
                </div>
                <div className="flex gap-3 mt-4">
                  <Link href={`/listing/${previewListing.mlsNumber}`} className="flex-1 py-2.5 bg-accent-blue text-white text-center rounded-lg text-sm font-semibold hover:bg-accent-blue/90">
                    View Full Listing
                  </Link>
                  <a href={`tel:6478904082`} className="px-4 py-2.5 border border-border rounded-lg text-sm text-text-muted hover:bg-surface2">Call</a>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-text-muted">Tal Shelef, Sales Representative — <a href="tel:6478904082" className="text-accent-blue">647-890-4082</a></p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
