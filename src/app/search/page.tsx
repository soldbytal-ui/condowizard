'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import SearchFilters from '@/components/search/SearchFilters';
import ListingCard from '@/components/search/ListingCard';
import { UnifiedListing, ListingFilters } from '@/types/listing';

const SearchMap = dynamic(() => import('@/components/search/SearchMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-900 animate-pulse" />,
});

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [listings, setListings] = useState<UnifiedListing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<Record<string, any>>({});

  const [filters, setFilters] = useState<ListingFilters>(() => {
    const tab = (searchParams.get('tab') as ListingFilters['tab']) || 'sale';
    return {
      tab,
      sortBy: (searchParams.get('sortBy') as ListingFilters['sortBy']) || 'newest',
      priceMin: searchParams.get('priceMin') ? parseInt(searchParams.get('priceMin')!) : undefined,
      priceMax: searchParams.get('priceMax') ? parseInt(searchParams.get('priceMax')!) : undefined,
      bedsMin: searchParams.get('beds') ? parseInt(searchParams.get('beds')!) : undefined,
      neighborhood: searchParams.get('neighborhood') || undefined,
      community: searchParams.get('community') || undefined,
      soldDateRange: tab === 'sold' ? '90' : undefined,
      soldDateMin: tab === 'sold' ? (() => { const d = new Date(); d.setDate(d.getDate() - 90); return d.toISOString().split('T')[0]; })() : undefined,
      page: 1,
      pageSize: 24,
    };
  });

  // Build the full API request body from filters
  function buildRequestBody(f: ListingFilters): Record<string, unknown> {
    const body: Record<string, unknown> = {
      city: 'Toronto',
      resultsPerPage: f.pageSize || 24,
      pageNum: f.page || 1,
      statistics: true,
    };

    // Tab → status/type
    if (f.tab === 'sale') { body.status = 'A'; body.type = 'sale'; }
    else if (f.tab === 'sold') { body.status = 'U'; body.lastStatus = 'Sld'; }
    else if (f.tab === 'rent') { body.status = 'A'; body.type = 'lease'; }

    // Sort
    switch (f.sortBy) {
      case 'newest': body.sortBy = f.tab === 'sold' ? 'soldDateDesc' : 'updatedOnDesc'; break;
      case 'price_asc': body.sortBy = f.tab === 'sold' ? 'soldPriceAsc' : 'listPriceAsc'; break;
      case 'price_desc': body.sortBy = f.tab === 'sold' ? 'soldPriceDesc' : 'listPriceDesc'; break;
      case 'largest': body.sortBy = 'sqftDesc'; break;
      default: body.sortBy = 'updatedOnDesc';
    }

    // Price
    if (f.priceMin) body.minPrice = f.priceMin;
    if (f.priceMax) body.maxPrice = f.priceMax;
    // Beds/Baths
    if (f.bedsMin) body.minBeds = f.bedsMin;
    if (f.bedsMax) body.maxBeds = f.bedsMax;
    if (f.bathsMin) body.minBaths = f.bathsMin;
    if (f.bathsMax) body.maxBaths = f.bathsMax;
    // Sqft
    if (f.sqftMin) body.minSqft = f.sqftMin;
    if (f.sqftMax) body.maxSqft = f.sqftMax;
    // Location
    if (f.neighborhood) body.neighborhood = f.neighborhood;
    if (f.community) body.area = f.community;  // TRREB community → Repliers area param
    if (f.area) body.area = f.area;
    if (f.municipality) body.municipality = f.municipality;
    if (f.streetName) body.streetName = f.streetName;
    if (f.streetNumberMin) body.minStreetNumber = f.streetNumberMin;
    if (f.streetNumberMax) body.maxStreetNumber = f.streetNumberMax;
    if (f.streetDirection) body.streetDirection = f.streetDirection;
    if (f.unitNumber) body.unitNumber = f.unitNumber;
    // Property
    if (f.mlsNumber) body.mlsNumber = f.mlsNumber;
    if (f.propertyType?.length) body.propertyType = f.propertyType.join(',');
    if (f.style?.length) body.style = f.style.join(',');
    if (f.class) body.class = f.class;
    // Status/Dates — don't override lastStatus if sold tab already sets it
    if (f.lastStatus?.length && f.tab !== 'sold') body.lastStatus = f.lastStatus.join(',');
    // DOM filter only works with status=U (sold) in Repliers API
    if (f.tab === 'sold') {
      if (f.domMin) body.minDaysOnMarket = f.domMin;
      if (f.domMax) body.maxDaysOnMarket = f.domMax;
    }
    if (f.updatedOnMin) body.minUpdatedOn = f.updatedOnMin;
    if (f.updatedOnMax) body.maxUpdatedOn = f.updatedOnMax;
    if (f.listDateMin) body.minListDate = f.listDateMin;
    if (f.listDateMax) body.maxListDate = f.listDateMax;
    // Sold
    if (f.soldDateMin) body.minSoldDate = f.soldDateMin;
    if (f.soldDateMax) body.maxSoldDate = f.soldDateMax;
    if (f.soldPriceMin) body.minSoldPrice = f.soldPriceMin;
    if (f.soldPriceMax) body.maxSoldPrice = f.soldPriceMax;
    // Financials
    if (f.maintenanceFeeMax) body.maxMaintenanceFee = f.maintenanceFeeMax;
    if (f.taxMin) body.minTaxes = f.taxMin;
    if (f.taxMax) body.maxTaxes = f.taxMax;
    if (f.priceChangeType) body.lastPriceChangeType = f.priceChangeType;
    // Size extended
    if (f.bedsPlus) body.minBedroomsPlus = f.bedsPlus;
    if (f.halfBathMin) body.minBathroomsHalf = f.halfBathMin;
    if (f.lotSizeMin) body.minLotSizeSqft = f.lotSizeMin;
    if (f.lotSizeMax) body.maxLotSizeSqft = f.lotSizeMax;
    if (f.storiesMin) body.minStories = f.storiesMin;
    if (f.storiesMax) body.maxStories = f.storiesMax;
    if (f.yearBuiltMin) body.minYearBuilt = f.yearBuiltMin;
    if (f.yearBuiltMax) body.maxYearBuilt = f.yearBuiltMax;
    // Parking
    if (f.parkingMin) body.minParkingSpaces = f.parkingMin;
    if (f.garageMin) body.minGarageSpaces = f.garageMin;
    if (f.garageType?.length) body.garage = f.garageType.join(',');
    if (f.locker) body.locker = f.locker;
    // Features
    if (f.basement?.length) body.basement = f.basement.join(',');
    if (f.heating?.length) body.heating = f.heating.join(',');
    if (f.pool?.length) body.swimmingPool = f.pool.join(',');
    if (f.waterfront) body.waterfront = f.waterfront;
    if (f.den) body.den = f.den;
    // Open house
    if (f.openHouse) body.minOpenHouseDate = f.openHouseDateMin || new Date().toISOString().split('T')[0];
    if (f.openHouseDateMax) body.maxOpenHouseDate = f.openHouseDateMax;
    // Display
    if (f.hasImages) body.hasImages = true;
    if (f.hasAgents) body.hasAgents = true;
    // Map bounds
    if (f.bounds) {
      body.map = JSON.stringify({
        type: 'Polygon',
        coordinates: [[
          [f.bounds.sw.lng, f.bounds.ne.lat], [f.bounds.ne.lng, f.bounds.ne.lat],
          [f.bounds.ne.lng, f.bounds.sw.lat], [f.bounds.sw.lng, f.bounds.sw.lat],
          [f.bounds.sw.lng, f.bounds.ne.lat],
        ]],
      });
    }

    return body;
  }

  // MLS# direct lookup
  const handleMlsLookup = useCallback(async (mls: string) => {
    setLoading(true);
    console.log(`[CondoWizard] MLS# direct lookup: ${mls}`);
    try {
      const res = await fetch(`/api/repliers/listings/${mls}`);
      if (res.ok) {
        const data = await res.json();
        if (data.listing) {
          setListings([data.listing]);
          setTotalCount(1);
          setStatistics({});
          console.log(`[CondoWizard] MLS# ${mls} found:`, data.listing.address, data.listing.priceDisplay);
        } else {
          setListings([]);
          setTotalCount(0);
        }
      } else {
        console.error(`[CondoWizard] MLS# ${mls} not found (${res.status})`);
        setListings([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('[CondoWizard] MLS lookup error:', err);
      setListings([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      if (filters.tab === 'precon') {
        const params = new URLSearchParams();
        if (filters.priceMin) params.set('priceMin', String(filters.priceMin));
        if (filters.priceMax) params.set('priceMax', String(filters.priceMax));
        if (filters.bedsMin) params.set('bedsMin', String(filters.bedsMin));
        if (filters.neighborhood) params.set('neighborhood', filters.neighborhood);
        if (filters.developer) params.set('developer', filters.developer);
        if (filters.occupancyYear) params.set('occupancyYear', String(filters.occupancyYear));
        params.set('page', String(filters.page || 1));
        params.set('pageSize', String(filters.pageSize || 24));
        const res = await fetch('/api/precon?' + params.toString());
        if (res.ok) { const data = await res.json(); setListings(data.listings || []); setTotalCount(data.total || 0); }
      } else {
        const body = buildRequestBody(filters);

        // DEBUG: Log the full request to console
        console.log('[CondoWizard] Fetching listings with filters:', JSON.stringify(body, null, 2));

        const res = await fetch('/api/repliers/listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          const data = await res.json();
          console.log(`[CondoWizard] Got ${data.total} listings, stats:`, data.statistics);
          setListings(data.listings || []);
          setTotalCount(data.total || 0);
          if (data.statistics) setStatistics(data.statistics);
        } else {
          console.error('[CondoWizard] API error:', res.status, await res.text());
        }
      }
    } catch (error) {
      console.error('[CondoWizard] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  // Update URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.tab !== 'sale') params.set('tab', filters.tab);
    if (filters.sortBy && filters.sortBy !== 'newest') params.set('sortBy', filters.sortBy);
    if (filters.priceMin) params.set('priceMin', String(filters.priceMin));
    if (filters.priceMax) params.set('priceMax', String(filters.priceMax));
    if (filters.bedsMin) params.set('beds', String(filters.bedsMin));
    if (filters.neighborhood) params.set('neighborhood', filters.neighborhood);
    if (filters.community) params.set('community', filters.community);
    if (filters.class) params.set('class', filters.class);
    const qs = params.toString();
    router.replace(`/search${qs ? '?' + qs : ''}`, { scroll: false });
  }, [filters, router]);

  const handleFilterChange = (partial: Partial<ListingFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleBoundsChange = useCallback((bounds: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } }) => {
    setFilters((prev) => ({ ...prev, bounds }));
  }, []);

  return (
    <div className="h-screen flex flex-col pt-14">
      <SearchFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onMlsLookup={handleMlsLookup}
        totalCount={totalCount}
        avgPrice={statistics.averagePrice}
        avgDom={statistics.averageDom}
        medianSoldPrice={statistics.medianSoldPrice}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-full lg:w-[55%] overflow-y-auto bg-bg">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-border animate-pulse">
                  <div className="aspect-[4/3] bg-surface2 rounded-t-xl" />
                  <div className="p-3 space-y-2"><div className="h-5 bg-surface2 rounded w-24" /><div className="h-4 bg-surface2 rounded w-40" /><div className="h-3 bg-surface2 rounded w-32" /></div>
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
                <ListingCard key={listing.id} listing={listing} onHover={setHighlightedId} isHighlighted={listing.id === highlightedId} isSoldView={filters.tab === 'sold'} />
              ))}
            </div>
          )}

          {listings.length > 0 && listings.length < totalCount && (
            <div className="p-4 text-center">
              <button onClick={() => handleFilterChange({ page: (filters.page || 1) + 1 })} className="px-6 py-2.5 bg-accent-blue text-white rounded-lg text-sm font-medium hover:bg-accent-blue/90 transition-colors">
                Load more ({totalCount - listings.length} remaining)
              </button>
            </div>
          )}

          <div className="p-4 text-[10px] text-text-muted border-t border-border">
            <p>Tal Shelef, Sales Representative | Rare Real Estate Inc., Brokerage | 1701 Avenue Rd, Toronto, ON M5M 3Y3 | 647-890-4082</p>
            <p className="mt-1">Data provided by the Toronto Regional Real Estate Board (TRREB). All information is deemed reliable but not guaranteed.</p>
          </div>
        </div>

        <div className="hidden lg:block lg:w-[45%] relative">
          <SearchMap listings={listings} highlightedId={highlightedId} onMarkerHover={setHighlightedId} onBoundsChange={handleBoundsChange} isSoldView={filters.tab === 'sold'} />
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
