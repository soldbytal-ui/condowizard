'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Item {
  mlsNumber: string;
  soldPrice: number | null;
  listPrice: number | null;
  daysOnMarket: number | null;
  soldDate: string | null;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: string | null;
  propertyType: string | null;
}

interface Props {
  slug: string;
  neighborhoodName?: string;
  limit?: number;
}

function fmtPriceFull(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString()}`;
}

function fmtOverAsk(sold: number | null, list: number | null): { text: string; positive: boolean } | null {
  if (!sold || !list || list === 0) return null;
  const pct = ((sold - list) / list) * 100;
  const positive = pct > 0;
  return { text: `${positive ? '+' : ''}${pct.toFixed(1)}% ${positive ? 'over ask' : 'below ask'}`, positive };
}

export default function LightningSolds({ slug, neighborhoodName, limit = 6 }: Props) {
  const { isAuthenticated, setShowAuthModal } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [gated, setGated] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const run = async () => {
      const headers: Record<string, string> = {};
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        headers['Authorization'] = `Bearer ${data.session.access_token}`;
      }
      const res = await fetch(`/api/market/hot-solds?slug=${encodeURIComponent(slug)}&limit=${limit}`, { headers });
      const json = await res.json();
      if (!alive) return;
      setItems(json.items || []);
      setGated(!!json.gated);
      setLoading(false);
    };
    run().catch((err) => {
      console.error('[LightningSolds] fetch error:', err);
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [slug, limit, isAuthenticated]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-5 animate-pulse">
            <div className="h-3 w-24 bg-surface2 rounded" />
            <div className="mt-3 h-6 w-32 bg-surface2 rounded" />
            <div className="mt-4 h-4 w-full bg-surface2 rounded" />
            <div className="mt-2 h-3 w-2/3 bg-surface2 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-6 text-sm text-text-muted">
        No lightning-fast solds{neighborhoodName ? ` in ${neighborhoodName}` : ''} yet — check back tomorrow.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const overAsk = fmtOverAsk(item.soldPrice, item.listPrice);
        return (
          <div key={item.mlsNumber} className="bg-white rounded-xl border border-border p-5 flex flex-col">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue text-[10px] font-semibold uppercase tracking-wider">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
                </svg>
                Lightning
              </span>
              {item.daysOnMarket != null ? (
                <span className="text-[11px] font-medium text-text-muted">
                  {item.daysOnMarket} {item.daysOnMarket === 1 ? 'day' : 'days'} on market
                </span>
              ) : null}
            </div>

            <div className="mt-3 relative">
              {gated ? (
                <>
                  <p className="font-serif text-2xl font-bold text-text-primary select-none">$•••,•••</p>
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="mt-1 text-[11px] font-medium text-accent-blue hover:underline"
                  >
                    Sign up free to see sold price
                  </button>
                </>
              ) : (
                <p className="font-serif text-2xl font-bold text-text-primary tabular-nums">
                  {fmtPriceFull(item.soldPrice)}
                </p>
              )}
              {!gated && overAsk ? (
                <span
                  className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    overAsk.positive ? 'bg-accent-green/10 text-accent-green' : 'bg-surface2 text-text-muted'
                  }`}
                >
                  {overAsk.text}
                </span>
              ) : null}
            </div>

            <div className="mt-4 text-sm text-text-primary">
              <p className="font-medium truncate">{item.address || 'Address available with signup'}</p>
              <p className="mt-1 text-xs text-text-muted">
                {[
                  item.bedrooms != null ? `${item.bedrooms} BR` : null,
                  item.bathrooms != null ? `${item.bathrooms} BA` : null,
                  item.sqft || null,
                  item.propertyType || null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {item.soldDate ? (
                <p className="mt-1 text-[11px] text-text-muted">Sold {item.soldDate}</p>
              ) : null}
            </div>

            {!gated ? (
              <Link
                href={`/listing/${item.mlsNumber}`}
                className="mt-4 text-xs font-medium text-accent-blue hover:underline self-start"
              >
                View listing &rarr;
              </Link>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
