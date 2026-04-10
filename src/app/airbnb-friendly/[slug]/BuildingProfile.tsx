'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AirbnbBuilding } from '@/data/airbnb-buildings';
import { UnifiedListing } from '@/types/listing';

interface Props {
  building: AirbnbBuilding;
  parsedAddress: { streetNumber: string; streetName: string; streetSuffix: string; streetDirection?: string } | null;
}

export default function BuildingProfile({ building, parsedAddress }: Props) {
  const [forSale, setForSale] = useState<UnifiedListing[] | null>(null);
  const [forRent, setForRent] = useState<UnifiedListing[] | null>(null);
  const [sold, setSold] = useState<UnifiedListing[] | null>(null);
  const [activeTab, setActiveTab] = useState('sale');

  useEffect(() => {
    if (!parsedAddress) return;
    const base: any = {
      city: 'Toronto',
      streetNumber: parsedAddress.streetNumber,
      streetName: parsedAddress.streetName,
      resultsPerPage: 20,
    };
    if (parsedAddress.streetDirection) base.streetDirection = parsedAddress.streetDirection;

    // Fetch for sale
    fetch('/api/repliers/listings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...base, status: 'A', type: 'sale', sortBy: 'listPriceAsc' }),
    }).then((r) => r.ok ? r.json() : null).then((d) => setForSale(d?.listings || [])).catch(() => setForSale([]));

    // Fetch for rent
    fetch('/api/repliers/listings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...base, status: 'A', type: 'lease', sortBy: 'listPriceAsc' }),
    }).then((r) => r.ok ? r.json() : null).then((d) => setForRent(d?.listings || [])).catch(() => setForRent([]));

    // Fetch recently sold
    fetch('/api/repliers/listings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...base, status: 'U', lastStatus: 'Sld', sortBy: 'soldDateDesc', resultsPerPage: 10, minSoldDate: new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0] }),
    }).then((r) => r.ok ? r.json() : null).then((d) => setSold(d?.listings || [])).catch(() => setSold([]));
  }, [parsedAddress]);

  const tabs = [
    { key: 'sale', label: `For Sale${forSale ? ` (${forSale.length})` : ''}` },
    { key: 'rent', label: `For Rent${forRent ? ` (${forRent.length})` : ''}` },
    { key: 'sold', label: `Recently Sold${sold ? ` (${sold.length})` : ''}` },
    { key: 'invest', label: 'Investment' },
  ];

  const currentList = activeTab === 'sale' ? forSale : activeTab === 'rent' ? forRent : activeTab === 'sold' ? sold : null;
  const isLoading = currentList === null && activeTab !== 'invest';

  // Investment calc
  const avgSalePrice = forSale?.length ? Math.round(forSale.reduce((s, l) => s + l.price, 0) / forSale.length) : null;
  const avgRent = forRent?.length ? Math.round(forRent.reduce((s, l) => s + l.price, 0) / forRent.length) : null;
  const grossYield = avgSalePrice && avgRent ? ((avgRent * 12) / avgSalePrice * 100).toFixed(1) : null;

  return (
    <div>
      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-accent-blue text-accent-blue' : 'border-transparent text-text-muted'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Listing cards */}
      {activeTab !== 'invest' && (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-border animate-pulse">
                  <div className="h-32 bg-surface2 rounded-t-xl" />
                  <div className="p-3 space-y-2"><div className="h-4 bg-surface2 rounded w-24" /><div className="h-3 bg-surface2 rounded w-32" /></div>
                </div>
              ))}
            </div>
          ) : currentList && currentList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentList.map((l) => (
                <Link key={l.id} href={`/listing/${l.mlsNumber}`} className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-md hover:border-accent-blue/30 transition-all">
                  {l.images?.[0] && <img src={l.images[0]} alt={l.address} className="w-full h-32 object-cover" loading="lazy" />}
                  <div className="p-3">
                    <p className="font-serif font-bold text-text-primary">
                      {activeTab === 'sold' && l.soldPrice ? `$${l.soldPrice.toLocaleString()}` : activeTab === 'rent' ? `$${l.price.toLocaleString()}/mo` : `$${l.price.toLocaleString()}`}
                    </p>
                    {activeTab === 'sold' && l.soldDate && <p className="text-xs text-text-muted">Sold {l.soldDate.split('T')[0]}</p>}
                    <p className="text-sm text-text-muted truncate mt-0.5">{l.address}</p>
                    <p className="text-xs text-text-muted mt-1">{l.beds} bed · {l.baths} bath{l.sqft ? ` · ${l.sqft} sqft` : ''}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-sm py-8 text-center">No {activeTab === 'sale' ? 'units for sale' : activeTab === 'rent' ? 'units for rent' : 'recent sales'} found at this address.</p>
          )}
        </div>
      )}

      {/* Investment tab */}
      {activeTab === 'invest' && (
        <div className="max-w-2xl">
          <h3 className="font-semibold text-lg mb-4">Investment Analysis — {building.buildingName || building.address}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-lg border border-border p-3 text-center">
              <p className="text-xl font-bold text-text-primary">{avgSalePrice ? `$${avgSalePrice.toLocaleString()}` : '—'}</p>
              <p className="text-xs text-text-muted">Avg Sale Price</p>
            </div>
            <div className="bg-white rounded-lg border border-border p-3 text-center">
              <p className="text-xl font-bold text-text-primary">{avgRent ? `$${avgRent.toLocaleString()}/mo` : '—'}</p>
              <p className="text-xs text-text-muted">Avg Rent</p>
            </div>
            <div className="bg-white rounded-lg border border-border p-3 text-center">
              <p className="text-xl font-bold text-accent-blue">{grossYield ? `${grossYield}%` : '—'}</p>
              <p className="text-xs text-text-muted">Gross Yield</p>
            </div>
            <div className="bg-white rounded-lg border border-border p-3 text-center">
              <p className="text-xl font-bold text-red-600">{building.registrations}</p>
              <p className="text-xs text-text-muted">STR Registrations</p>
            </div>
          </div>

          {avgSalePrice && avgRent && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h4 className="font-medium text-sm mb-3">If you buy a unit here...</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-text-muted">Purchase price</span><span className="font-medium">${avgSalePrice.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Down payment (20%)</span><span>${Math.round(avgSalePrice * 0.2).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Est. monthly mortgage</span><span>${Math.round(avgSalePrice * 0.8 * 0.045 / 12 * Math.pow(1 + 0.045 / 12, 300) / (Math.pow(1 + 0.045 / 12, 300) - 1)).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Est. monthly rent (long-term)</span><span className="text-accent-green font-medium">${avgRent.toLocaleString()}/mo</span></div>
                <div className="flex justify-between border-t border-border pt-2"><span className="text-text-muted font-medium">Gross rental yield</span><span className="font-bold text-accent-blue">{grossYield}%</span></div>
              </div>
              <p className="text-xs text-text-muted mt-3">This analysis uses long-term rental estimates. Airbnb income may be higher but is subject to the 180-night cap, vacancy, and condo board rules.</p>
            </div>
          )}

          <div className="mt-4 p-4 bg-surface rounded-xl">
            <p className="text-sm text-text-muted">Questions about investing in this building?</p>
            <a href="tel:6478904082" className="text-accent-blue font-medium text-sm">Call Tal Shelef — 647-890-4082</a>
          </div>
        </div>
      )}
    </div>
  );
}
