'use client';

import Link from 'next/link';
import { UnifiedListing, BUILDING_TYPE_COLORS, BUILDING_TYPE_LABELS } from '@/types/listing';
import { formatPrice } from '@/lib/utils';

interface ListingCardProps {
  listing: UnifiedListing;
  onHover?: (id: string | null) => void;
  isHighlighted?: boolean;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just Now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function ListingCard({ listing, onHover, isHighlighted }: ListingCardProps) {
  const href = listing.source === 'mls'
    ? `/listing/${listing.mlsNumber}`
    : `/projects/${listing.slug}`;

  const mainImage = listing.images[0] || '/placeholder-property.jpg';

  return (
    <Link
      href={href}
      className={`block bg-white rounded-xl border transition-all hover:shadow-md ${
        isHighlighted ? 'border-accent-blue shadow-md ring-2 ring-accent-blue/20' : 'border-border'
      }`}
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] rounded-t-xl overflow-hidden bg-surface2">
        <img
          src={mainImage}
          alt={`${listing.address} - ${listing.propertyType} in ${listing.neighborhood}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Building type dot */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: BUILDING_TYPE_COLORS[listing.buildingType] }}
          />
          <span className="text-[10px] text-white font-medium">
            {BUILDING_TYPE_LABELS[listing.buildingType]}
          </span>
        </div>
        {/* Time badge */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
          <span className="text-[10px] text-white">
            {listing.source === 'precon' ? listing.occupancy || 'TBD' : timeAgo(listing.updatedAt)}
          </span>
        </div>
        {/* Pre-con badge */}
        {listing.source === 'precon' && (
          <div className="absolute bottom-2 left-2 bg-bt-precon text-black text-[10px] font-bold rounded px-2 py-0.5">
            PRE-CONSTRUCTION
          </div>
        )}
        {/* Sold badge */}
        {listing.soldPrice && (
          <div className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px] font-bold rounded px-2 py-0.5">
            SOLD
          </div>
        )}
        {/* Heart */}
        <button
          className="absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center bg-white/80 rounded-full hover:bg-white transition-colors"
          onClick={(e) => { e.preventDefault(); }}
        >
          <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-serif text-lg font-bold text-text-primary leading-tight">
          {listing.soldPrice
            ? `$${listing.soldPrice.toLocaleString()}`
            : listing.priceDisplay}
        </p>
        {listing.soldPrice && listing.price !== listing.soldPrice && (
          <p className="text-xs text-text-muted line-through">${listing.price.toLocaleString()} asking</p>
        )}
        <p className="text-sm text-text-muted mt-1 truncate">{listing.address}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
          {listing.beds > 0 && <span>{listing.beds} bed</span>}
          {listing.baths > 0 && <span>{listing.baths} bath</span>}
          {listing.parking && listing.parking > 0 && <span>{listing.parking} park</span>}
          {listing.sqft && <span>{listing.sqft} sqft</span>}
        </div>
        {listing.maintenanceFee && listing.maintenanceFee > 0 && (
          <p className="text-xs text-text-muted mt-1">
            ${Math.round(listing.maintenanceFee)}/mo maint.
          </p>
        )}
        {listing.source === 'precon' && listing.developer && (
          <p className="text-xs text-accent-blue mt-1">{listing.developer}</p>
        )}
      </div>
    </Link>
  );
}
