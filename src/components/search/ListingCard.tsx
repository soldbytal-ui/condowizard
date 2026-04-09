'use client';

import Link from 'next/link';
import { UnifiedListing, BUILDING_TYPE_COLORS, BUILDING_TYPE_LABELS } from '@/types/listing';
import { useAuth } from '@/contexts/AuthContext';

interface ListingCardProps {
  listing: UnifiedListing;
  onHover?: (id: string | null) => void;
  isHighlighted?: boolean;
  isSoldView?: boolean;
  isRentView?: boolean;
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

function formatSoldDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
}

function overUnderAsking(soldPrice: number | null, listPrice: number | null): { text: string; color: string } | null {
  if (!soldPrice || !listPrice || listPrice === 0) return null;
  const pct = ((soldPrice - listPrice) / listPrice) * 100;
  if (Math.abs(pct) < 0.1) return { text: 'At asking', color: 'text-text-muted' };
  if (pct > 0) return { text: `${pct.toFixed(1)}% over`, color: 'text-accent-green' };
  return { text: `${Math.abs(pct).toFixed(1)}% under`, color: 'text-red-500' };
}

export default function ListingCard({ listing, onHover, isHighlighted, isSoldView, isRentView }: ListingCardProps) {
  const href = listing.source === 'mls'
    ? `/listing/${listing.mlsNumber}`
    : `/projects/${listing.slug}`;

  const mainImage = listing.images?.[0] || '/placeholder-property.jpg';
  const isSold = isSoldView || !!listing.soldPrice;
  const overUnder = isSold ? overUnderAsking(listing.soldPrice, listing.originalPrice || listing.price) : null;

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
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-property.jpg'; }}
        />
        {/* Building type dot */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: isSold ? '#9CA3AF' : (BUILDING_TYPE_COLORS[listing.buildingType] || '#6B7280') }}
          />
          <span className="text-[10px] text-white font-medium">
            {isSold ? 'Sold' : (BUILDING_TYPE_LABELS[listing.buildingType] || listing.buildingType)}
          </span>
        </div>
        {/* Time badge / sold date */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
          <span className="text-[10px] text-white">
            {isSold && listing.soldDate
              ? formatSoldDate(listing.soldDate)
              : listing.source === 'precon'
              ? listing.occupancy || 'TBD'
              : timeAgo(listing.updatedAt)}
          </span>
        </div>
        {/* Sold badge */}
        {isSold && (
          <div className="absolute bottom-2 left-2 bg-gray-600 text-white text-[10px] font-bold rounded px-2 py-0.5">
            SOLD
          </div>
        )}
        {/* Pre-con badge */}
        {!isSold && listing.source === 'precon' && (
          <div className="absolute bottom-2 left-2 bg-bt-precon text-black text-[10px] font-bold rounded px-2 py-0.5">
            PRE-CONSTRUCTION
          </div>
        )}
        {/* Heart / Save */}
        <SaveButton listingId={listing.id} listingType={listing.source} />
      </div>

      {/* Info */}
      <div className="p-3">
        {isSold && listing.soldPrice ? (
          <>
            <p className="font-serif text-lg font-bold text-text-primary leading-tight">
              ${listing.soldPrice.toLocaleString()}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {listing.originalPrice || listing.price ? (
                <span className="text-xs text-text-muted line-through">
                  ${(listing.originalPrice || listing.price).toLocaleString()} list
                </span>
              ) : null}
              {overUnder && (
                <span className={`text-xs font-medium ${overUnder.color}`}>{overUnder.text}</span>
              )}
            </div>
          </>
        ) : isRentView ? (
          <p className="font-serif text-lg font-bold text-text-primary leading-tight">
            {listing.price ? `$${listing.price.toLocaleString()}/mo` : listing.priceDisplay}
          </p>
        ) : listing.source === 'precon' ? (
          <>
            <p className="font-serif text-lg font-bold text-text-primary leading-tight">
              {listing.priceDisplay}
            </p>
            {listing.developer && <p className="text-xs text-accent-blue mt-0.5">by {listing.developer}</p>}
          </>
        ) : (
          <p className="font-serif text-lg font-bold text-text-primary leading-tight">
            {listing.priceDisplay}
          </p>
        )}

        <p className="text-sm text-text-muted mt-1 truncate">{listing.address}</p>

        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
          {listing.beds > 0 && <span>{listing.beds} bed</span>}
          {listing.baths > 0 && <span>{listing.baths} bath</span>}
          {listing.parking && listing.parking > 0 && <span>{listing.parking} park</span>}
          {listing.sqft && <span>{listing.sqft} sqft</span>}
        </div>

        {/* Sold row: DOM */}
        {isSold && listing.dom > 0 && (
          <p className="text-xs text-text-muted mt-1">{listing.dom} days on market</p>
        )}

        {/* Active: maintenance fee (not shown for rentals) */}
        {!isSold && !isRentView && listing.maintenanceFee && listing.maintenanceFee > 0 && (
          <p className="text-xs text-text-muted mt-1">${Math.round(listing.maintenanceFee)}/mo maint.</p>
        )}

        {/* Pre-con: occupancy */}
        {listing.source === 'precon' && listing.occupancy && (
          <p className="text-xs text-text-muted mt-1">Est. {listing.occupancy}</p>
        )}
        {listing.source === 'precon' && listing.developer && !isRentView && !isSoldView && (
          <p className="text-xs text-accent-blue mt-1">{listing.developer}</p>
        )}
      </div>
    </Link>
  );
}

function SaveButton({ listingId, listingType }: { listingId: string; listingType: 'mls' | 'precon' }) {
  const { savedListingIds, toggleSaveListing } = useAuth();
  const isSaved = savedListingIds.has(listingId);

  return (
    <button
      className="absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center bg-white/80 rounded-full hover:bg-white transition-colors"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSaveListing(listingId, listingType); }}
    >
      <svg className={`w-4 h-4 ${isSaved ? 'text-red-500 fill-red-500' : 'text-text-muted'}`} fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}
