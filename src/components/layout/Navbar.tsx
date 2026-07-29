'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import UniversalSearch from '@/components/home/UniversalSearch';

type NavChild = { href: string; label: string; desc?: string; match?: (p: string) => boolean };
type NavItem = { href?: string; label: string; match?: (p: string) => boolean; children?: NavChild[] };

const PRIMARY_NAV: NavItem[] = [
  {
    label: 'MLS',
    match: (p) => p === '/search' || p.startsWith('/sold'),
    children: [
      { href: '/search?tab=sale', label: 'Buy', desc: 'Homes for sale', match: (p) => p === '/search' },
      { href: '/search?tab=rent', label: 'Rent', desc: 'Rental listings' },
      { href: '/sold', label: 'Sold', desc: 'Sold history', match: (p) => p.startsWith('/sold') },
    ],
  },
  {
    label: 'Pre-Construction',
    match: (p) => p.startsWith('/new-condos') || p.startsWith('/new-homes') || p.startsWith('/pre-construction') || p.startsWith('/properties'),
    children: [
      { href: '/new-condos', label: 'New Condos', desc: 'Pre-construction condos across the GTA', match: (p) => p.startsWith('/new-condos') || p.startsWith('/pre-construction') || p.startsWith('/properties') },
      { href: '/new-homes', label: 'New Homes', desc: 'Freehold pre-construction communities', match: (p) => p.startsWith('/new-homes') },
    ],
  },
  { href: '#neighbourhoods', label: 'Neighbourhoods' },
  { href: '/market', label: 'Market', match: (p) => p.startsWith('/market') },
  { href: '/blog', label: 'Guides', match: (p) => p.startsWith('/blog') },
  { href: '/staging', label: 'Sell', match: (p) => p.startsWith('/staging') },
  { href: '/about', label: 'About', match: (p) => p.startsWith('/about') },
];

const NEIGHBOURHOODS = [
  { name: 'Downtown Core', slug: 'downtown-core' },
  { name: 'King West', slug: 'king-west' },
  { name: 'Liberty Village', slug: 'liberty-village' },
  { name: 'Queen West', slug: 'queen-west' },
  { name: 'Yorkville', slug: 'yorkville' },
  { name: 'The Annex', slug: 'the-annex' },
  { name: 'Midtown', slug: 'midtown' },
  { name: 'Yonge & Eglinton', slug: 'yonge-eglinton' },
  { name: 'North York', slug: 'north-york' },
  { name: 'Scarborough', slug: 'scarborough' },
  { name: 'Etobicoke', slug: 'etobicoke' },
  { name: 'Leaside', slug: 'leaside' },
  { name: 'Leslieville', slug: 'leslieville' },
  { name: 'Riverside', slug: 'riverside' },
  { name: 'Danforth', slug: 'danforth' },
  { name: 'High Park', slug: 'high-park' },
  { name: 'Junction', slug: 'junction' },
  { name: 'Waterfront', slug: 'waterfront' },
  { name: 'CityPlace', slug: 'cityplace' },
  { name: 'Fort York', slug: 'fort-york' },
  { name: 'Mississauga', slug: 'mississauga' },
  { name: 'Vaughan', slug: 'vaughan' },
  { name: 'Richmond Hill', slug: 'richmond-hill' },
  { name: 'Markham', slug: 'markham' },
];

