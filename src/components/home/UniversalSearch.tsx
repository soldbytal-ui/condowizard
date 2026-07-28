'use client';

import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { torontoTodayISO } from '@/lib/toronto-time';

export type UniversalSearchVariant = 'hero' | 'header';

interface UniversalSearchProps {
  variant?: UniversalSearchVariant;
  /** Header/mobile only: whether the expanded overlay is open. Ignored for hero. */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  /** Header only: initial focus when the header search becomes visible. */
  autoFocus?: boolean;
  className?: string;
}

type Tab = 'sale' | 'rent' | 'sold' | 'precon';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'sale', label: 'Buy' },
  { id: 'rent', label: 'Rent' },
  { id: 'sold', label: 'Sold' },
  { id: 'precon', label: 'Pre-Construction' },
];

const QUICK_FILTERS: Array<{
  id: string;
  label: string;
  tabs: Tab[];
  build: (base: URLSearchParams) => void;
}> = [
  { id: 'condo', label: 'Condo', tabs: ['sale', 'rent', 'sold'], build: (p) => { p.set('propertyType', 'Condo Apt'); } },
  { id: 'house', label: 'House', tabs: ['sale', 'rent', 'sold'], build: (p) => { p.set('propertyType', 'Detached'); } },
  { id: 'town', label: 'Townhouse', tabs: ['sale', 'rent', 'sold'], build: (p) => { p.set('propertyType', 'Att/Row/Twnhouse'); } },
  { id: 'under750', label: 'Under $750K', tabs: ['sale', 'sold'], build: (p) => { p.set('priceMax', '750000'); } },
  { id: 'newtoday', label: 'New Today', tabs: ['sale', 'rent'], build: (p) => { p.set('listedFrom', torontoTodayISO()); } },
  { id: 'occ2028', label: 'Occupancy 2028+', tabs: ['precon'], build: (p) => { p.set('occupancyMin', '2028'); } },
];

interface ListingRow {
  mlsNumber: string;
  address: string;
  neighborhood: string;
  city: string;
  price: number | null;
  soldPrice: number | null;
  beds: number | null;
  bedsPlus: number | null;
  baths: number | null;
  sqft: string | null;
  propertyType: string | null;
  image: string | null;
  daysOnMarket: number | null;
  listDate: string | null;
  isNewToday: boolean;
  href: string;
}

interface HoodRow { name: string; slug: string; city: string; }
interface BuildingRow { name: string; city: string; neighborhood: string; }
interface ProjectRow {
  id: string; slug: string; name: string; mainImageUrl: string | null;
  priceMin: number | null; priceMax: number | null; status: string | null;
  estCompletion: string | null; neighborhoodName: string | null; developerName: string | null;
}
interface DeveloperRow { id: string; slug: string; name: string; logoUrl: string | null; }

interface TypeaheadResponse {
  query: string;
  tab: Tab;
  listings: ListingRow[];
  neighbourhoods: HoodRow[];
  buildings: BuildingRow[];
  projects: ProjectRow[];
  developers: DeveloperRow[];
  hasMore: Record<string, boolean>;
}

const MLS_RE = /^[A-Z]\d{6,9}$/i;

