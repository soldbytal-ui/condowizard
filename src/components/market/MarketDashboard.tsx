'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import StatTile from './StatTile';

type Neighborhood = {
  name: string;
  neighborhood: string;
  slug: string | null;
  active: number;
  activeMedianPrice: number | null;
  sold: number;
  soldMedianPrice: number | null;
  averageDom: number | null;
};

type Band = { label: string; count: number };

type ResaleResponse = {
  filters: { class: string; bedrooms: string; days: number; city: string };
  period: { start: string; end: string; yoyStart: string; yoyEnd: string };
  headline: {
    active: number;
    newListings: number;
    medianSold: number | null;
    averageSold: number | null;
    averageList: number | null;
    medianDom: number | null;
    averageDom: number | null;
    soldCount: number;
    saleToList: number | null;
    monthsOfInventory: number | null;
  };
  yoy: {
    medianSoldDelta: number | null;
    averageSoldDelta: number | null;
    soldCountDelta: number | null;
    averageDomDelta: number | null;
    saleToListDelta: number | null;
  };
  neighborhoods: Neighborhood[];
  priceBands: Band[];
  generatedAt: string;
};

const CLASS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Condo', value: 'condo' },
  { label: 'Freehold', value: 'freehold' },
  { label: 'Townhouse', value: 'condo-townhouse' },
];

const BED_OPTIONS = [
  { label: 'All Beds', value: 'all' },
  { label: 'Studio', value: '0' },
  { label: '1 BR', value: '1' },
  { label: '2 BR', value: '2' },
  { label: '3+ BR', value: '3+' },
];

const DAYS_OPTIONS = [
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '12 months', value: 365 },
];

