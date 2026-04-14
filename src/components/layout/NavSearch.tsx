'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ListingResult {
  mlsNumber: string;
  price: number;
  address: string;
  unitNumber: string;
  city: string;
  beds: number;
  baths: number;
  sqft: string;
  propertyType: string;
  dom: number;
  image: string | null;
  isRental: boolean;
}

interface HoodResult {
  name: string;
  slug: string;
}

function slugify(n: string) { return n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''); }


export default function NavSearch() {
  const [query, setQuery] = useState('');
  const [listings, setListings] = useState<ListingResult[]>([]);
  const [hoods, setHoods] = useState<HoodResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) { setListings([]); setHoods([]); setIsOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const q = value.trim();
      const isMLS = /^[CWENX]\d{4,}/i.test(q);

      try {
        // --- LISTINGS SEARCH ---
        let foundListings: ListingResult[] = [];

        if (isMLS) {
          // Direct MLS# lookup
          const res = await fetch(`/api/repliers/listings/${q.toUpperCase()}`);
          if (res.ok) {
            const d = await res.json();
            if (d.listing) {
              const l = d.listing;
              foundListings = [{
                mlsNumber: l.mlsNumber, price: l.price, address: l.address,
                unitNumber: '', city: l.city || 'Toronto', beds: l.beds, baths: l.baths,
                sqft: l.sqft, propertyType: l.propertyType, dom: l.dom,
                image: l.images?.[0] || null, isRental: false,
              }];
            }
          }
        } else if (q.length >= 3) {
          // Fuzzy address search using Repliers 'search' param
          // Handles partial names: "30 roe" → finds "30 Roehampton"
          const res = await fetch('/api/repliers/listings', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ search: q, status: 'A', resultsPerPage: 8, sortBy: 'listPriceDesc' }),
          });
          if (res.ok) {
            const d = await res.json();
            foundListings = (d.listings || []).map((l: any) => ({
              mlsNumber: l.mlsNumber || l.id, price: l.price,
              address: l.address, unitNumber: '',
              city: l.city || 'Toronto', beds: l.beds, baths: l.baths,
              sqft: l.sqft, propertyType: l.propertyType, dom: l.dom || 0,
              image: l.images?.[0] || null, isRental: false,
            }));
          }
        }

        // --- NEIGHBOURHOOD SEARCH (show for text queries, not number-prefixed addresses) ---
        let foundHoods: HoodResult[] = [];
        if (!isMLS && !/^\d/.test(q)) {
          try {
            const res = await fetch('/api/repliers/communities');
            if (res.ok) {
              const d = await res.json();
              foundHoods = (d.locations || [])
                .filter((c: any) => c.name.toLowerCase().includes(q.toLowerCase()))
                .slice(0, 4)
                .map((c: any) => ({ name: c.name, slug: slugify(c.name) }));
            }
          } catch {}
        }

        setListings(foundListings);
        setHoods(foundHoods);
        setIsOpen(foundListings.length > 0 || foundHoods.length > 0 || q.length >= 2);
      } catch (e) {
        console.error('NavSearch error:', e);
      }
      setLoading(false);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      setIsOpen(false);
      // If there's a top listing result, navigate to it
      if (listings.length > 0) {
        router.push(`/listing/${listings[0].mlsNumber}`);
      } else {
        router.push(`/search?neighborhood=${encodeURIComponent(query.trim())}`);
      }
    }
    if (e.key === 'Escape') setIsOpen(false);
  };

  const fmtPrice = (p: number, rental: boolean) => {
    if (!p) return '';
    const str = p >= 1000000 ? `$${(p / 1000000).toFixed(1)}M` : `$${Math.round(p / 1000)}K`;
    return rental ? str + '/mo' : str;
  };

  const hasResults = listings.length > 0 || hoods.length > 0;

  return (
    <div ref={containerRef} className="relative hidden md:block flex-1 max-w-lg mx-4">
      <input
        type="text" value={query} onChange={(e) => handleChange(e.target.value)}
        onFocus={() => query.length >= 2 && hasResults && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search address, MLS#, or neighbourhood..."
        className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm border-none focus:outline-none focus:ring-2 focus:ring-accent-blue focus:bg-white transition-colors"
      />
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[500px] overflow-y-auto z-50 w-full min-w-[480px]">
          {loading && !hasResults && <div className="p-4 text-center text-gray-400 text-sm">Searching...</div>}

          {/* Listings section */}
          {listings.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1">
                Listings · {listings.length}
              </p>
              {listings.map((l) => (
                <a key={l.mlsNumber} href={`/listing/${l.mlsNumber}`}
                  onClick={() => { setIsOpen(false); setQuery(''); }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors">
                  {l.image ? (
                    <img src={l.image} alt="" className="w-16 h-12 object-cover rounded flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-12 bg-gray-200 rounded flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{l.address}</p>
                    <p className="text-xs text-gray-500">
                      {l.beds > 0 && `${l.beds} Bed`}{l.baths > 0 && ` · ${l.baths} Bath`}{l.sqft && ` · ${l.sqft} sqft`}{l.propertyType && ` · ${l.propertyType}`}
                    </p>
                    <p className={`text-xs font-semibold mt-0.5 ${l.isRental ? 'text-accent-blue' : 'text-accent-green'}`}>
                      {fmtPrice(l.price, l.isRental)}{l.dom > 0 && ` · ${l.dom} DOM`}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-400 flex-shrink-0 font-mono">#{l.mlsNumber}</span>
                </a>
              ))}
              <a href={`/search?neighborhood=${encodeURIComponent(query)}`}
                onClick={() => { setIsOpen(false); setQuery(''); }}
                className="block px-4 py-2.5 text-sm text-accent-blue font-medium hover:bg-blue-50 border-t text-center">
                View all results for &ldquo;{query}&rdquo; &rarr;
              </a>
            </div>
          )}

          {/* Neighbourhoods section */}
          {hoods.length > 0 && (
            <div className={listings.length > 0 ? 'border-t' : ''}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 pt-3 pb-1">Neighbourhoods</p>
              {hoods.map((h) => (
                <a key={h.slug} href={`/neighbourhood/${h.slug}`}
                  onClick={() => { setIsOpen(false); setQuery(''); }}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-xs font-bold flex-shrink-0">N</div>
                  <span className="text-sm text-gray-900">{h.name}</span>
                </a>
              ))}
            </div>
          )}

          {!loading && !hasResults && query.length >= 2 && (
            <div className="p-4 text-center text-gray-400 text-sm">No results for &ldquo;{query}&rdquo;</div>
          )}
        </div>
      )}
    </div>
  );
}
