'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { slugifyFullAddress } from '@/lib/building-address';

interface DiscoveredBuilding {
  slug: string;
  address: string;
  neighbourhood: string;
  city: string;
  stories: number | null;
  lat: number;
  lng: number;
  image: string | null;
  unitCount: number;
}

interface Props {
  neighbourhoods: string[];
}

function groupListingsIntoBuildings(listings: any[]): DiscoveredBuilding[] {
  const map = new Map<string, DiscoveredBuilding>();
  for (const l of listings) {
    const addr = (l.address || '').replace(/[,#].*$/, '').replace(/\bunit\s+\S+/gi, '').trim();
    const slug = slugifyFullAddress(l.address || '');
    if (!slug || !addr) continue;
    const existing = map.get(slug);
    if (existing) {
      existing.unitCount++;
      if (!existing.image && l.images?.[0]) {
        existing.image = l.images[0];
      }
    } else {
      map.set(slug, {
        slug,
        address: addr,
        neighbourhood: l.neighborhood || l.community || '',
        city: l.city || 'Toronto',
        stories: l.stories || null,
        lat: l.lat || 0,
        lng: l.lng || 0,
        image: l.images?.[0] || null,
        unitCount: 1,
      });
    }
  }
  return Array.from(map.values());
}

async function fetchBuildings(params: Record<string, unknown>): Promise<DiscoveredBuilding[]> {
  const res = await fetch('/api/repliers/listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      class: 'condo',
      status: 'A',
      ...params,
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return groupListingsIntoBuildings(data.listings || []);
}

export default function CondosClient({ neighbourhoods }: Props) {
  const [q, setQ] = useState('');
  const [neighbourhood, setNeighbourhood] = useState('');
  const [buildings, setBuildings] = useState<DiscoveredBuilding[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'popular' | 'search' | 'neighbourhood'>('popular');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load popular buildings on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      const results = await fetchBuildings({
        city: 'Toronto',
        resultsPerPage: 200,
        sortBy: 'updatedOnDesc',
      });
      results.sort((a, b) => b.unitCount - a.unitCount);
      setBuildings(results.slice(0, 20));
      setMode('popular');
      setLoading(false);
    })();
  }, []);

  // Search by address (debounced)
  const handleSearch = useCallback((value: string) => {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      // Reset to popular
      setNeighbourhood('');
      (async () => {
        setLoading(true);
        const results = await fetchBuildings({
          city: 'Toronto',
          resultsPerPage: 200,
          sortBy: 'updatedOnDesc',
        });
        results.sort((a, b) => b.unitCount - a.unitCount);
        setBuildings(results.slice(0, 20));
        setMode('popular');
        setLoading(false);
      })();
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setNeighbourhood('');
      const results = await fetchBuildings({
        search: value.trim(),
        resultsPerPage: 50,
      });
      results.sort((a, b) => b.unitCount - a.unitCount);
      setBuildings(results);
      setMode('search');
      setLoading(false);
    }, 400);
  }, []);

  // Filter by neighbourhood
  const handleNeighbourhood = useCallback(async (value: string) => {
    setNeighbourhood(value);
    setQ('');
    if (!value) {
      setLoading(true);
      const results = await fetchBuildings({
        city: 'Toronto',
        resultsPerPage: 200,
        sortBy: 'updatedOnDesc',
      });
      results.sort((a, b) => b.unitCount - a.unitCount);
      setBuildings(results.slice(0, 20));
      setMode('popular');
      setLoading(false);
      return;
    }
    setLoading(true);
    const results = await fetchBuildings({
      neighborhood: value,
      resultsPerPage: 100,
    });
    results.sort((a, b) => b.unitCount - a.unitCount);
    setBuildings(results);
    setMode('neighbourhood');
    setLoading(false);
  }, []);

  const heading =
    mode === 'search' ? `Search results for "${q}"` :
    mode === 'neighbourhood' ? `Buildings in ${neighbourhood}` :
    'Popular Buildings';

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={q}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by address (e.g. 300 Front, 955 Bay)..."
            className="w-full bg-white border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent-blue"
          />
        </div>
        <select
          value={neighbourhood}
          onChange={(e) => handleNeighbourhood(e.target.value)}
          className="bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent-blue min-w-[200px]"
        >
          <option value="">All neighbourhoods</option>
          {neighbourhoods.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-muted">
          {loading ? 'Loading...' : `${heading} — ${buildings.length} building${buildings.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && buildings.length === 0 && (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-text-muted/40 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-text-muted">No buildings found. Try a different search or neighbourhood.</p>
        </div>
      )}

      {/* Building grid */}
      {!loading && buildings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {buildings.map((b) => (
            <Link
              key={b.slug}
              href={`/building/${b.slug}`}
              className="group bg-white rounded-xl border border-border overflow-hidden hover:border-accent-blue/40 hover:shadow-md transition-all"
            >
              <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                {b.image ? (
                  <img
                    src={b.image}
                    alt={b.address}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-blue/10 via-surface2 to-accent-blue/5">
                    <svg className="w-16 h-16 text-accent-blue/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                )}
                {b.neighbourhood && (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 text-xs font-medium text-accent-blue backdrop-blur">
                    {b.neighbourhood}
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="font-serif text-lg font-bold text-text-primary group-hover:text-accent-blue transition-colors truncate">
                  {b.address}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-sm text-text-muted">
                  <span className="font-medium text-accent-blue">{b.unitCount} unit{b.unitCount === 1 ? '' : 's'} for sale</span>
                  {b.stories && <span>· {b.stories} storeys</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
