'use client';

import { useAuth } from '@/contexts/AuthContext';

interface Props {
  totalCount?: number;
  variant?: 'search' | 'detail';
}

export default function SignupBanner({ totalCount, variant = 'search' }: Props) {
  const { setShowAuthModal } = useAuth();

  if (variant === 'detail') {
    return (
      <div className="bg-white rounded-2xl border border-border p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-text-muted mb-1">Free account</p>
          <p className="text-base md:text-lg font-semibold text-text-primary leading-tight">
            Sign up free to view the full listing
          </p>
          <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-lg">
            Get the exact address, list price, description, sold history and comparable sales. Takes 30 seconds.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAuthModal(true)}
          className="shrink-0 bg-text-primary text-white text-sm font-semibold px-5 py-3 rounded-lg hover:brightness-110 transition-all"
        >
          Sign Up Free
        </button>
      </div>
    );
  }

  return (
    <div className="col-span-full py-8 px-6 text-center bg-gradient-to-b from-white to-surface2 rounded-2xl border border-border">
      <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Members only</p>
      <p className="font-serif text-xl md:text-2xl font-bold text-text-primary leading-tight">
        {totalCount && totalCount > 0
          ? `See all ${totalCount.toLocaleString()} listings with prices`
          : 'See every listing with the actual price'}
      </p>
      <p className="text-sm text-text-muted mt-2 max-w-md mx-auto leading-relaxed">
        Free account, no credit card. Unlocks list prices, exact addresses, sold history, and comparable sales.
      </p>
      <button
        type="button"
        onClick={() => setShowAuthModal(true)}
        className="mt-5 bg-text-primary text-white text-sm font-semibold px-6 py-3 rounded-lg hover:brightness-110 transition-all"
      >
        Sign Up Free
      </button>
    </div>
  );
}
