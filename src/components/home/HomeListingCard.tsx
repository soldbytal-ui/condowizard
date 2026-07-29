import Link from 'next/link';
import type { HomeListing } from '@/lib/homepage-data';
import { formatTorontoTime } from '@/lib/toronto-time';

interface Props {
  listing: HomeListing;
  variant?: 'new-today' | 'sold' | 'default';
  soldUnlocked?: boolean;
}

function fmtPrice(n: number | null): string {
  if (!n) return '—';
  if (n >= 1000000) return `$${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 2)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

function bedLabel(l: HomeListing): string {
  if (l.beds == null) return '—';
  const plus = l.bedsPlus && l.bedsPlus > 0 ? `+${l.bedsPlus}` : '';
  return `${l.beds}${plus} bed`;
}

function bathLabel(l: HomeListing): string {
  if (l.baths == null) return '';
  return `${l.baths} bath`;
}

function neighborhoodLabel(l: HomeListing): string {
  if (l.neighborhood) return l.neighborhood;
  return l.city || 'Toronto';
}

function propertyTypeLabel(l: HomeListing): string {
  const raw = l.propertyType || '';
  if (/condo/i.test(raw)) return 'Condo';
  if (/townhouse|twnhouse|att\/row/i.test(raw)) return 'Townhouse';
  if (/detached/i.test(raw)) return 'Detached';
  if (/semi/i.test(raw)) return 'Semi';
  return raw || 'Home';
}

export default function HomeListingCard({ listing, variant = 'default', soldUnlocked = false }: Props) {
  const isNewToday = variant === 'new-today';
  const isSold = variant === 'sold';
  const bg = listing.image || '';

  return (
    <Link
      href={listing.href}
      className="group block bg-white rounded-xl border border-border overflow-hidden hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all"
      aria-label={`${listing.address}, ${neighborhoodLabel(listing)}`}
    >
      <div className="relative aspect-[4/3] bg-surface2 overflow-hidden">
        {bg ? (
          <img
            src={bg}
            alt={`${listing.address}, ${neighborhoodLabel(listing)}`}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-text-muted">No photo</div>
        )}
        {isNewToday && (
          <div className="absolute top-2.5 left-2.5 bg-accent-blue text-white text-[10px] font-semibold tracking-wider rounded px-2 py-0.5">
            NEW TODAY
          </div>
        )}
        {isSold && (
          <div className="absolute top-2.5 left-2.5 bg-text-primary text-white text-[10px] font-semibold tracking-wider rounded px-2 py-0.5">
            SOLD
          </div>
        )}
        {isNewToday && listing.listDate && (
          <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-sm text-text-primary text-[10px] font-medium rounded px-2 py-0.5">
            Listed {formatTorontoTime(listing.listDate)}
          </div>
        )}
      </div>
      <div className="p-4">
        {isSold ? (
          <div className="flex items-baseline gap-2">
            {soldUnlocked ? (
              <p className="font-serif text-xl font-bold text-text-primary">{fmtPrice(listing.soldPrice)}</p>
            ) : (
              <p className="font-serif text-xl font-bold text-text-primary/40 select-none blur-[3px]">$•,•••,•••</p>
            )}
            {listing.price && (
              <span className="text-xs text-text-muted">List {fmtPrice(listing.price)}</span>
            )}
          </div>
        ) : (
          <p className="font-serif text-xl font-bold text-text-primary">{fmtPrice(listing.price)}</p>
        )}
        <p className="text-sm text-text-primary mt-1 truncate">{listing.address}</p>
        <p className="text-xs text-text-muted mt-0.5 truncate">
          {neighborhoodLabel(listing)} · {propertyTypeLabel(listing)}
        </p>
        <div className="flex items-center gap-3 text-xs text-text-muted mt-2.5 flex-wrap">
          <span>{bedLabel(listing)}</span>
          {bathLabel(listing) && <span>{bathLabel(listing)}</span>}
          {listing.sqft && <span>{listing.sqft} sqft</span>}
          {listing.parking != null && listing.parking > 0 && <span>{listing.parking} park</span>}
        </div>
      </div>
    </Link>
  );
}
