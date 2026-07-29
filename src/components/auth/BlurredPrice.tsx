'use client';

import { useAuth } from '@/contexts/AuthContext';

// Deterministic fake price per listing so the DOM never contains the real
// value for logged-out users (a naive CSS blur is defeated by inspecting
// the element). The same listing always shows the same decoy so the UI
// doesn't flicker between renders.
const DECOY_BUCKETS = [
  479000, 549000, 615000, 685000, 749000, 819000, 895000,
  975000, 1055000, 1145000, 1249000, 1395000, 1520000, 1695000,
  1895000, 2150000, 2450000,
];
function decoyPrice(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  const value = DECOY_BUCKETS[Math.abs(hash) % DECOY_BUCKETS.length];
  return `$${value.toLocaleString()}`;
}

interface Props {
  seed: string;
  suffix?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function BlurredPrice({ seed, suffix = '', size = 'md' }: Props) {
  const { setShowAuthModal } = useAuth();
  const cls =
    size === 'lg' ? 'font-serif text-2xl md:text-3xl font-bold'
    : size === 'sm' ? 'font-serif text-sm font-bold'
    : 'font-serif text-lg font-bold';

  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAuthModal(true); }}
      className="relative inline-block group"
      aria-label="Sign up to see price"
    >
      <span className={`${cls} text-text-primary/70 blur-[6px] select-none`} aria-hidden>
        {decoyPrice(seed)}{suffix}
      </span>
      <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[10px] font-semibold tracking-wide text-white bg-accent-blue px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
          Sign up to see price
        </span>
      </span>
    </button>
  );
}
