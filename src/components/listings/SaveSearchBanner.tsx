'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  neighborhood: string;
  propertyType: string | null;
  beds: number | null;
  city: string;
}

// Compact banner that offers to notify the user about similar listings.
// Under the hood, "Get alerts" for signed-out users triggers the auth modal;
// signed-in users are sent to the search results with matching filters, where
// the existing save-search flow lives. No new API surface introduced.
export default function SaveSearchBanner({ neighborhood, propertyType, beds, city }: Props) {
  const { isAuthenticated, setShowAuthModal } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || !neighborhood) return null;

  const params = new URLSearchParams({ tab: 'sale' });
  if (neighborhood) params.set('neighborhood', neighborhood);
  if (beds) params.set('beds', String(beds));
  if (propertyType) params.set('propertyType', propertyType);

  const targetHref = `/search?${params.toString()}`;
  const summary = [
    beds ? `${beds}-bed` : null,
    propertyType || null,
    neighborhood,
    city && city !== 'Toronto' ? city : null,
  ].filter(Boolean).join(' · ');

  return (
    <div className="mt-4 bg-white border border-border rounded-xl p-3 md:p-4 flex flex-wrap items-center gap-3 justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 shrink-0 rounded-full bg-text-primary/8 flex items-center justify-center text-text-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14V11a6 6 0 10-12 0v3a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            Get alerts for similar listings
          </p>
          <p className="text-xs text-text-muted truncate">{summary || 'Similar Toronto listings'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isAuthenticated ? (
          <Link
            href={targetHref}
            className="text-xs font-semibold bg-text-primary text-white px-3 py-2 rounded-md hover:brightness-110 transition-all"
          >
            Save this search
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="text-xs font-semibold bg-text-primary text-white px-3 py-2 rounded-md hover:brightness-110 transition-all"
          >
            Save this search
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-text-muted hover:text-text-primary p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
