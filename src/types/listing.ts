// Unified listing type that both MLS (Repliers) and Pre-Construction (Supabase) conform to

export interface UnifiedListing {
  id: string;
  source: 'mls' | 'precon';
  address: string;
  city: string;
  neighborhood: string;
  community: string;
  lat: number;
  lng: number;
  price: number;
  priceDisplay: string;
  beds: number;
  baths: number;
  sqft: string;
  propertyType: string;
  buildingType: BuildingType;
  status: string;
  dom: number;
  images: string[];
  maintenanceFee: number | null;
  yearBuilt: number | null;
  developer: string | null;
  occupancy: string | null;
  description: string;
  features: string[];
  slug: string;
  mlsNumber: string | null;
  estimatedValue: number | null;
  listDate: string;
  updatedAt: string;
  // MLS-specific extras
  parking: number | null;
  stories: number | null;
  lotSize: string | null;
  taxes: number | null;
  soldPrice: number | null;
  soldDate: string | null;
  originalPrice: number | null;
}

export type BuildingType = 'low-rise' | 'mid-rise' | 'high-rise' | 'loft' | 'luxury' | 'precon';

export const BUILDING_TYPE_COLORS: Record<BuildingType, string> = {
  'low-rise': '#93C5FD',
  'mid-rise': '#34D399',
  'high-rise': '#A78BFA',
  'loft': '#FB923C',
  'luxury': '#F472B6',
  'precon': '#FBBF24',
};

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  'low-rise': 'Low-Rise',
  'mid-rise': 'Mid-Rise',
  'high-rise': 'High-Rise',
  'loft': 'Loft',
  'luxury': 'Luxury',
  'precon': 'Pre-Construction',
};

const LUXURY_NEIGHBORHOODS = ['yorkville', 'rosedale', 'forest hill', 'bridle path', 'the annex'];

export function classifyBuildingType(listing: {
  stories?: number | null;
  style?: string | null;
  price?: number | null;
  neighborhood?: string | null;
  source?: 'mls' | 'precon';
}): BuildingType {
  if (listing.source === 'precon') return 'precon';
  if (listing.style?.toLowerCase().includes('loft')) return 'loft';
  if (
    listing.price &&
    listing.price > 2_000_000 &&
    listing.neighborhood &&
    LUXURY_NEIGHBORHOODS.some((n) => listing.neighborhood!.toLowerCase().includes(n))
  ) {
    return 'luxury';
  }
  if (listing.stories) {
    if (listing.stories < 5) return 'low-rise';
    if (listing.stories <= 12) return 'mid-rise';
    return 'high-rise';
  }
  return 'mid-rise'; // default for condos
}

export interface ListingFilters {
  tab: 'sale' | 'precon' | 'sold' | 'rent';
  priceMin?: number;
  priceMax?: number;
  bedsMin?: number;
  bathsMin?: number;
  sqftMin?: number;
  sqftMax?: number;
  propertyType?: string;
  buildingTypes?: BuildingType[];
  neighborhood?: string;
  community?: string;
  yearBuiltMin?: number;
  domMax?: number;
  maintenanceFeeMax?: number;
  parking?: boolean;
  openHouse?: boolean;
  developer?: string;
  occupancyYear?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'largest';
  page?: number;
  pageSize?: number;
  bounds?: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } };
  polygon?: number[][];
  cluster?: boolean;
}
