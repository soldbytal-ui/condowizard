'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { nearestPOIs, formatDistance, walkMinutes, driveMinutes } from '@/lib/toronto-pois';

const ListingMiniMap = dynamic(() => import('./ListingMiniMap'), { ssr: false });

interface Props {
  lat: number | null | undefined;
  lng: number | null | undefined;
  address: string;
  neighborhood: string;
  city: string;
  postalCode: string | null;
}

// Five quick amenity categories. Category set is intentionally fixed —
// per-category "Search on Google Maps near <address>" links are constructed
// dynamically from the listing's own address, so the destinations are
// listing-specific even though the categories are consistent.
const AMENITY_CATEGORIES: Array<{ key: string; label: string; query: string; icon: React.ReactNode }> = [
  {
    key: 'groceries',
    label: 'Groceries',
    query: 'grocery stores',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.35 2.7A1 1 0 006.5 17H19M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" /></svg>
    ),
  },
  {
    key: 'cafes',
    label: 'Cafés',
    query: 'coffee shops',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h14v6a4 4 0 01-4 4H7a4 4 0 01-4-4v-6zM17 10h2a3 3 0 010 6h-2M7 3v3M11 3v3" /></svg>
    ),
  },
  {
    key: 'schools',
    label: 'Schools',
    query: 'schools',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4L2 8l10 4 10-4-10-4zm0 8v6m-5-3l5 2 5-2" /></svg>
    ),
  },
  {
    key: 'parks',
    label: 'Parks',
    query: 'parks',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l4 6h-3v4h-2v-4H8l4-6zM4 21h16" /></svg>
    ),
  },
  {
    key: 'transit',
    label: 'Transit',
    query: 'transit stations',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 3h8a3 3 0 013 3v10a2 2 0 01-2 2h-1l1 2h-2l-1-2H8l-1 2H5l1-2H5a2 2 0 01-2-2V6a3 3 0 013-3zm-1 6h10m-8 6h.01M15 15h.01" /></svg>
    ),
  },
];

function mapsSearchUrl(address: string, category: string): string {
  const q = encodeURIComponent(`${category} near ${address}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export default function LocationSection({ lat, lng, address, neighborhood, city, postalCode }: Props) {
  const hasCoords = !!(lat && lng);
  const nearby = hasCoords ? nearestPOIs(lat!, lng!, { limit: 6, maxKm: 8 }) : [];

  return (
    <section id="location" className="mt-12 border-t border-border pt-10">
      <div className="flex items-end justify-between mb-5 gap-4 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-text-muted mb-1">Location</p>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-text-primary leading-tight">
            {address}
          </h2>
          <p className="text-sm text-text-muted mt-1">
            {[neighborhood, city, postalCode].filter(Boolean).join(' · ')}
          </p>
        </div>
        {hasCoords && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-accent-blue hover:underline"
          >
            Open in Google Maps →
          </a>
        )}
      </div>

      {/* Layout: large rounded light map on the left, location sidebar on the right */}
      <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-5">
        {/* Large rounded map */}
        <div className="relative rounded-2xl overflow-hidden border border-border bg-surface2 h-[420px] md:h-[480px]">
          {hasCoords ? (
            <ListingMiniMap lat={lat!} lng={lng!} zoom={15} variant="light" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-text-muted">
              Map unavailable — coordinates not published for this listing.
            </div>
          )}
        </div>

        {/* Location sidebar */}
        <aside className="bg-white border border-border rounded-2xl p-5 md:p-6 flex flex-col">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-text-muted">Address</p>
            <p className="font-semibold text-text-primary mt-1 leading-snug">{address}</p>
            <p className="text-sm text-text-muted mt-1">{[neighborhood, city].filter(Boolean).join(', ')}</p>
            {postalCode && <p className="text-xs text-text-muted mt-0.5 font-mono">{postalCode}</p>}
          </div>

          {neighborhood && (
            <Link
              href={`/search?neighborhood=${encodeURIComponent(neighborhood)}`}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent-blue hover:underline"
            >
              Explore {neighborhood} listings →
            </Link>
          )}

          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Nearby destinations</p>
            {nearby.length === 0 ? (
              <p className="text-xs text-text-muted">Distance information unavailable for this listing.</p>
            ) : (
              <ul className="space-y-2.5">
                {nearby.slice(0, 5).map((p) => (
                  <li key={p.name} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary truncate">{p.name}</p>
                      <p className="text-[11px] text-text-muted">
                        {p.distanceKm <= 1.6
                          ? `${walkMinutes(p.distanceKm)} min walk`
                          : `${driveMinutes(p.distanceKm)} min drive`}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-text-primary/70 shrink-0 pt-0.5">
                      {formatDistance(p.distanceKm)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[10px] text-text-muted mt-3 leading-relaxed">
              Distances are straight-line from this property to a static reference set of well-known Toronto landmarks and TTC subway stations. Times are estimates.
            </p>
          </div>
        </aside>
      </div>

      {/* Five quick amenity cards — dynamic search links per address */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {AMENITY_CATEGORIES.map((cat) => (
          <a
            key={cat.key}
            href={mapsSearchUrl(address, cat.query)}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white border border-border rounded-xl p-4 hover:border-text-primary/20 hover:-translate-y-0.5 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-text-primary/8 flex items-center justify-center text-text-primary">
              {cat.icon}
            </div>
            <p className="text-sm font-semibold text-text-primary mt-3">{cat.label}</p>
            <p className="text-[11px] text-text-muted mt-0.5 truncate">Find nearby →</p>
          </a>
        ))}
      </div>
    </section>
  );
}
