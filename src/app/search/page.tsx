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
      // Default sold to 90 days
      soldDateRange: tab === 'sold' ? '90' : undefined,
      soldDateMin: tab === 'sold' ? (() => { const d = new Date(); d.setDate(d.getDate() - 90); return d.toISOString().split('T')[0]; })() : undefined,
      page: 1,
      pageSize: 24,
    };
  });

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
        if (res.ok) {
          const data = await res.json();
          setListings(data.listings || []);
          setTotalCount(data.total || 0);
        }
      } else {
        // Build Repliers request body from all filters
        const body: Record<string, unknown> = {
          city: 'Toronto',
          resultsPerPage: filters.pageSize || 24,
          pageNum: filters.page || 1,
          statistics: true,
        };

        // Tab → status/type
        if (filters.tab === 'sale') {
          body.status = 'A';
          body.type = 'sale';
        } else if (filters.tab === 'sold') {
          body.status = 'U';
          body.lastStatus = 'Sld';
        } else if (filters.tab === 'rent') {
          body.status = 'A';
          body.type = 'lease';
        }

        // Sort
        switch (filters.sortBy) {
          case 'newest': body.sortBy = filters.tab === 'sold' ? 'soldDateDesc' : 'updatedOnDesc'; break;
          case 'price_asc': body.sortBy = filters.tab === 'sold' ? 'soldPriceAsc' : 'listPriceAsc'; break;
          case 'price_desc': body.sortBy = filters.tab === 'sold' ? 'soldPriceDesc' : 'listPriceDesc'; break;
          case 'largest': body.sortBy = 'sqftDesc'; break;
          default: body.sortBy = 'updatedOnDesc';
        }

        // Price
        if (filters.priceMin) body.minPrice = filters.priceMin;
        if (filters.priceMax) body.maxPrice = filters.priceMax;
        // Beds/Baths
        if (filters.bedsMin) body.minBeds = filters.bedsMin;
        if (filters.bedsMax) body.maxBeds = filters.bedsMax;
        if (filters.bathsMin) body.minBaths = filters.bathsMin;
        if (filters.bathsMax) body.maxBaths = filters.bathsMax;
        // Sqft
        if (filters.sqftMin) body.minSqft = filters.sqftMin;
        if (filters.sqftMax) body.maxSqft = filters.sqftMax;
        // Location
        if (filters.neighborhood) body.neighborhood = filters.neighborhood;
        if (filters.community) body.area = filters.community;
        if (filters.area) body.area = filters.area;
        if (filters.municipality) body.municipality = filters.municipality;
        if (filters.streetName) body.streetName = filters.streetName;
        if (filters.streetNumberMin) body.minStreetNumber = filters.streetNumberMin;
        if (filters.streetNumberMax) body.maxStreetNumber = filters.streetNumberMax;
        if (filters.streetDirection) body.streetDirection = filters.streetDirection;
        if (filters.unitNumber) body.unitNumber = filters.unitNumber;
        // Property
        if (filters.mlsNumber) body.mlsNumber = filters.mlsNumber;
        if (filters.propertyType?.length) body.propertyType = filters.propertyType.join(',');
        if (filters.style?.length) body.style = filters.style.join(',');
        if (filters.class) body.class = filters.class;
        // Status/Dates
        if (filters.lastStatus?.length && filters.tab !== 'sold') body.lastStatus = filters.lastStatus.join(',');
        if (filters.domMin) body.minDaysOnMarket = filters.domMin;
        if (filters.domMax) body.maxDaysOnMarket = filters.domMax;
        if (filters.updatedOnMin) body.minUpdatedOn = filters.updatedOnMin;
        if (filters.updatedOnMax) body.maxUpdatedOn = filters.updatedOnMax;
        if (filters.listDateMin) body.minListDate = filters.listDateMin;
        if (filters.listDateMax) body.maxListDate = filters.listDateMax;
        // Sold
        if (filters.soldDateMin) body.minSoldDate = filters.soldDateMin;
        if (filters.soldDateMax) body.maxSoldDate = filters.soldDateMax;
        if (filters.soldPriceMin) body.minSoldPrice = filters.soldPriceMin;
        if (filters.soldPriceMax) body.maxSoldPrice = filters.soldPriceMax;
        // Financials
        if (filters.maintenanceFeeMax) body.maxMaintenanceFee = filters.maintenanceFeeMax;
        if (filters.taxMin) body.minTaxes = filters.taxMin;
        if (filters.taxMax) body.maxTaxes = filters.taxMax;
        if (filters.priceChangeType) body.lastPriceChangeType = filters.priceChangeType;
        // Size extended
        if (filters.bedsPlus) body.minBedroomsPlus = filters.bedsPlus;
        if (filters.halfBathMin) body.minBathroomsHalf = filters.halfBathMin;
        if (filters.lotSizeMin) body.minLotSizeSqft = filters.lotSizeMin;
        if (filters.lotSizeMax) body.maxLotSizeSqft = filters.lotSizeMax;
        if (filters.storiesMin) body.minStories = filters.storiesMin;
        if (filters.storiesMax) body.maxStories = filters.storiesMax;
        if (filters.yearBuiltMin) body.minYearBuilt = filters.yearBuiltMin;
        if (filters.yearBuiltMax) body.maxYearBuilt = filters.yearBuiltMax;
        // Parking
        if (filters.parkingMin) body.minParkingSpaces = filters.parkingMin;
        if (filters.garageMin) body.minGarageSpaces = filters.garageMin;
        if (filters.garageType?.length) body.garage = filters.garageType.join(',');
        if (filters.locker) body.locker = filters.locker;
        // Features
        if (filters.basement?.length) body.basement = filters.basement.join(',');
        if (filters.heating?.length) body.heating = filters.heating.join(',');
        if (filters.pool?.length) body.swimmingPool = filters.pool.join(',');
        if (filters.waterfront) body.waterfront = filters.waterfront;
        if (filters.den) body.den = filters.den;
        // Open house
        if (filters.openHouse) {
          body.minOpenHouseDate = filters.openHouseDateMin || new Date().toISOString().split('T')[0];
        }
        if (filters.openHouseDateMax) body.maxOpenHouseDate = filters.openHouseDateMax;
        // Display
        if (filters.hasImages) body.hasImages = true;
        if (filters.hasAgents) body.hasAgents = true;
        // Map bounds
        if (filters.bounds) {
          body.map = JSON.stringify({
            type: 'Polygon',
            coordinates: [[
              [filters.bounds.sw.lng, filters.bounds.ne.lat],
              [filters.bounds.ne.lng, filters.bounds.ne.lat],
              [filters.bounds.ne.lng, filters.bounds.sw.lat],
              [filters.bounds.sw.lng, filters.bounds.sw.lat],
              [filters.bounds.sw.lng, filters.bounds.ne.lat],
            ]],
          });
        }

        const res = await fetch('/api/repliers/listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          const data = await res.json();
          setListings(data.listings || []);
          setTotalCount(data.total || 0);
          if (data.statistics) setStatistics(data.statistics);
        }
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
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
        totalCount={totalCount}
        avgPrice={statistics.averagePrice}
        avgDom={statistics.averageDom}
        medianSoldPrice={statistics.medianSoldPrice}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: cards */}
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

        {/* Right: map */}
        <div className="hidden lg:block lg:w-[45%] relative">
          <SearchMap
            listings={listings}
            highlightedId={highlightedId}
            onMarkerHover={setHighlightedId}
            onBoundsChange={handleBoundsChange}
            isSoldView={filters.tab === 'sold'}
          />
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
