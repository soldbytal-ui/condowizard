'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Cls = 'all' | 'condo' | 'freehold' | 'condo-townhouse';

interface Snapshot {
  active: number;
  newListings: number;
  medianSold: number | null;
  medianDom: number | null;
  saleToList: number | null;
  soldCount: number;
  generatedAt: string;
}

const FILTERS: Array<{ id: Cls; label: string }> = [
  { id: 'all', label: 'All homes' },
  { id: 'condo', label: 'Condos' },
  { id: 'freehold', label: 'Freehold' },
  { id: 'condo-townhouse', label: 'Townhomes' },
];

function fmtPrice(n: number | null): string {
  if (!n) return '—';
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  return `$${Math.round(n / 1000)}K`;
}

function fmtInt(n: number | null): string {
  if (n == null) return '—';
  return n.toLocaleString('en-CA');
}

function fmtPct(n: number | null): string {
  if (n == null) return '—';
  return `${n.toFixed(1)}%`;
}

function timeSince(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

export default function MarketSnapshot() {
  const [cls, setCls] = useState<Cls>('all');
  const [data, setData] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(false);
    (async () => {
      try {
        const res = await fetch(`/api/market/resale?class=${cls}&bedrooms=all&days=30`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        if (cancelled) return;
        setData({
          active: json?.headline?.active ?? 0,
          newListings: json?.headline?.newListings ?? 0,
          medianSold: json?.headline?.medianSold ?? null,
          medianDom: json?.headline?.medianDom ?? null,
          saleToList: json?.headline?.saleToList ?? null,
          soldCount: json?.headline?.soldCount ?? 0,
          generatedAt: json?.generatedAt || new Date().toISOString(),
        });
      } catch {
        if (!cancelled) setErr(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [cls]);

  const tiles = data
    ? [
        { label: 'Active listings', value: fmtInt(data.active), hint: 'Currently on market' },
        { label: 'New listings (30d)', value: fmtInt(data.newListings), hint: 'Fresh to market' },
        { label: 'Sales past 30 days', value: fmtInt(data.soldCount), hint: 'Firm & sold' },
        { label: 'Median sold price', value: fmtPrice(data.medianSold), hint: 'Last 30 days' },
        { label: 'Median days on market', value: data.medianDom != null ? `${Math.round(data.medianDom)}` : '—', hint: 'Speed of sale' },
        { label: 'Sale-to-list', value: fmtPct(data.saleToList), hint: 'Sold vs. asking' },
      ]
    : Array.from({ length: 6 }, (_, i) => ({ label: '—', value: '—', hint: '—', key: i }));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
        <div className="inline-flex bg-white border border-border rounded-full p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setCls(f.id)}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition-all ${
                cls === f.id ? 'bg-text-primary text-white' : 'text-text-primary/70 hover:text-text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-text-muted">
          {loading ? 'Refreshing…' : err ? 'Live feed unavailable — showing last cached values.' : (
            <>Source: TRREB via Repliers · Updated {data ? timeSince(data.generatedAt) : ''}</>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {tiles.map((t, i) => (
          <div key={i} className="bg-white border border-border rounded-xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-text-muted">{t.label}</p>
            <p className={`font-serif text-2xl font-bold text-text-primary mt-1.5 ${loading ? 'opacity-40' : ''}`}>{t.value}</p>
            <p className="text-[11px] text-text-muted mt-1">{t.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <Link href="/market" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-blue hover:underline">
          Full Toronto market report <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
