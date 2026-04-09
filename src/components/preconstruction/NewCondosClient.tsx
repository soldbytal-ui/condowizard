'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { formatPrice } from '@/lib/utils';

const PreconMap = dynamic(() => import('./PreconMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-900 animate-pulse" />,
});

interface Project {
  id: string;
  name: string;
  slug: string;
  status: string;
  category: string;
  priceMin: number | null;
  priceMax: number | null;
  totalUnits: number | null;
  floors: number | null;
  estCompletion: string | null;
  latitude: number | null;
  longitude: number | null;
  mainImageUrl: string | null;
  images: string[] | null;
  featured: boolean;
  neighborhood: { name: string; slug: string } | null;
  developer: { name: string } | null;
}

interface Props {
  projects: Project[];
  neighborhoods: { id: string; name: string; slug: string }[];
}

const STATUS_OPTIONS = ['All', 'PRE_LAUNCH', 'PRE_CONSTRUCTION', 'UNDER_CONSTRUCTION', 'NEAR_COMPLETION', 'COMPLETED'];
const STATUS_LABELS: Record<string, string> = {
  All: 'All Status',
  PRE_LAUNCH: 'Pre-Launch',
  PRE_CONSTRUCTION: 'Pre-Construction',
  UNDER_CONSTRUCTION: 'Under Construction',
  NEAR_COMPLETION: 'Near Completion',
  COMPLETED: 'Completed',
};

export default function NewCondosClient({ projects, neighborhoods }: Props) {
  const [search, setSearch] = useState('');
  const [hood, setHood] = useState('');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('newest');
  const [highlightedSlug, setHighlightedSlug] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...projects];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.developer?.name?.toLowerCase().includes(q));
    }
    if (hood) list = list.filter((p) => p.neighborhood?.slug === hood);
    if (status !== 'All') list = list.filter((p) => p.status === status);

    if (sort === 'price_asc') list.sort((a, b) => (a.priceMin || 0) - (b.priceMin || 0));
    else if (sort === 'price_desc') list.sort((a, b) => (b.priceMin || 0) - (a.priceMin || 0));
    else if (sort === 'occupancy') list.sort((a, b) => (a.estCompletion || 'Z').localeCompare(b.estCompletion || 'Z'));

    return list;
  }, [projects, search, hood, status, sort]);

  const mapProjects = useMemo(() =>
    filtered.filter((p) => p.latitude && p.longitude).map((p) => ({
      slug: p.slug,
      name: p.name,
      lat: p.latitude!,
      lng: p.longitude!,
      floors: p.floors || 1,
      price: p.priceMin,
      image: p.mainImageUrl || p.images?.[0] || null,
      developer: p.developer?.name || null,
    }))
  , [filtered]);

  return (
    <div className="h-screen flex flex-col pt-14">
      {/* Filter bar */}
      <div className="bg-white border-b border-border px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold text-text-primary">New Condos in Toronto</h1>
            <p className="text-xs text-text-muted">{filtered.length} pre-construction projects</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="text" placeholder="Search projects or developers..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 text-sm border border-border rounded-lg w-56" />
          <select value={hood} onChange={(e) => setHood(e.target.value)} className="px-3 py-1.5 text-sm border border-border rounded-lg text-text-muted">
            <option value="">All Neighbourhoods</option>
            {neighborhoods.map((n) => <option key={n.slug} value={n.slug}>{n.name}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-1.5 text-sm border border-border rounded-lg text-text-muted">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3 py-1.5 text-sm border border-border rounded-lg text-text-muted">
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="occupancy">Occupancy Date</option>
          </select>
        </div>
      </div>

      {/* Split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: project cards */}
        <div className="w-full lg:w-[55%] overflow-y-auto bg-bg p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-bt-precon/20 rounded-full flex items-center justify-center mb-4"><span className="text-2xl">🏗</span></div>
              <h3 className="text-lg font-semibold text-text-primary">No projects found</h3>
              <p className="text-sm text-text-muted mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((p) => (
                <Link
                  key={p.id}
                  href={`/properties/${p.slug}`}
                  className={`group bg-white rounded-xl border overflow-hidden hover:shadow-md transition-all ${highlightedSlug === p.slug ? 'border-accent-blue ring-2 ring-accent-blue/20' : 'border-border'}`}
                  onMouseEnter={() => setHighlightedSlug(p.slug)}
                  onMouseLeave={() => setHighlightedSlug(null)}
                >
                  <div className="relative aspect-[4/3] bg-surface2 overflow-hidden">
                    {(p.mainImageUrl || p.images?.[0]) ? (
                      <img src={p.mainImageUrl || p.images![0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted text-sm">No Image</div>
                    )}
                    <div className="absolute top-2 left-2 bg-bt-precon text-black text-[10px] font-bold rounded px-2 py-0.5">
                      {STATUS_LABELS[p.status] || p.status}
                    </div>
                    {p.featured && (
                      <div className="absolute top-2 right-2 bg-accent-blue text-white text-[10px] font-bold rounded px-2 py-0.5">FEATURED</div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-text-primary text-sm group-hover:text-accent-blue transition-colors leading-tight">{p.name}</h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {p.neighborhood?.name || 'Toronto'}{p.developer?.name ? ` · ${p.developer.name}` : ''}
                    </p>
                    <p className="font-serif text-base font-bold text-text-primary mt-1.5">
                      {p.priceMin ? `From ${formatPrice(p.priceMin)}` : 'Contact for pricing'}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-text-muted mt-1">
                      {p.totalUnits && <span>{p.totalUnits} units</span>}
                      {p.floors && <span>{p.floors} floors</span>}
                      {p.estCompletion && <span>Est. {p.estCompletion}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: 3D map */}
        <div className="hidden lg:block lg:w-[45%]">
          <PreconMap projects={mapProjects} highlightedSlug={highlightedSlug} />
        </div>
      </div>
    </div>
  );
}
