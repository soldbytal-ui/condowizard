'use client';

import { useAuth } from '@/contexts/AuthContext';
import type { HomeListing } from '@/lib/homepage-data';
import HomeListingCard from './HomeListingCard';

interface Props {
  listings: HomeListing[];
}

export default function RecentlySold({ listings }: Props) {
  const { isAuthenticated, setShowAuthModal } = useAuth();
  const unlocked = isAuthenticated;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5 relative">
        {listings.slice(0, 6).map((l) => (
          <HomeListingCard key={l.mlsNumber} listing={l} variant="sold" soldUnlocked={unlocked} />
        ))}
      </div>

      {!unlocked && (
        <div className="mt-6 bg-white border border-border rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-text-primary">Toronto sold prices are members-only</p>
            <p className="text-xs text-text-muted mt-1 max-w-lg">
              Under TRREB VOW rules, sold prices are available to registered members. Create a free account to view every sold on file.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="bg-accent-blue text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:brightness-110 transition-all shrink-0"
          >
            Create free account
          </button>
        </div>
      )}
    </div>
  );
}
