'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export interface PreconProject {
  id: string;
  slug: string;
  name: string;
  neighborhoodName: string | null;
  developerName: string | null;
  status: string | null;
  estCompletion: string | null;
  totalUnits: number | null;
  floors: number | null;
  priceMin: number | null;
  priceMax: number | null;
  mainImageUrl: string | null;
  category: string | null;
  featured: boolean;
}

const FILTERS = [
  { id: 'all', label: 'All featured' },
  { id: 'new', label: 'Newly launched' },
  { id: 'under', label: 'Under construction' },
  { id: 'occ2028', label: 'Occupancy 2028' },
  { id: 'occ2029', label: 'Occupancy 2029+' },
  { id: 'luxury', label: 'Luxury' },
];

function parseOccupancyYear(v: string | null | undefined): number | null {
  if (!v) return null;
  const m = String(v).match(/(20\d{2})/);
  return m ? Number(m[1]) : null;
}

function fmtPrice(min: number | null, max: number | null): string {
  if (!min && !max) return 'Pricing not released';
  if (min && max) {
    return `${short(min)} – ${short(max)}`;
  }
  return `From ${short(min || max || 0)}`;
}

function short(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 2)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

function statusLabel(s: string | null): string {
  if (!s) return 'Selling';
  return s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PreconFeatured({ projects }: { projects: PreconProject[] }) {
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (!projects?.length) return [];
    let list = [...projects];
    switch (filter) {
      case 'new':
        list = list.filter((p) => /PRE_LAUNCH|PRE_CONSTRUCTION/i.test(p.status || ''));
        break;
      case 'under':
        list = list.filter((p) => /UNDER_CONSTRUCTION|NEAR_COMPLETION/i.test(p.status || ''));
        break;
      case 'occ2028':
        list = list.filter((p) => parseOccupancyYear(p.estCompletion) === 2028);
        break;
      case 'occ2029':
        list = list.filter((p) => {
          const y = parseOccupancyYear(p.estCompletion);
          return y != null && y >= 2029;
        });
        break;
      case 'luxury':
        list = list.filter((p) => /LUXURY|ULTRA/i.test(p.category || ''));
        break;
    }
    return list.slice(0, 6);
  }, [projects, filter]);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
              filter === f.id
                ? 'bg-text-primary text-white border-text-primary'
                : 'bg-white text-text-primary/80 border-border hover:border-text-primary/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-xl p-8 text-center text-sm text-text-muted">
          No featured projects match this filter right now.{' '}
          <Link href="/new-condos" className="text-accent-blue font-medium">Browse all projects</Link>.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/properties/${p.slug}`}
              className="group block bg-white rounded-xl border border-border overflow-hidden hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all"
            >
              <div className="relative aspect-[4/3] bg-surface2 overflow-hidden">
                {p.mainImageUrl ? (
                  <img
                    src={p.mainImageUrl}
                    alt={`${p.name} rendering`}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-text-muted">Rendering coming soon</div>
                )}
                <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-sm text-text-primary text-[10px] font-semibold tracking-wider rounded px-2 py-0.5">
                  {statusLabel(p.status)}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-serif text-lg font-bold text-text-primary group-hover:text-accent-blue transition-colors truncate">
                    {p.name}
                  </h3>
                </div>
                <p className="text-xs text-text-muted mt-1 truncate">
                  {p.neighborhoodName || 'Toronto'}{p.developerName ? ` · ${p.developerName}` : ''}
                </p>
                <p className="text-sm font-medium text-text-primary mt-3">{fmtPrice(p.priceMin, p.priceMax)}</p>
                <div className="flex items-center gap-3 text-[11px] text-text-muted mt-2">
                  {p.estCompletion && <span>Occ. {p.estCompletion}</span>}
                  {p.floors ? <span>{p.floors} floors</span> : null}
                  {p.totalUnits ? <span>{p.totalUnits} units</span> : null}
                </div>
                <p className="mt-3 text-xs font-medium text-accent-blue group-hover:underline">View project →</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
