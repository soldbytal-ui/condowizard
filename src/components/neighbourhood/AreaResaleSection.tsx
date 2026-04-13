'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import ListingCard from '@/components/search/ListingCard';
import { UnifiedListing } from '@/types/listing';

const ResaleMiniMap = dynamic(() => import('./ResaleMiniMap'), { ssr: false });

interface Props {
  listings: UnifiedListing[];
  areaName: string;
  totalActive: number;
  avgPrice: number;
  slug: string;
}

export default function AreaResaleSection({ listings, areaName, totalActive, avgPrice, slug }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Resale Properties in {areaName}</h2>
          <p className="text-sm text-text-muted mt-1">
            {totalActive > 0 ? `${totalActive.toLocaleString()} active MLS listings` : ''}
            {avgPrice > 0 ? ` · Avg $${Math.round(avgPrice).toLocaleString()}` : ''}
          </p>
        </div>
        <Link href={`/search?neighborhood=${encodeURIComponent(areaName)}`} className="text-sm text-accent-blue hover:underline">
          View all on map &rarr;
        </Link>
      </div>

      {/* Mini map with listing pins */}
      <ResaleMiniMap listings={listings} boundary={null} neighbourhoodName={areaName} />

      {/* Listing cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {listings.slice(0, 6).map((listing) => (
          <ListingCard key={listing.mlsNumber || listing.id} listing={listing} />
        ))}
      </div>

      {totalActive > 6 && (
        <div className="mt-4 text-center">
          <Link href={`/search?neighborhood=${encodeURIComponent(areaName)}`} className="inline-flex items-center gap-2 text-accent-blue font-medium text-sm hover:underline">
            View all {totalActive.toLocaleString()} listings in {areaName} &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
