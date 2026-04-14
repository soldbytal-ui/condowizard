'use client';

import { useState } from 'react';
import Link from 'next/link';
import ListingCard from '@/components/search/ListingCard';
import { UnifiedListing } from '@/types/listing';
import VOWLocked from '@/components/auth/VOWLocked';

interface Props {
  forSale: UnifiedListing[];
  forRent: UnifiedListing[];
  sold: UnifiedListing[];
  name: string;
}

export default function NeighbourhoodTabsClient({ forSale, forRent, sold, name }: Props) {
  const [tab, setTab] = useState<'sale' | 'rent' | 'sold'>('sale');

  const tabs = [
    { key: 'sale' as const, label: `For Sale (${forSale.length})` },
    { key: 'rent' as const, label: `For Rent (${forRent.length})` },
    { key: 'sold' as const, label: `Sold (${sold.length})` },
  ];

  const current = tab === 'sale' ? forSale : tab === 'rent' ? forRent : sold;

  return (
    <div className="mt-6">
      {/* Tab bar */}
      <div className="flex border-b border-border mb-4">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-accent-blue text-accent-blue' : 'border-transparent text-text-muted hover:text-text-primary'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Listing cards — sold data is VOW-gated */}
      {current.length > 0 ? (
        tab === 'sold' ? (
          <VOWLocked message="Sign up to view recently sold properties">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {current.map((listing) => (
                <ListingCard key={listing.mlsNumber || listing.id} listing={listing} isSoldView isRentView={false} />
              ))}
            </div>
          </VOWLocked>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {current.map((listing) => (
              <ListingCard key={listing.mlsNumber || listing.id} listing={listing} isSoldView={false} isRentView={tab === 'rent'} />
            ))}
          </div>
        )
      ) : (
        <p className="text-text-muted text-sm py-8 text-center">
          No {tab === 'sale' ? 'properties for sale' : tab === 'rent' ? 'rentals' : 'recently sold properties'} found in {name}.
        </p>
      )}

      {current.length > 0 && (
        <div className="mt-4 text-center">
          <Link
            href={`/search?neighborhood=${encodeURIComponent(name)}${tab === 'rent' ? '&tab=rent' : tab === 'sold' ? '&tab=sold' : ''}`}
            className="text-sm text-accent-blue hover:underline"
          >
            View all {tab === 'sale' ? 'listings' : tab === 'rent' ? 'rentals' : 'sold data'} in {name} &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
