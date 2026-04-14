'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  type: 'mls' | 'neighbourhood' | 'location' | 'precon';
  title: string;
  subtitle?: string;
  href: string;
  image?: string;
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export default function NavSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const all: SearchResult[] = [];
      const q = value.trim();
      const isMLS = /^[CWENX]\d{5,}$/i.test(q);

      try {
        // 1. MLS# lookup
        if (isMLS) {
          const res = await fetch(`/api/repliers/listings/${q.toUpperCase()}`);
          if (res.ok) {
            const data = await res.json();
            if (data.listing) {
              const l = data.listing;
              all.push({
                type: 'mls', title: `$${l.price?.toLocaleString()} — ${l.address}`,
                subtitle: `MLS# ${l.mlsNumber} · ${l.beds}bd · ${l.baths}ba`,
                href: `/listing/${l.mlsNumber}`, image: l.images?.[0],
              });
            }
          }
        }

        // 2. Locations autocomplete (addresses/areas)
        if (!isMLS && q.length >= 3) {
          const res = await fetch(`/api/repliers/locations?q=${encodeURIComponent(q)}`);
          if (res.ok) {
            const data = await res.json();
            for (const loc of (data.locations || data.suggestions || []).slice(0, 5)) {
              const name = loc.name || loc.address || '';
              const type = loc.type || '';
              if (type === 'neighborhood' || type === 'neighbourhood') {
                all.push({ type: 'neighbourhood', title: name, subtitle: 'Neighbourhood', href: `/neighbourhood/${slugify(name)}` });
              } else {
                all.push({ type: 'location', title: name, subtitle: type || 'Location', href: `/search?neighborhood=${encodeURIComponent(name)}` });
              }
            }
          }
        }

        // 3. Neighbourhood name matching (client-side from known list)
        if (!isMLS) {
          try {
            const commRes = await fetch('/api/repliers/communities');
            if (commRes.ok) {
              const commData = await commRes.json();
              const matched = (commData.locations || [])
                .filter((c: any) => c.name.toLowerCase().includes(q.toLowerCase()))
                .slice(0, 5);
              for (const c of matched) {
                // Avoid duplicates from locations autocomplete
                if (!all.some(r => r.title === c.name)) {
                  all.push({ type: 'neighbourhood', title: c.name, subtitle: c.city || 'Toronto', href: `/neighbourhood/${slugify(c.name)}` });
                }
              }
            }
          } catch {}
        }
      } catch (e) {
        console.error('NavSearch error:', e);
      }

      setResults(all.slice(0, 10));
      setIsOpen(all.length > 0 || q.length >= 2);
      setLoading(false);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      setIsOpen(false);
      router.push(`/search?neighborhood=${encodeURIComponent(query.trim())}`);
    }
    if (e.key === 'Escape') setIsOpen(false);
  };

  const icons: Record<string, string> = { mls: 'M', neighbourhood: 'N', location: 'A', precon: 'P' };
  const iconColors: Record<string, string> = { mls: 'bg-accent-blue text-white', neighbourhood: 'bg-green-100 text-green-700', location: 'bg-gray-100 text-gray-600', precon: 'bg-yellow-100 text-yellow-700' };

  return (
    <div ref={containerRef} className="relative hidden md:block flex-1 max-w-md mx-4">
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search MLS#, address, or neighbourhood..."
        className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm border-none focus:outline-none focus:ring-2 focus:ring-accent-blue focus:bg-white transition-colors"
      />
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[400px] overflow-y-auto z-50">
          {loading && results.length === 0 && (
            <div className="p-4 text-center text-gray-400 text-sm">Searching...</div>
          )}

          {results.length > 0 && (
            <div className="p-1.5">
              {results.map((r, i) => (
                <a
                  key={i}
                  href={r.href}
                  onClick={() => { setIsOpen(false); setQuery(''); }}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {r.image ? (
                    <img src={r.image} alt="" className="w-10 h-10 object-cover rounded flex-shrink-0" />
                  ) : (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${iconColors[r.type] || 'bg-gray-100 text-gray-600'}`}>
                      {icons[r.type] || '?'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                    {r.subtitle && <p className="text-xs text-gray-500 truncate">{r.subtitle}</p>}
                  </div>
                </a>
              ))}
            </div>
          )}

          {!loading && results.length === 0 && query.length >= 2 && (
            <div className="p-4 text-center text-gray-400 text-sm">No results for &ldquo;{query}&rdquo;</div>
          )}
        </div>
      )}
    </div>
  );
}