function fmtPrice(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

function fmtPriceFull(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString()}`;
}

function fmtNumber(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  return Math.round(n).toLocaleString();
}

function fmtPct(n: number | null | undefined, digits = 1): string {
  if (n == null || !isFinite(n)) return '—';
  return `${n.toFixed(digits)}%`;
}

function fmtMonths(n: number | null | undefined): string {
  if (n == null || !isFinite(n)) return '—';
  return `${n.toFixed(1)} mo`;
}

// direction: 'up-good' means positive is good (green), 'down-good' inverts (falling DOM = good)
function delta(
  n: number | null | undefined,
  direction: 'up-good' | 'down-good' = 'up-good',
  kind: 'pct' | 'pp' = 'pct'
): { text: string; positive: boolean; neutral: boolean } | null {
  if (n == null || !isFinite(n)) return null;
  const sign = n > 0 ? '+' : '';
  const suffix = kind === 'pct' ? '%' : ' pp';
  const neutral = Math.abs(n) < 0.05;
  const isPositive = direction === 'up-good' ? n > 0 : n < 0;
  return { text: `${sign}${n.toFixed(1)}${suffix}`, positive: isPositive, neutral };
}

function priorPeriodCaption(days: number): string {
  return `vs. ${days === 30 ? 'last month' : days === 90 ? 'same quarter LY' : 'last year'}`;
}

export default function MarketDashboard() {
  const [cls, setCls] = useState('condo');
  const [beds, setBeds] = useState('all');
  const [days, setDays] = useState(90);
  const [data, setData] = useState<ResaleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    const q = new URLSearchParams({ class: cls, bedrooms: beds, days: String(days) });
    fetch(`/api/market/resale?${q.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        return (await res.json()) as ResaleResponse;
      })
      .then((json) => {
        if (alive) setData(json);
      })
      .catch((err) => {
        if (alive) setError(String(err?.message || err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [cls, beds, days]);

  const maxBand = useMemo(() => {
    if (!data) return 0;
    return Math.max(1, ...data.priceBands.map((b) => b.count));
  }, [data]);

  const priorCaption = priorPeriodCaption(days);

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-col md:flex-row md:items-center gap-4">
        <FilterGroup label="Type" options={CLASS_OPTIONS} value={cls} onChange={setCls} />
        <div className="hidden md:block w-px h-8 bg-border" />
        <FilterGroup label="Beds" options={BED_OPTIONS} value={beds} onChange={setBeds} />
        <div className="hidden md:block w-px h-8 bg-border" />
        <FilterGroup
          label="Window"
          options={DAYS_OPTIONS}
          value={days}
          onChange={(v) => setDays(Number(v))}
        />
      </div>

      {error ? (
        <div className="bg-white rounded-xl border border-border p-6 text-sm text-text-muted">
          Couldn&apos;t load market data — {error}
        </div>
      ) : null}

      {/* Headline KPIs */}
      <section>
        <SectionHeader
          title="Headline"
          subtitle={
            data
              ? `${data.headline.soldCount.toLocaleString()} sales · ${data.period.start} → ${data.period.end}`
              : 'Live from Repliers · MLS-sourced'
          }
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatTile
            loading={loading || !data}
            label="Median Sold"
            value={fmtPrice(data?.headline.medianSold)}
            delta={delta(data?.yoy.medianSoldDelta, 'up-good')}
            deltaCaption={priorCaption}
            accent="blue"
          />
          <StatTile
            loading={loading || !data}
            label="Average Sold"
            value={fmtPrice(data?.headline.averageSold)}
            delta={delta(data?.yoy.averageSoldDelta, 'up-good')}
            deltaCaption={priorCaption}
          />
          <StatTile
            loading={loading || !data}
            label="Sales Volume"
            value={fmtNumber(data?.headline.soldCount)}
            delta={delta(data?.yoy.soldCountDelta, 'up-good')}
            deltaCaption={priorCaption}
          />
          <StatTile
            loading={loading || !data}
            label="Sale to List"
            value={fmtPct(data?.headline.saleToList)}
            delta={delta(data?.yoy.saleToListDelta, 'up-good', 'pp')}
            deltaCaption={priorCaption}
          />
        </div>
      </section>

      {/* Supply + Days on market */}
      <section>
        <SectionHeader title="Supply & pace" subtitle="Active inventory and time to sell" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatTile
            loading={loading || !data}
            label="Active Listings"
            value={fmtNumber(data?.headline.active)}
            accent="blue"
          />
          <StatTile
            loading={loading || !data}
            label="New (30 days)"
            value={fmtNumber(data?.headline.newListings)}
          />
          <StatTile
            loading={loading || !data}
            label="Avg Days on Market"
            value={fmtNumber(data?.headline.averageDom)}
            delta={delta(data?.yoy.averageDomDelta, 'down-good')}
            deltaCaption={priorCaption}
          />
          <StatTile
            loading={loading || !data}
            label="Months of Inventory"
            value={fmtMonths(data?.headline.monthsOfInventory)}
          />
        </div>
      </section>

      {/* Neighborhood breakdown */}
      <section>
        <SectionHeader title="By neighbourhood" subtitle="Median sold price, activity, and days on market" />
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface2/60">
                <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Neighbourhood
                </th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Median Sold
                </th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Sold
                </th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted hidden md:table-cell">
                  Active
                </th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted hidden md:table-cell">
                  Avg DOM
                </th>
                <th className="px-4 py-3 hidden md:table-cell" />
              </tr>
            </thead>
            <tbody>
              {(loading || !data)
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-4"><div className="h-4 w-40 bg-surface2 rounded animate-pulse" /></td>
                      <td className="px-4 py-4 text-right"><div className="h-4 w-20 bg-surface2 rounded ml-auto animate-pulse" /></td>
                      <td className="px-4 py-4 text-right"><div className="h-4 w-10 bg-surface2 rounded ml-auto animate-pulse" /></td>
                      <td className="px-4 py-4 text-right hidden md:table-cell"><div className="h-4 w-10 bg-surface2 rounded ml-auto animate-pulse" /></td>
                      <td className="px-4 py-4 text-right hidden md:table-cell"><div className="h-4 w-10 bg-surface2 rounded ml-auto animate-pulse" /></td>
                      <td className="px-4 py-4 hidden md:table-cell" />
                    </tr>
                  ))
                : data.neighborhoods.map((h) => {
                    const searchHref = `/search?neighborhood=${encodeURIComponent(h.neighborhood)}`;
                    return (
                      <tr key={h.neighborhood} className="border-b border-border last:border-0 hover:bg-surface2/50 transition-colors">
                        <td className="px-4 py-3">
                          {h.slug ? (
                            <Link href={`/neighbourhood/${h.slug}`} className="text-sm font-medium text-text-primary hover:text-accent-blue">
                              {h.name}
                            </Link>
                          ) : (
                            <span className="text-sm font-medium text-text-primary">{h.name}</span>
                          )}
                          <span className="block text-[11px] text-text-muted mt-0.5">{h.neighborhood}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-text-primary tabular-nums">
                          {fmtPriceFull(h.soldMedianPrice)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-text-primary tabular-nums">{fmtNumber(h.sold)}</td>
                        <td className="px-4 py-3 text-right text-sm text-text-muted tabular-nums hidden md:table-cell">
                          {fmtNumber(h.active)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-text-muted tabular-nums hidden md:table-cell">
                          {fmtNumber(h.averageDom)}
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <Link href={searchHref} className="text-xs font-medium text-accent-blue hover:underline">
                            View listings &rarr;
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Price bands */}
      <section>
        <SectionHeader title="Price bands" subtitle={`Sales distribution · last ${days} days`} />
        <div className="bg-white rounded-xl border border-border p-6">
          {(loading || !data) ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-6 bg-surface2 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {data.priceBands.map((b) => {
                const pct = maxBand > 0 ? (b.count / maxBand) * 100 : 0;
                return (
                  <div key={b.label} className="grid grid-cols-[110px_1fr_60px] items-center gap-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{b.label}</span>
                    <div className="h-6 bg-surface2 rounded overflow-hidden">
                      <div
                        className="h-full bg-accent-blue"
                        style={{ width: `${pct}%`, transition: 'width 0.4s ease-out' }}
                      />
                    </div>
                    <span className="text-sm text-text-primary tabular-nums text-right">
                      {fmtNumber(b.count)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Data source note */}
      <p className="text-xs text-text-muted">
        Data source: Repliers (MLS/TRREB), refreshed every 5 minutes.{' '}
        {data ? (
          <span>
            Generated {new Date(data.generatedAt).toLocaleString('en-CA', { timeZone: 'America/Toronto' })} ET.
          </span>
        ) : null}
      </p>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div>
        <h2 className="text-xl font-bold text-text-primary">{title}</h2>
        {subtitle ? <p className="text-xs text-text-muted mt-1">{subtitle}</p> : null}
      </div>
    </div>
  );
}

type OptionValue = string | number;

interface FilterGroupProps<T extends OptionValue> {
  label: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}

function FilterGroup<T extends OptionValue>({ label, options, value, onChange }: FilterGroupProps<T>) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mr-1">
        {label}
      </span>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              active
                ? 'bg-accent-blue text-white border-accent-blue'
                : 'bg-white text-text-muted border-border hover:border-accent-blue/40 hover:text-text-primary'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