export default function Navbar() {
  const hoodTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname() || '/';
  const isHome = pathname === '/';

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoodOpen, setHoodOpen] = useState(false);
  const [mlsOpen, setMlsOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  // Whether the hero's own search is currently in the viewport.
  // Initialised to the pessimistic case (true on homepage) so the header
  // search doesn't flash in before the IntersectionObserver has run.
  const [heroSearchVisible, setHeroSearchVisible] = useState(isHome);
  const [hasHeroSearch, setHasHeroSearch] = useState(isHome);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setHoodOpen(false);
    setMlsOpen(false);
    setMobileSearchOpen(false);
    // Assume homepage has a hero search present at top; interior pages don't.
    // The observer effect below will confirm and take over.
    setHasHeroSearch(isHome);
    setHeroSearchVisible(isHome);
  }, [pathname, isHome]);

  // Observe the hero search element (if the current page renders one).
  // When it scrolls out of view, we reveal the header search.
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>('[data-hero-search="true"]');
    if (!hero) {
      setHasHeroSearch(false);
      setHeroSearchVisible(false);
      return;
    }
    setHasHeroSearch(true);
    setHeroSearchVisible(true);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          setHeroSearchVisible(e.isIntersecting);
        }
      },
      { rootMargin: '-16px 0px 0px 0px', threshold: 0 }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, [pathname]);

  const showSolid = scrolled || !isHome;
  const compact = scrolled;

  // Header search reveal rule:
  //  - Interior page (no hero search): always visible.
  //  - Homepage: visible only after user scrolls past the hero search.
  const showHeaderSearch = !hasHeroSearch || !heroSearchVisible;

  const closeMobileSearch = useCallback(() => setMobileSearchOpen(false), []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        showSolid ? 'bg-white/95 backdrop-blur-md border-b border-border' : 'bg-transparent'
      } ${compact ? 'h-12 shadow-[0_1px_0_rgba(0,0,0,0.04)]' : 'h-16'}`}
    >
      <div className="container-main h-full flex items-center gap-3 lg:gap-4">
        <Link href="/" className="flex items-center gap-0.5 shrink-0" aria-label="CondoWizard home">
          <span className="text-accent-blue font-bold text-[17px] tracking-tight">CONDO</span>
          <span className="text-text-primary font-bold text-[17px]">WIZARD</span>
          <span className="text-text-muted font-light text-xs">.CA</span>
        </Link>

        {/* Header search — full field on xl+ */}
        <div
          className={`hidden xl:block flex-1 max-w-[360px] transition-all duration-300 ${
            showHeaderSearch ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'
          }`}
          aria-hidden={!showHeaderSearch}
        >
          <UniversalSearch variant="header" />
        </div>

        {/* Header search — icon between lg and xl (shows compact button that opens overlay) */}
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          className={`hidden lg:inline-flex xl:hidden items-center justify-center w-9 h-9 rounded-full border border-black/10 text-text-primary/80 hover:text-text-primary hover:border-black/20 transition-colors ${
            showHeaderSearch ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          aria-label="Search"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        <div className="hidden lg:flex items-center gap-0.5 shrink-0 ml-auto">
          {PRIMARY_NAV.map((item) => {
            // MLS-style dropdown (parent with children).
            if (item.children) {
              const parentActive = item.match ? item.match(pathname) : false;
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => { if (mlsTimeoutRef.current) clearTimeout(mlsTimeoutRef.current); setMlsOpen(true); }}
                  onMouseLeave={() => { mlsTimeoutRef.current = setTimeout(() => setMlsOpen(false), 150); }}
                >
                  <button
                    className={`text-[12.5px] font-medium px-2 py-2 rounded-md transition-colors flex items-center gap-1 ${
                      parentActive ? 'text-accent-blue' : 'text-text-primary/85 hover:text-text-primary'
                    }`}
                    aria-expanded={mlsOpen}
                    aria-haspopup="menu"
                  >
                    {item.label}
                    <svg className={`w-3 h-3 transition-transform ${mlsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {mlsOpen && (
                    <div className="absolute top-full left-0 pt-2" role="menu">
                      <div className="bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-border p-2 min-w-[220px]">
                        {item.children.map((c) => {
                          const active = c.match ? c.match(pathname) : pathname === c.href.split('?')[0];
                          return (
                            <Link
                              key={c.label}
                              href={c.href}
                              role="menuitem"
                              className={`block px-3 py-2 rounded-md transition-colors ${
                                active ? 'bg-surface2' : 'hover:bg-surface2'
                              }`}
                            >
                              <span className={`block text-[13px] font-medium ${active ? 'text-accent-blue' : 'text-text-primary'}`}>{c.label}</span>
                              {c.desc && <span className="block text-[11px] text-text-muted mt-0.5">{c.desc}</span>}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Neighbourhoods-style hash dropdown.
            const isNeighbourhoodsBtn = item.href?.startsWith('#');
            if (isNeighbourhoodsBtn) {
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => { if (hoodTimeoutRef.current) clearTimeout(hoodTimeoutRef.current); setHoodOpen(true); }}
                  onMouseLeave={() => { hoodTimeoutRef.current = setTimeout(() => setHoodOpen(false), 150); }}
                >
                  <button
                    className="text-[12.5px] font-medium text-text-primary/85 hover:text-text-primary px-2 py-2 rounded-md transition-colors flex items-center gap-1"
                    aria-expanded={hoodOpen}
                    aria-haspopup="menu"
                  >
                    {item.label}
                    <svg className={`w-3 h-3 transition-transform ${hoodOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {hoodOpen && (
                    <div className="absolute top-full right-0 pt-2" role="menu">
                      <div className="bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-border p-2 min-w-[520px] grid grid-cols-3 gap-0">
                        {NEIGHBOURHOODS.map((n) => (
                          <Link
                            key={n.slug}
                            href={`/neighborhood/${n.slug}`}
                            className="block px-3 py-1.5 text-[13px] text-text-primary/80 hover:text-accent-blue hover:bg-surface2 rounded-md transition-colors"
                          >
                            {n.name}
                          </Link>
                        ))}
                        <Link
                          href="/search"
                          className="block col-span-3 mt-1 pt-2 border-t border-border px-3 py-1.5 text-[12px] font-medium text-accent-blue hover:underline"
                        >
                          View all neighbourhoods →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            if (!item.href) return null;
            const active = item.match ? item.match(pathname) : pathname === item.href.split('?')[0];
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`text-[12.5px] font-medium px-2 py-2 rounded-md transition-colors ${
                  active ? 'text-accent-blue' : 'text-text-primary/85 hover:text-text-primary'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-1 shrink-0 ml-1">
          <SavedHomesButton />
          <SignInButton />
          <Link
            href="/contact-us"
            className="text-[12.5px] font-medium bg-accent-blue text-white px-3 py-2 rounded-md hover:brightness-110 transition-all"
          >
            Contact
          </Link>
        </div>

        {/* Mobile: search icon + burger */}
        <div className="lg:hidden ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            className={`text-text-primary p-2 -mr-1 transition-opacity ${
              showHeaderSearch ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            aria-label="Search"
            aria-expanded={mobileSearchOpen}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button
            className="text-text-primary p-1.5 -mr-1.5"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-border shadow-lg max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="container-main py-4 space-y-1">
            {PRIMARY_NAV.filter((p) => !p.href?.startsWith('#')).map((item) => {
              if (item.children) {
                return (
                  <div key={item.label} className="border-b border-border/60 py-2">
                    <p className="text-[11px] text-text-muted uppercase tracking-wider mb-1.5">{item.label}</p>
                    <div className="grid grid-cols-3 gap-x-2">
                      {item.children.map((c) => (
                        <Link
                          key={c.label}
                          href={c.href}
                          className="block py-1.5 text-sm text-text-primary/85 hover:text-accent-blue"
                          onClick={() => setMobileOpen(false)}
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }
              if (!item.href) return null;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block py-2.5 text-text-primary font-medium border-b border-border/60"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-3">
              <p className="text-[11px] text-text-muted uppercase tracking-wider mb-1.5">Neighbourhoods</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                {NEIGHBOURHOODS.slice(0, 12).map((n) => (
                  <Link key={n.slug} href={`/neighborhood/${n.slug}`} className="text-sm text-text-primary/80 hover:text-accent-blue py-1">
                    {n.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="pt-3 flex flex-col gap-2 border-t border-border">
              <SavedHomesButton mobile />
              <SignInButton mobile />
              <Link
                href="/contact-us"
                className="block w-full text-center bg-accent-blue text-white py-2.5 rounded-lg font-medium"
                onClick={() => setMobileOpen(false)}
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Expanded search overlay (mobile + lg-only when field is collapsed) */}
      {mobileSearchOpen && (
        <div className="xl:hidden fixed inset-0 z-[60] bg-black/40" onClick={closeMobileSearch}>
          <div
            className="absolute top-0 left-0 right-0 bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="container-main py-3 flex items-center gap-2">
              <div className="flex-1">
                <UniversalSearch variant="header" autoFocus onMobileClose={closeMobileSearch} />
              </div>
              <button
                type="button"
                onClick={closeMobileSearch}
                aria-label="Close search"
                className="text-text-primary p-2 shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

function SavedHomesButton({ mobile }: { mobile?: boolean }) {
  const { isAuthenticated, setShowAuthModal } = useAuth();
  const label = 'Saved';
  const cls = mobile
    ? 'block w-full text-left py-2.5 text-text-primary font-medium border border-border rounded-lg px-3'
    : 'text-[12.5px] font-medium text-text-primary/85 hover:text-text-primary px-2 py-2 rounded-md transition-colors flex items-center gap-1';
  if (isAuthenticated) {
    return (
      <Link href="/dashboard" className={cls}>
        {!mobile && (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )}
        {mobile ? 'Saved Homes' : label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => setShowAuthModal(true)} className={cls}>
      {!mobile && (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )}
      {mobile ? 'Saved Homes' : label}
    </button>
  );
}

function SignInButton({ mobile }: { mobile?: boolean }) {
  const { isAuthenticated, user, setShowAuthModal, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  if (isAuthenticated) {
    if (mobile) {
      return (
        <button onClick={() => signOut()} className="block w-full text-left py-2.5 text-text-primary font-medium border border-border rounded-lg px-3">
          Sign Out
        </button>
      );
    }
    return (
      <div className="relative">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-surface2 transition-colors">
          <div className="w-6 h-6 rounded-full bg-accent-blue/10 flex items-center justify-center">
            <span className="text-accent-blue text-[10px] font-bold">{(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}</span>
          </div>
        </button>
        {open && (
          <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-border py-1 min-w-[180px] z-50">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium text-text-primary">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
            </div>
            <Link href="/dashboard" className="block px-3 py-2 text-sm text-text-primary hover:bg-surface2" onClick={() => setOpen(false)}>Dashboard</Link>
            <button onClick={() => { signOut(); setOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50">Sign Out</button>
          </div>
        )}
      </div>
    );
  }
  const cls = mobile
    ? 'block w-full text-left py-2.5 text-text-primary font-medium border border-border rounded-lg px-3'
    : 'text-[12.5px] font-medium text-text-primary/85 hover:text-text-primary px-2 py-2 rounded-md transition-colors';
  return (
    <button type="button" onClick={() => setShowAuthModal(true)} className={cls}>
      Sign In
    </button>
  );
}
