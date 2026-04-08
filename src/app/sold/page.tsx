'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ListingCard from '@/components/search/ListingCard';
import { UnifiedListing } from '@/types/listing';

const SearchMap = dynamic(() => import('@/components/search/SearchMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-900 animate-pulse" />,
});

function SoldContent() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<UnifiedListing[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(searchParams.get('range') || '90');
  const [neighborhood, setNeighborhood] = useState(searchParams.get('neighborhood') || '');
  const [page, setPage] = useState(1);

  const fetchSold = useCallback(async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        city: 'Toronto',
        status: 'U',
        lastStatus: 'Sld',
        resultsPerPage: 24,
        pageNum: page,
        sortBy: 'soldDateDesc',
        statistics: true,
      };

      if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        const since = new Date();
        since.setDate(since.getDate() - days);
        body.minSoldDate = since.toISOString().split('T')[0];
      }

      if (neighborhood) body.neighborhood = neighborhood;

      const res = await fetch('/api/repliers/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching sold data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, neighborhood, page]);

  useEffect(() => {
    fetchSold();
  }, [fetchSold]);

  const dateRangeOptions = [
    { label: '30 Days', value: '30' },
    { label: '60 Days', value: '60' },
    { label: '90 Days', value: '90' },
    { label: '6 Months', value: '180' },
    { label: '1 Year', value: '365' },
    { label: 'All Time', value: 'all' },
  ];

  return (
    <div className="h-screen flex flex-col pt-14">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-4">
        <h1 className="text-2xl font-bold text-text-primary">Sold Properties in Toronto</h1>
        <p className="text-sm text-text-muted mt-1">Recent sale prices and market data from TRREB MLS</p>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          {/* Date range pills */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            {dateRangeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setDateRange(opt.value); setPage(1); }}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  dateRange === opt.value
                    ? 'bg-accent-blue text-white'
                    : 'text-text-muted hover:bg-surface2'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Filter by neighborhood..."
            value={neighborhood}
            onChange={(e) => { setNeighborhood(e.target.value); setPage(1); }}
            className="px-3 py-1.5 text-sm border border-border rounded-lg w-48"
          />

          <span className="text-sm text-text-muted">{totalCount.toLocaleString()} sold properties</span>
        </div>
      </div>

      {/* Split view */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-full lg:w-[55%] overflow-y-auto bg-bg">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-border animate-pulse">
                  <div className="aspect-[4/3] bg-surface2 rounded-t-xl" />
                  <div className="p-3 space-y-2">
                    <div className="h-5 bg-surface2 rounded w-24" />
                    <div className="h-4 bg-surface2 rounded w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onHover={setHighlightedId}
                  isHighlighted={listing.id === highlightedId}
                />
              ))}
            </div>
          )}

          <div className="p-4 text-[10px] text-text-muted border-t border-border">
            <p>Tal Shelef, Sales Representative | Rare Real Estate Inc., Brokerage | 1701 Avenue Rd, Toronto, ON M5M 3Y3 | 647-890-4082</p>
            <p className="mt-1">Sold data provided by TRREB. All information is deemed reliable but not guaranteed.</p>
          </div>
        </div>

        <div className="hidden lg:block lg:w-[45%]">
          <SearchMap
            listings={listings}
            highlightedId={highlightedId}
            onMarkerHover={setHighlightedId}
          />
        </div>
      </div>
    </div>
  );
}

export default function SoldPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center pt-14">Loading...</div>}>
      <SoldContent />
    </Suspense>
  );
}
