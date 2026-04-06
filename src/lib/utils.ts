import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | null | undefined): string {
  if (!price) return 'Contact for pricing';
  if (price >= 1_000_000) {
    const m = price / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  return `$${price.toLocaleString()}`;
}

export function formatPriceRange(min: number | null | undefined, max: number | null | undefined): string {
  if (!min && !max) return 'Contact for pricing';
  if (min && !max) return `From ${formatPrice(min)}`;
  if (!min && max) return `Up to ${formatPrice(max)}`;
  return `${formatPrice(min)} - ${formatPrice(max)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PRE_LAUNCH: { bg: 'bg-accent-green/20', text: 'text-accent-green' },
  PRE_CONSTRUCTION: { bg: 'bg-accent-green/20', text: 'text-accent-green' },
  UNDER_CONSTRUCTION: { bg: 'bg-accent-blue/20', text: 'text-accent-blue' },
  NEAR_COMPLETION: { bg: 'bg-accent-orange/20', text: 'text-accent-orange' },
  COMPLETED: { bg: 'bg-accent-gray/20', text: 'text-accent-gray' },
};

export const STATUS_LABELS: Record<string, string> = {
  PRE_LAUNCH: 'Pre-Launch',
  PRE_CONSTRUCTION: 'Pre-Construction',
  UNDER_CONSTRUCTION: 'Under Construction',
  NEAR_COMPLETION: 'Near Completion',
  COMPLETED: 'Completed',
};

export const CATEGORY_LABELS: Record<string, string> = {
  ULTRA_LUXURY: 'Ultra-Luxury',
  LUXURY_BRANDED: 'Luxury Branded',
  LUXURY: 'Luxury',
  PREMIUM: 'Premium',
  AFFORDABLE_LUXURY: 'Affordable Luxury',
};
