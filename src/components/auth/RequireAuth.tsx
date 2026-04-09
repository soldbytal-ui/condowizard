'use client';

import { useAuth } from '@/contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  blur?: boolean;
}

// Blurs/hides content for unauthenticated users, shows CTA to sign up
export default function RequireAuth({ children, fallback, blur }: Props) {
  const { isAuthenticated, setShowAuthModal } = useAuth();

  if (isAuthenticated) return <>{children}</>;

  if (blur) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
          <div className="text-center p-6">
            <p className="font-semibold text-text-primary mb-2">Sign up to view full details</p>
            <p className="text-sm text-text-muted mb-3">Free account required to see prices, addresses, and sold data</p>
            <button onClick={() => setShowAuthModal(true)} className="bg-accent-blue text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-accent-blue/90 transition-colors">
              Sign Up Free
            </button>
          </div>
        </div>
      </div>
    );
  }

  return fallback ? <>{fallback}</> : (
    <div className="text-center p-8">
      <p className="font-semibold text-text-primary mb-2">Sign up to access this content</p>
      <button onClick={() => setShowAuthModal(true)} className="bg-accent-blue text-white px-6 py-2 rounded-lg text-sm font-medium">Sign Up Free</button>
    </div>
  );
}

// Blurred price display for non-authenticated users
export function GatedPrice({ price, className }: { price: string; className?: string }) {
  const { isAuthenticated, setShowAuthModal } = useAuth();
  if (isAuthenticated) return <span className={className}>{price}</span>;
  return (
    <span className={`${className} cursor-pointer`} onClick={() => setShowAuthModal(true)}>
      <span className="blur-sm select-none">$888,888</span>
    </span>
  );
}

// Blurred address for non-authenticated users
export function GatedAddress({ full, street }: { full: string; street: string }) {
  const { isAuthenticated, setShowAuthModal } = useAuth();
  if (isAuthenticated) return <span>{full}</span>;
  return <span className="cursor-pointer" onClick={() => setShowAuthModal(true)}>{street} <span className="text-accent-blue text-xs">(sign up to see full address)</span></span>;
}