function fmtPrice(n: number | null): string {
  if (!n) return '';
  if (n >= 1000000) return `$${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 2)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

function bedsLabel(l: ListingRow): string {
  if (l.beds == null) return '';
  const plus = l.bedsPlus && l.bedsPlus > 0 ? `+${l.bedsPlus}` : '';
  return `${l.beds}${plus} bd`;
}

function propertyTypeShort(raw: string | null): string {
  if (!raw) return '';
  if (/condo/i.test(raw)) return 'Condo';
  if (/townhouse|twnhouse|att\/row/i.test(raw)) return 'Town';
  if (/detached/i.test(raw)) return 'Detached';
  if (/semi/i.test(raw)) return 'Semi';
  return raw.length > 12 ? raw.slice(0, 12) + '…' : raw;
}

export default function UniversalSearch(props: UniversalSearchProps) {
  const variant: UniversalSearchVariant = props.variant || 'hero';
  const isHeader = variant === 'header';

  const [tab, setTab] = useState<Tab>('sale');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<TypeaheadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();
  const listboxId = useId();

  const basePath = tab === 'precon' ? '/new-condos' : tab === 'sold' ? '/sold' : '/search';

  const buildParams = useCallback((): URLSearchParams => {
    const p = new URLSearchParams();
    if (tab !== 'sold' && tab !== 'precon') p.set('tab', tab);
    if (query.trim()) p.set('search', query.trim());
    return p;
  }, [tab, query]);

  const closeAll = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
    if (isHeader && props.onMobileClose) props.onMobileClose();
  }, [isHeader, props]);

  const runFullSearch = useCallback((rawQuery?: string) => {
    const q = (rawQuery ?? query).trim();
    if (q && MLS_RE.test(q)) {
      router.push(`/listing/${q.toUpperCase()}`);
      closeAll();
      return;
    }
    const p = buildParams();
    if (rawQuery !== undefined) {
      if (rawQuery.trim()) p.set('search', rawQuery.trim());
      else p.delete('search');
    }
    const qs = p.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
    closeAll();
  }, [buildParams, query, basePath, router, closeAll]);

  // Debounced typeahead fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setData(null);
      setLoading(false);
      abortRef.current?.abort();
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(`/api/search/typeahead?q=${encodeURIComponent(q)}&tab=${tab}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as TypeaheadResponse;
        if (ctrl.signal.aborted) return;
        setData(json);
        setActiveIndex(-1);
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setData({
          query: q, tab, listings: [], neighbourhoods: [], buildings: [], projects: [], developers: [],
          hasMore: { listings: false, neighbourhoods: false, buildings: false, projects: false, developers: false },
        });
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, tab]);

  // Click-outside to close
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, []);

  // AutoFocus (header mobile expand path)
  useEffect(() => {
    if (props.autoFocus) {
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [props.autoFocus]);

  // Flat option list for keyboard nav — must mirror the visual order.
  const flatOptions = useMemo(() => {
    const options: Array<{ id: string; kind: string; href: string; label: string }> = [];
    const q = query.trim();
    if (q) options.push({ id: 'search-action', kind: 'search', href: '', label: `Search for "${q}"` });
    if (data) {
      data.listings.forEach((l, i) => options.push({ id: `listing-${i}`, kind: 'listing', href: l.href, label: l.address }));
      data.neighbourhoods.forEach((n, i) => options.push({ id: `hood-${i}`, kind: 'hood', href: `/neighborhood/${n.slug}`, label: n.name }));
      data.buildings.forEach((b, i) => options.push({ id: `bldg-${i}`, kind: 'bldg', href: `/search?tab=${tab}&search=${encodeURIComponent(b.name)}`, label: b.name }));
      data.projects.forEach((p, i) => options.push({ id: `project-${i}`, kind: 'project', href: `/properties/${p.slug}`, label: p.name }));
      data.developers.forEach((d, i) => options.push({ id: `dev-${i}`, kind: 'developer', href: `/developers/${d.slug}`, label: d.name }));
    }
    return options;
  }, [data, query, tab]);

  const selectAt = useCallback((idx: number) => {
    const opt = flatOptions[idx];
    if (!opt) return;
    if (opt.kind === 'search') {
      runFullSearch();
      return;
    }
    router.push(opt.href);
    closeAll();
  }, [flatOptions, router, runFullSearch, closeAll]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((i) => Math.min(flatOptions.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      if (open && activeIndex >= 0 && flatOptions[activeIndex]) {
        e.preventDefault();
        selectAt(activeIndex);
      } else {
        e.preventDefault();
        runFullSearch();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (open) { setOpen(false); return; }
      if (query) { setQuery(''); return; }
      if (isHeader && props.onMobileClose) props.onMobileClose();
    } else if (e.key === 'Home') {
      if (open) { e.preventDefault(); setActiveIndex(0); }
    } else if (e.key === 'End') {
      if (open) { e.preventDefault(); setActiveIndex(flatOptions.length - 1); }
    }
  }

  useEffect(() => {
    if (activeIndex < 0 || !listboxRef.current) return;
    const opt = flatOptions[activeIndex];
    if (!opt) return;
    const el = listboxRef.current.querySelector<HTMLElement>(`[data-optid="${opt.id}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, flatOptions]);

  const activeId = activeIndex >= 0 ? flatOptions[activeIndex]?.id : undefined;

  const visibleFilters = useMemo(() => QUICK_FILTERS.filter((f) => f.tabs.includes(tab)), [tab]);

  const placeholder = useMemo(() => {
    if (isHeader) return 'Search Toronto real estate';
    switch (tab) {
      case 'rent': return 'Address, neighbourhood, building or MLS#';
      case 'sold': return 'Address, neighbourhood or MLS#';
      case 'precon': return 'Project, developer or neighbourhood';
      default: return 'Address, neighbourhood, building, developer or MLS#';
    }
  }, [tab, isHeader]);

  const showPanel = open && query.trim().length >= 2;
  const q = query.trim();
  const anyResults =
    !!data && (data.listings.length + data.neighbourhoods.length + data.buildings.length + data.projects.length + data.developers.length) > 0;

  return (
    <div
      ref={wrapRef}
      className={`w-full relative ${props.className || ''}`}
      data-hero-search={variant === 'hero' ? 'true' : undefined}
    >
      {!isHeader && (
        <div
          className="inline-flex bg-white/70 backdrop-blur-sm border border-black/5 rounded-full p-1 shadow-sm mb-3"
          role="tablist"
          aria-label="Search category"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              onClick={() => { setTab(t.id); setActiveIndex(-1); }}
              className={`text-[13px] font-medium px-4 py-1.5 rounded-full transition-all ${
                tab === t.id ? 'bg-text-primary text-white shadow-sm' : 'text-text-primary/70 hover:text-text-primary'
              }`}
              aria-selected={tab === t.id}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); runFullSearch(); }} className="relative">
        <div
          role="combobox"
          aria-expanded={showPanel}
          aria-owns={listboxId}
          aria-haspopup="listbox"
          className={
            isHeader
              ? 'flex bg-white rounded-full border border-black/10 hover:border-black/20 focus-within:border-text-primary/40 transition-colors overflow-hidden'
              : 'flex bg-white rounded-2xl border border-black/8 shadow-[0_8px_30px_rgba(15,23,42,0.08)] overflow-hidden'
          }
        >
          <div className="flex-1 relative flex items-center min-w-0">
            <svg
              className={
                isHeader
                  ? 'absolute left-3 w-4 h-4 text-text-muted'
                  : 'absolute left-4 w-5 h-5 text-text-muted'
              }
              fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => { if (query.trim().length >= 2) setOpen(true); }}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              className={
                isHeader
                  ? 'w-full pl-9 pr-9 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none bg-transparent'
                  : 'w-full pl-11 pr-10 py-4 text-[15px] text-text-primary placeholder:text-text-muted focus:outline-none bg-transparent'
              }
              aria-label="Search Toronto real estate"
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-activedescendant={activeId}
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setData(null); setActiveIndex(-1); inputRef.current?.focus(); }}
                aria-label="Clear search"
                className={
                  isHeader
                    ? 'absolute right-2 text-text-muted hover:text-text-primary p-1'
                    : 'absolute right-3 text-text-muted hover:text-text-primary p-1'
                }
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {!isHeader && (
            <button
              type="submit"
              className="px-6 md:px-8 bg-accent-blue text-white font-semibold text-sm hover:brightness-110 transition-all"
            >
              Search
            </button>
          )}
        </div>

        {showPanel && (
          <TypeaheadPanel
            ref={listboxRef}
            id={listboxId}
            loading={loading}
            data={data}
            query={q}
            tab={tab}
            activeId={activeId}
            variant={variant}
            onTabChange={(t) => { setTab(t); setActiveIndex(-1); }}
            onActivate={(id) => setActiveIndex(flatOptions.findIndex((o) => o.id === id))}
            onSelect={(id) => {
              const idx = flatOptions.findIndex((o) => o.id === id);
              if (idx >= 0) selectAt(idx);
            }}
            onRunFull={() => runFullSearch()}
            anyResults={anyResults}
          />
        )}
      </form>

      {!isHeader && (
        <div className="mt-4 flex flex-wrap gap-2">
          {visibleFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                const p = buildParams();
                f.build(p);
                const qs = p.toString();
                router.push(qs ? `${basePath}?${qs}` : basePath);
                setOpen(false);
              }}
              className="text-xs font-medium bg-white/80 hover:bg-white text-text-primary/85 hover:text-text-primary border border-black/8 rounded-full px-3 py-1.5 transition-colors backdrop-blur-sm"
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Panel
// ─────────────────────────────────────────────────────────────────

interface PanelProps {
  id: string;
  loading: boolean;
  data: TypeaheadResponse | null;
  query: string;
  tab: Tab;
  variant: UniversalSearchVariant;
  activeId?: string;
  onTabChange: (t: Tab) => void;
  onActivate: (id: string) => void;
  onSelect: (id: string) => void;
  onRunFull: () => void;
  anyResults: boolean;
}

const TypeaheadPanel = forwardRef<HTMLDivElement, PanelProps>(function TypeaheadPanel(
  { id, loading, data, query, tab, variant, activeId, onTabChange, onActivate, onSelect, onRunFull, anyResults },
  ref
) {
  const skeleton = loading && (!data || !anyResults);
  const showEmpty = !loading && data && !anyResults;
  const isHeader = variant === 'header';

  return (
    <div
      ref={ref}
      id={id}
      role="listbox"
      aria-label="Search results"
      className={
        'absolute z-40 left-0 right-0 top-full mt-2 bg-white border border-black/8 rounded-2xl shadow-[0_16px_60px_rgba(15,23,42,0.12)] max-h-[70vh] sm:max-h-[520px] overflow-y-auto'
      }
    >
      {isHeader && (
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-border px-3 py-2 flex items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange(t.id)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors ${
                tab === t.id ? 'bg-text-primary text-white' : 'text-text-primary/70 hover:bg-surface2'
              }`}
              aria-pressed={tab === t.id}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <SearchActionRow
        id="search-action"
        active={activeId === 'search-action'}
        query={query}
        onActivate={onActivate}
        onSelect={() => onSelect('search-action')}
      />

      {skeleton && <Skeleton />}

      {showEmpty && (
        <div className="px-4 py-8 text-center border-t border-border">
          <p className="text-sm text-text-primary">No matches for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-text-muted mt-1">Try an address, neighbourhood, or MLS number.</p>
          <button
            type="button"
            onClick={onRunFull}
            className="mt-4 text-xs font-medium text-accent-blue hover:underline"
          >
            Search everywhere →
          </button>
        </div>
      )}

      {data && data.listings.length > 0 && (
        <Group label="Listings" count={data.listings.length} more={data.hasMore.listings} moreHref={`/search?tab=${tab}&search=${encodeURIComponent(query)}`}>
          {data.listings.map((l, i) => (
            <ListingOption
              key={l.mlsNumber}
              id={`listing-${i}`}
              active={activeId === `listing-${i}`}
              onActivate={onActivate}
              onSelect={() => onSelect(`listing-${i}`)}
              listing={l}
            />
          ))}
        </Group>
      )}

      {data && data.neighbourhoods.length > 0 && (
        <Group label="Neighbourhoods" count={data.neighbourhoods.length} more={data.hasMore.neighbourhoods} moreHref={`/search?tab=${tab}&neighborhood=${encodeURIComponent(query)}`}>
          {data.neighbourhoods.map((n, i) => (
            <SimpleOption
              key={`${n.slug}-${i}`}
              id={`hood-${i}`}
              active={activeId === `hood-${i}`}
              onActivate={onActivate}
              onSelect={() => onSelect(`hood-${i}`)}
              icon="hood"
              title={n.name}
              subtitle={n.city}
            />
          ))}
        </Group>
      )}

      {data && data.buildings.length > 0 && (
        <Group label="Buildings" count={data.buildings.length} more={data.hasMore.buildings} moreHref={`/condos?search=${encodeURIComponent(query)}`}>
          {data.buildings.map((b, i) => (
            <SimpleOption
              key={`${b.name}-${i}`}
              id={`bldg-${i}`}
              active={activeId === `bldg-${i}`}
              onActivate={onActivate}
              onSelect={() => onSelect(`bldg-${i}`)}
              icon="building"
              title={b.name}
              subtitle={[b.neighborhood, b.city].filter(Boolean).join(' · ') || 'Toronto'}
            />
          ))}
        </Group>
      )}

      {data && data.projects.length > 0 && (
        <Group label="Pre-Construction" count={data.projects.length} more={data.hasMore.projects} moreHref={`/new-condos?search=${encodeURIComponent(query)}`}>
          {data.projects.map((p, i) => (
            <ProjectOption
              key={p.id}
              id={`project-${i}`}
              active={activeId === `project-${i}`}
              onActivate={onActivate}
              onSelect={() => onSelect(`project-${i}`)}
              project={p}
            />
          ))}
        </Group>
      )}

      {data && data.developers.length > 0 && (
        <Group label="Developers" count={data.developers.length} more={data.hasMore.developers} moreHref={`/developers`}>
          {data.developers.map((d, i) => (
            <SimpleOption
              key={d.id}
              id={`dev-${i}`}
              active={activeId === `dev-${i}`}
              onActivate={onActivate}
              onSelect={() => onSelect(`dev-${i}`)}
              icon="developer"
              title={d.name}
              subtitle="Developer"
            />
          ))}
        </Group>
      )}
    </div>
  );
});

function Group({ label, count, more, moreHref, children }: { label: string; count: number; more: boolean; moreHref: string; children: React.ReactNode; }) {
  return (
    <div className="border-t border-border first:border-t-0">
      <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold">{label}</p>
        <p className="text-[10px] text-text-muted">{count}</p>
      </div>
      <div>{children}</div>
      {more && (
        <Link
          href={moreHref}
          className="block px-4 py-2.5 text-xs font-medium text-accent-blue hover:bg-surface2 border-t border-border"
        >
          See all {label.toLowerCase()} →
        </Link>
      )}
    </div>
  );
}

function SearchActionRow({ id, active, query, onActivate, onSelect }: {
  id: string; active: boolean; query: string; onActivate: (id: string) => void; onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      data-optid={id}
      id={id}
      onMouseEnter={() => onActivate(id)}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-border transition-colors ${
        active ? 'bg-surface2' : 'hover:bg-surface2'
      }`}
    >
      <span className="w-8 h-8 rounded-lg bg-text-primary/8 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>
      <span className="text-sm text-text-primary truncate">
        Search for <span className="font-semibold">&ldquo;{query}&rdquo;</span>
      </span>
      <span className="ml-auto text-[10px] text-text-muted hidden sm:inline">Enter</span>
    </button>
  );
}

function ListingOption({ id, active, onActivate, onSelect, listing }: {
  id: string; active: boolean; onActivate: (id: string) => void; onSelect: () => void; listing: ListingRow;
}) {
  const beds = bedsLabel(listing);
  const price = listing.soldPrice ?? listing.price;
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      data-optid={id}
      id={id}
      onMouseEnter={() => onActivate(id)}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
        active ? 'bg-surface2' : 'hover:bg-surface2'
      }`}
    >
      <div className="w-14 h-14 rounded-md bg-surface2 overflow-hidden shrink-0 border border-border">
        {listing.image ? (
          <img src={listing.image} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[9px] text-text-muted">No photo</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-text-primary truncate">{listing.address}</p>
          {listing.isNewToday && (
            <span className="text-[9px] font-bold tracking-widest bg-accent-blue text-white px-1.5 py-0.5 rounded shrink-0">NEW</span>
          )}
        </div>
        <p className="text-[11px] text-text-muted truncate">
          {[beds, listing.baths ? `${listing.baths} ba` : '', listing.sqft ? `${listing.sqft} sqft` : '', propertyTypeShort(listing.propertyType)].filter(Boolean).join(' · ')}
        </p>
        <p className="text-[11px] text-text-muted truncate">
          {listing.neighborhood || listing.city}
        </p>
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        {price != null && (
          <p className="text-sm font-semibold text-accent-blue">{fmtPrice(price)}</p>
        )}
        {listing.daysOnMarket != null && listing.daysOnMarket >= 0 && (
          <p className="text-[10px] text-text-muted">
            {listing.daysOnMarket === 0 ? 'New' : `${listing.daysOnMarket}d on market`}
          </p>
        )}
        <p className="text-[10px] text-text-muted font-mono">{listing.mlsNumber}</p>
      </div>
    </button>
  );
}

function ProjectOption({ id, active, onActivate, onSelect, project }: {
  id: string; active: boolean; onActivate: (id: string) => void; onSelect: () => void; project: ProjectRow;
}) {
  const priceLabel = project.priceMin
    ? `From ${fmtPrice(project.priceMin)}`
    : 'Pricing not released';
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      data-optid={id}
      id={id}
      onMouseEnter={() => onActivate(id)}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
        active ? 'bg-surface2' : 'hover:bg-surface2'
      }`}
    >
      <div className="w-14 h-14 rounded-md bg-surface2 overflow-hidden shrink-0 border border-border">
        {project.mainImageUrl ? (
          <img src={project.mainImageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[9px] text-text-muted">Rendering</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary truncate">{project.name}</p>
        <p className="text-[11px] text-text-muted truncate">
          {[project.developerName, project.neighborhoodName].filter(Boolean).join(' · ') || 'Toronto'}
        </p>
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <p className="text-xs font-semibold text-text-primary">{priceLabel}</p>
        {project.estCompletion && (
          <p className="text-[10px] text-text-muted">Occ. {project.estCompletion}</p>
        )}
      </div>
    </button>
  );
}

function SimpleOption({ id, active, onActivate, onSelect, icon, title, subtitle }: {
  id: string; active: boolean; onActivate: (id: string) => void; onSelect: () => void;
  icon: 'hood' | 'building' | 'developer'; title: string; subtitle: string;
}) {
  const iconEl = icon === 'hood' ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l7 4v6c0 5-3.5 9.5-7 10-3.5-.5-7-5-7-10V6l7-4z" /></svg>
  ) : icon === 'building' ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 21V7l8-4 8 4v14M9 21v-6h6v6M9 11h.01M15 11h.01M9 15h.01M15 15h.01" /></svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11c1.657 0 3-1.79 3-4S17.657 3 16 3s-3 1.79-3 4 1.343 4 3 4zm-8 0c1.657 0 3-1.79 3-4S9.657 3 8 3 5 4.79 5 7s1.343 4 3 4zm0 2c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zm8 0c-.29 0-.62.02-.97.05C16.16 14 18 15.13 18 16v3h6v-3c0-2.66-5.33-4-8-4z" /></svg>
  );
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      data-optid={id}
      id={id}
      onMouseEnter={() => onActivate(id)}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
        active ? 'bg-surface2' : 'hover:bg-surface2'
      }`}
    >
      <span className="w-8 h-8 rounded-lg bg-text-primary/8 flex items-center justify-center shrink-0 text-text-primary">
        {iconEl}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary truncate">{title}</p>
        <p className="text-[11px] text-text-muted truncate">{subtitle}</p>
      </div>
    </button>
  );
}

function Skeleton() {
  return (
    <div className="border-t border-border">
      <div className="px-4 pt-3 pb-1.5">
        <div className="h-2 w-20 bg-surface2 rounded animate-pulse" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="px-4 py-2.5 flex items-center gap-3">
          <div className="w-14 h-14 rounded-md bg-surface2 animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-3/5 bg-surface2 rounded animate-pulse" />
            <div className="h-2.5 w-2/5 bg-surface2 rounded animate-pulse" />
          </div>
          <div className="w-16 space-y-1.5">
            <div className="h-3 w-full bg-surface2 rounded animate-pulse" />
            <div className="h-2 w-3/4 bg-surface2 rounded animate-pulse ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}
