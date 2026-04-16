'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

interface Building {
  slug: string;
  address: string;
  buildingName?: string;
  neighbourhood: string;
  lat: number;
  lng: number;
}

interface Props {
  buildings: Building[];
  neighbourhoods: string[];
}

type SortKey = 'alpha' | 'neighbourhood';

export default function CondosClient({ buildings, neighbourhoods }: Props) {
  const [q, setQ] = useState('');
  const [neighbourhood, setNeighbourhood] = useState<string>('');
  const [sort, setSort] = useState<SortKey>('alpha');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = buildings.filter((b) => {
      if (neighbourhood && b.neighbourhood !== neighbourhood) return false;
      if (!needle) return true;
      return (
        b.address.toLowerCase().includes(needle) ||
        (b.buildingName || '').toLowerCase().includes(needle) ||
        b.neighbourhood.toLowerCase().includes(needle)
      );
    });
    if (sort === 'alpha') {
      out = out.slice().sort((a, b) => (a.buildingName || a.address).localeCompare(b.buildingName || b.address));
    } else {
      out = out.slice().sort((a, b) => a.neighbourhood.localeCompare(b.neighbourhood) || a.address.localeCompare(b.address));
    }
    return out;
  }, [buildings, q, neighbourhood, sort]);

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
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by building name, address or neighbourhood..."
            className="w-full bg-white border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent-blue"
          />
        </div>
        <select
          value={neighbourhood}
          onChange={(e) => setNeighbourhood(e.target.value)}
          className="bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent-blue min-w-[200px]"
        >
          <option value="">All neighbourhoods</option>
          {neighbourhoods.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="bg-white border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent-blue min-w-[180px]"
        >
          <option value="alpha">Sort: Alphabetical</option>
          <option value="neighbourhood">Sort: By Neighbourhood</option>
        </select>
      </div>

      <p className="text-sm text-text-muted mb-4">
        Showing {filtered.length} of {buildings.length} buildings
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <p className="text-text-muted">No buildings match your search. Try a different term or clear filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((b) => (
            <Link
              key={b.slug}
              href={`/building/${b.slug}`}
              className="group bg-white rounded-xl border border-border overflow-hidden hover:border-accent-blue/40 hover:shadow-md transition-all"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-accent-blue/10 via-surface2 to-accent-blue/5 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-16 h-16 text-accent-blue/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 text-xs font-medium text-accent-blue backdrop-blur">
                  {b.neighbourhood}
                </div>
              </div>
              <div className="p-4">
                <p className="font-serif text-lg font-bold text-text-primary group-hover:text-accent-blue transition-colors">
                  {b.buildingName || b.address}
                </p>
                {b.buildingName && (
                  <p className="text-sm text-text-muted mt-0.5">{b.address}</p>
                )}
                <p className="text-xs text-text-muted mt-2">View active listings, maintenance fees and amenities →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
