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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setHoodOpen(false);
  }, [pathname]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-14 transition-all duration-300 ${
        scrolled || !isHome ? 'glass-panel' : 'bg-transparent'
      }`}
    >
      <div className="container-main h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-0.5">
          <span className="text-accent-blue font-semibold text-lg tracking-tight">CONDO</span>
          <span className="text-text-primary font-semibold text-lg">WIZARD</span>
          <span className="text-text-muted font-light text-sm">.CA</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link href="/new-condos" className="btn-ghost text-sm">Properties</Link>
          <div
            className="relative"
            onMouseEnter={() => { if (hoodTimeoutRef.current) clearTimeout(hoodTimeoutRef.current); setHoodOpen(true); }}
            onMouseLeave={() => { hoodTimeoutRef.current = setTimeout(() => setHoodOpen(false), 150); }}
          >
            <button className="btn-ghost text-sm flex items-center gap-1 pb-3 -mb-3">
              Neighborhoods
              <svg className={`w-3.5 h-3.5 transition-transform ${hoodOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {hoodOpen && (
              <div className="absolute top-full left-0 pt-0 -mt-1">
                {/* Invisible bridge to prevent gap */}
                <div className="h-3" />
                <div className="glass-panel rounded-xl py-3 min-w-[420px] grid grid-cols-2 gap-0">
                  {NEIGHBORHOODS.map((n) => (
                    <Link key={n.slug} href={`/new-condos-${n.slug}`} className="block px-4 py-2 text-sm text-text-muted hover:text-accent-blue hover:bg-surface2 transition-colors">
                      {n.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Link href="/developers" className="btn-ghost text-sm">Developers</Link>
          <Link href="/blog" className="btn-ghost text-sm">Blog</Link>
          <Link href="/about" className="btn-ghost text-sm">About</Link>
          <Link href="/contact-us" className="btn-primary text-sm !py-2 !px-4 ml-2">Contact Us</Link>
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
        <div className="md:hidden glass-panel border-t border-border">
          <div className="container-main py-4 space-y-1">
            <Link href="/new-condos" className="block py-2.5 text-text-muted hover:text-accent-blue transition-colors">Properties</Link>
            <Link href="/developers" className="block py-2.5 text-text-muted hover:text-accent-blue transition-colors">Developers</Link>
            <Link href="/blog" className="block py-2.5 text-text-muted hover:text-accent-blue transition-colors">Blog</Link>
            <Link href="/about" className="block py-2.5 text-text-muted hover:text-accent-blue transition-colors">About</Link>
            <div className="pt-2 border-t border-border mt-2">
              <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Neighborhoods</p>
              <div className="grid grid-cols-2 gap-1">
                {NEIGHBORHOODS.slice(0, 12).map((n) => (
                  <Link key={n.slug} href={`/new-condos-${n.slug}`} className="text-sm text-text-muted hover:text-accent-blue py-1.5 transition-colors">{n.name}</Link>
                ))}
              </div>
            </div>
            <Link href="/contact-us" className="btn-primary w-full text-sm mt-4">Contact Us</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
