'use client';

import { useAuth } from '@/contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  message?: string;
}

// VOW-specific gating for sold data (TREB compliance)
// IDX data (active listings) = public
// VOW data (sold prices, history) = requires free account
export default function VOWLocked({ children, message = 'Sign up free to view sold data' }: Props) {
  const { isAuthenticated, setShowAuthModal } = useAuth();

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none opacity-50">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-border max-w-sm">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="font-semibold text-text-primary">{message}</p>
          <p className="text-xs text-text-muted mt-1.5">Sold data requires a free account per TREB regulations</p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="mt-4 px-6 py-2.5 bg-accent-blue text-white rounded-lg text-sm font-semibold hover:bg-accent-blue/90 transition-colors"
          >
            Sign Up Free
          </button>
          <p className="text-[10px] text-text-muted mt-3">
            By signing up you agree to the <a href="/terms/vow" className="underline">VOW Terms of Use</a> and establish a broker-consumer relationship with Rare Real Estate Inc.
          </p>
        </div>
      </div>
    </div>
  );
}
