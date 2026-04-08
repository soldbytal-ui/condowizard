'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MarketStats {
  averagePrice?: number;
  medianPrice?: number;
  averageDom?: number;
  totalActive?: number;
  totalSold?: number;
}

export default function MarketPage() {
  const [stats, setStats] = useState<MarketStats>({});
  const [loading, setLoading] = useState(true);
  const [propertyType, setPropertyType] = useState('all');

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const body: Record<string, unknown> = {
          city: 'Toronto',
          status: 'A',
          type: 'sale',
          resultsPerPage: 1,
          statistics: true,
        };

        if (propertyType !== 'all') {
          body.class = propertyType;
        }

        const res = await fetch('/api/repliers/listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          const data = await res.json();
          setStats(data.statistics || {});
        }
      } catch (error) {
        console.error('Failed to fetch market stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [propertyType]);

  return (
    <div className="pt-14 bg-bg min-h-screen">
      <div className="container-main py-10">
        {/* Header */}
        <nav className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link href="/" className="hover:text-accent-blue">Home</Link>
          <span>/</span>
          <span className="text-text-primary">Market Stats</span>
        </nav>

        <h1 className="text-3xl font-bold text-text-primary">Toronto Real Estate Market</h1>
        <p className="text-text-muted mt-2">Live market data from the Toronto Regional Real Estate Board (TRREB)</p>

        {/* Property type filter */}
        <div className="flex gap-2 mt-6">
          {[
            { label: 'All Properties', value: 'all' },
            { label: 'Condos', value: 'condo' },
            { label: 'Detached', value: 'residential' },
            { label: 'Townhouses', value: 'condo townhouse' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPropertyType(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                propertyType === opt.value
                  ? 'bg-accent-blue text-white'
                  : 'bg-white border border-border text-text-muted hover:border-accent-blue/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-6 animate-pulse">
                <div className="h-8 bg-surface2 rounded w-24 mb-2" />
                <div className="h-4 bg-surface2 rounded w-20" />
              </div>
            ))
          ) : (
            <>
              <div className="bg-white rounded-xl border border-border p-6">
                <p className="font-serif text-3xl font-bold text-accent-blue">
                  {stats.totalActive ? stats.totalActive.toLocaleString() : '—'}
                </p>
                <p className="text-sm text-text-muted mt-1">Active Listings</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-6">
                <p className="font-serif text-3xl font-bold text-text-primary">
                  {stats.averagePrice ? `$${Math.round(stats.averagePrice).toLocaleString()}` : '—'}
                </p>
                <p className="text-sm text-text-muted mt-1">Average Price</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-6">
                <p className="font-serif text-3xl font-bold text-text-primary">
                  {stats.medianPrice ? `$${Math.round(stats.medianPrice).toLocaleString()}` : '—'}
                </p>
                <p className="text-sm text-text-muted mt-1">Median Price</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-6">
                <p className="font-serif text-3xl font-bold text-text-primary">
                  {stats.averageDom ? Math.round(stats.averageDom) : '—'}
                </p>
                <p className="text-sm text-text-muted mt-1">Avg Days on Market</p>
              </div>
              <div className="bg-white rounded-xl border border-border p-6">
                <p className="font-serif text-3xl font-bold text-accent-green">
                  {stats.totalSold ? stats.totalSold.toLocaleString() : '—'}
                </p>
                <p className="text-sm text-text-muted mt-1">Sold (30 days)</p>
              </div>
            </>
          )}
        </div>

        {/* Neighbourhood breakdown */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Market by Neighbourhood</h2>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-muted">Neighbourhood</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-text-muted">Avg Price</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-text-muted">Active</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-text-muted hidden md:table-cell">Avg DOM</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-text-muted hidden md:table-cell"></th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Downtown Core', code: 'C01' },
                  { name: 'Yorkville / Annex', code: 'C02' },
                  { name: 'Forest Hill', code: 'C03' },
                  { name: 'Yonge & Eglinton', code: 'C04' },
                  { name: 'North York Centre', code: 'C06' },
                  { name: 'King West / Liberty Village', code: 'C10' },
                  { name: 'Leslieville / Riverdale', code: 'C08' },
                  { name: 'Leaside', code: 'C11' },
                  { name: 'Etobicoke / Mimico', code: 'C14' },
                  { name: 'Willowdale', code: 'C07' },
                ].map((hood) => (
                  <tr key={hood.code} className="border-b border-border last:border-0 hover:bg-surface2 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/search?community=${hood.code}`} className="text-sm font-medium text-text-primary hover:text-accent-blue">
                        {hood.name}
                      </Link>
                      <span className="text-xs text-text-muted ml-2">{hood.code}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-text-primary">—</td>
                    <td className="px-4 py-3 text-right text-sm text-text-muted">—</td>
                    <td className="px-4 py-3 text-right text-sm text-text-muted hidden md:table-cell">—</td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <Link href={`/search?community=${hood.code}`} className="text-xs text-accent-blue hover:underline">
                        View Listings &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pre-construction section */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-text-primary mb-6">Pre-Construction Market</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-border p-6">
              <p className="text-sm text-text-muted mb-1">Active Projects</p>
              <p className="font-serif text-2xl font-bold text-bt-precon">200+</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-6">
              <p className="text-sm text-text-muted mb-1">Avg Price/Sqft</p>
              <p className="font-serif text-2xl font-bold text-text-primary">$1,200-$1,800</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-6">
              <p className="text-sm text-text-muted mb-1">Occupancy Range</p>
              <p className="font-serif text-2xl font-bold text-text-primary">2026-2030</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/search?tab=precon" className="inline-flex items-center gap-2 text-accent-blue font-medium hover:underline text-sm">
              Browse Pre-Construction Projects &rarr;
            </Link>
          </div>
        </section>

        {/* RECO */}
        <div className="mt-12 p-4 bg-white rounded-xl border border-border text-xs text-text-muted">
          <p>Tal Shelef, Sales Representative | Rare Real Estate Inc., Brokerage | 1701 Avenue Rd, Toronto, ON M5M 3Y3 | 647-890-4082</p>
          <p className="mt-1">Market data provided by TRREB. All information is deemed reliable but not guaranteed.</p>
        </div>
      </div>
    </div>
  );
}
