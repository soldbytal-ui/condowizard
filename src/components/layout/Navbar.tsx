'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NEIGHBORHOODS = [
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
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoodOpen, setHoodOpen] = useState(false);
  const hoodTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isSearch = pathname?.startsWith('/search');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setHoodOpen(false);
  }, [pathname]);

  // On search page, always show solid bg
  const showSolid = scrolled || !isHome || isSearch;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-14 transition-all duration-300 ${
        showSolid ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-border' : 'bg-transparent'
      }`}
    >
      <div className="container-main h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-0.5">
          <span className="text-accent-blue font-bold text-lg tracking-tight">CONDO</span>
          <span className="text-text-primary font-bold text-lg">WIZARD</span>
          <span className="text-text-muted font-light text-sm">.CA</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link href="/search" className={`btn-ghost text-sm ${isSearch ? 'text-accent-blue' : ''}`}>
            Buy
          </Link>
          <Link href="/search?tab=rent" className="btn-ghost text-sm">Rent</Link>
          <Link href="/sold" className="btn-ghost text-sm">Sold</Link>
          <Link href="/new-condos" className="btn-ghost text-sm">Pre-Construction</Link>
          <div
            className="relative"
            onMouseEnter={() => { if (hoodTimeoutRef.current) clearTimeout(hoodTimeoutRef.current); setHoodOpen(true); }}
            onMouseLeave={() => { hoodTimeoutRef.current = setTimeout(() => setHoodOpen(false), 150); }}
          >
            <button className="btn-ghost text-sm flex items-center gap-1 pb-3 -mb-3">
              Areas
              <svg className={`w-3.5 h-3.5 transition-transform ${hoodOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {hoodOpen && (
              <div className="absolute top-full left-0 pt-0 -mt-1">
                <div className="h-3" />
                <div className="bg-white rounded-xl shadow-lg border border-border py-3 min-w-[420px] grid grid-cols-2 gap-0">
                  {NEIGHBORHOODS.map((n) => (
                    <Link key={n.slug} href={`/neighborhood/${n.slug}`} className="block px-4 py-2 text-sm text-text-muted hover:text-accent-blue hover:bg-surface2 transition-colors">
                      {n.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Link href="/market" className="btn-ghost text-sm">Market Stats</Link>
          <Link href="/blog" className="btn-ghost text-sm">Blog</Link>
          <Link href="/contact-us" className="bg-accent-blue text-white text-sm font-medium py-2 px-4 rounded-lg hover:bg-accent-blue/90 transition-colors ml-2">
            Contact
          </Link>
        </div>

        <button className="md:hidden text-text-primary" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-border shadow-lg">
          <div className="container-main py-4 space-y-1">
            <Link href="/search" className="block py-2.5 text-text-muted hover:text-accent-blue transition-colors font-medium">Buy</Link>
            <Link href="/search?tab=rent" className="block py-2.5 text-text-muted hover:text-accent-blue transition-colors">Rent</Link>
            <Link href="/sold" className="block py-2.5 text-text-muted hover:text-accent-blue transition-colors">Sold Data</Link>
            <Link href="/new-condos" className="block py-2.5 text-text-muted hover:text-accent-blue transition-colors">Pre-Construction</Link>
            <Link href="/market" className="block py-2.5 text-text-muted hover:text-accent-blue transition-colors">Market Stats</Link>
            <Link href="/blog" className="block py-2.5 text-text-muted hover:text-accent-blue transition-colors">Blog</Link>
            <div className="pt-2 border-t border-border mt-2">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Neighbourhoods</p>
              <div className="grid grid-cols-2 gap-1">
                {NEIGHBORHOODS.slice(0, 12).map((n) => (
                  <Link key={n.slug} href={`/neighborhood/${n.slug}`} className="text-sm text-text-muted hover:text-accent-blue py-1.5 transition-colors">{n.name}</Link>
                ))}
              </div>
            </div>
            <Link href="/contact-us" className="block w-full text-center bg-accent-blue text-white py-2.5 rounded-lg font-medium mt-4">Contact Us</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
