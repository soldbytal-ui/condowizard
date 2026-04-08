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

// Freehold property types — these are houses, not condos
const FREEHOLD_TYPES = ['detached', 'semi-detached', 'att/row/twnhouse', 'link', 'duplex', 'triplex', 'fourplex', 'multiplex', 'farm', 'rural resid', 'vacant land'];

export function classifyBuildingType(listing: {
  stories?: number | null;
  style?: string | null;
  price?: number | null;
  neighborhood?: string | null;
  propertyType?: string | null;
  source?: 'mls' | 'precon';
}): BuildingType {
  if (listing.source === 'precon') return 'precon';

  const style = listing.style?.toLowerCase() || '';
  const propType = listing.propertyType?.toLowerCase() || '';

  // Loft check
  if (style.includes('loft') || propType.includes('loft')) return 'loft';

  // Luxury check
  if (
    listing.price &&
    listing.price > 2_000_000 &&
    listing.neighborhood &&
    LUXURY_NEIGHBORHOODS.some((n) => listing.neighborhood!.toLowerCase().includes(n))
  ) {
    return 'luxury';
  }

  // Freehold houses → low-rise
  if (FREEHOLD_TYPES.some((t) => propType.includes(t))) return 'low-rise';

  // Condo townhouse → low-rise
  if (propType.includes('condo townhouse') || propType.includes('condo town')) return 'low-rise';

  // Stories-based classification (when available)
  if (listing.stories) {
    if (listing.stories < 5) return 'low-rise';
    if (listing.stories <= 12) return 'mid-rise';
    return 'high-rise';
  }

  // Condo apartment without stories data → mid-rise (most common)
  if (propType.includes('condo') || propType.includes('co-op') || propType.includes('apartment')) return 'mid-rise';

  // Commercial types
  if (propType.includes('commercial') || propType.includes('industrial') || propType.includes('office') || propType.includes('sale of business')) return 'low-rise';

  return 'mid-rise';
}

export interface ListingFilters {
  tab: 'sale' | 'precon' | 'sold' | 'rent';
  // Basic
  priceMin?: number;
  priceMax?: number;
  bedsMin?: number;
  bedsMax?: number;
  bathsMin?: number;
  bathsMax?: number;
  sqftMin?: number;
  sqftMax?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'largest';
  page?: number;
  pageSize?: number;
  // Location
  neighborhood?: string;
  community?: string;
  area?: string;
  municipality?: string;
  streetName?: string;
  streetNumberMin?: number;
  streetNumberMax?: number;
  streetDirection?: string;
  unitNumber?: string;
  // Property
  mlsNumber?: string;
  propertyType?: string[];
  style?: string[];
  class?: string;
  buildingTypes?: BuildingType[];
  // Status
  lastStatus?: string[];
  domMin?: number;
  domMax?: number;
  updatedOnMin?: string;
  updatedOnMax?: string;
  listDateMin?: string;
  listDateMax?: string;
  // Sold-specific
  soldDateMin?: string;
  soldDateMax?: string;
  soldPriceMin?: number;
  soldPriceMax?: number;
  soldDateRange?: string; // '30' | '90' | '180' | '365' | '730' | 'custom'
  // Price & Financials
  maintenanceFeeMax?: number;
  taxMin?: number;
  taxMax?: number;
  priceChangeType?: string;
  // Size & Features
  bedsPlus?: number;
  halfBathMin?: number;
  halfBathMax?: number;
  kitchensMin?: number;
  kitchensMax?: number;
  lotSizeMin?: number;
  lotSizeMax?: number;
  storiesMin?: number;
  storiesMax?: number;
  yearBuiltMin?: number;
  yearBuiltMax?: number;
  // Parking
  parkingMin?: number;
  garageMin?: number;
  garageType?: string[];
  driveway?: string[];
  locker?: string;
  // Features
  basement?: string[];
  heating?: string[];
  exterior?: string[];
  pool?: string[];
  balcony?: string[];
  waterfront?: string;
  den?: string;
  // Open House
  openHouse?: boolean;
  openHouseDateMin?: string;
  openHouseDateMax?: string;
  // Display
  hasImages?: boolean;
  hasAgents?: boolean;
  // Map
  bounds?: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } };
  polygon?: number[][];
  cluster?: boolean;
  // Pre-con specific
  developer?: string;
  occupancyYear?: number;
  // Legacy compat
  parking?: boolean;
}

// Count how many advanced filters are active
export function countAdvancedFilters(f: ListingFilters): number {
  let n = 0;
  if (f.mlsNumber) n++;
  if (f.propertyType?.length) n++;
  if (f.style?.length) n++;
  if (f.class) n++;
  if (f.lastStatus?.length) n++;
  if (f.domMin || f.domMax) n++;
  if (f.updatedOnMin || f.updatedOnMax) n++;
  if (f.listDateMin || f.listDateMax) n++;
  if (f.soldDateMin || f.soldDateMax) n++;
  if (f.soldPriceMin || f.soldPriceMax) n++;
  if (f.maintenanceFeeMax) n++;
  if (f.taxMin || f.taxMax) n++;
  if (f.priceChangeType) n++;
  if (f.bedsPlus) n++;
  if (f.halfBathMin) n++;
  if (f.lotSizeMin || f.lotSizeMax) n++;
  if (f.storiesMin || f.storiesMax) n++;
  if (f.yearBuiltMin || f.yearBuiltMax) n++;
  if (f.parkingMin) n++;
  if (f.garageMin) n++;
  if (f.garageType?.length) n++;
  if (f.basement?.length) n++;
  if (f.heating?.length) n++;
  if (f.pool?.length) n++;
  if (f.waterfront) n++;
  if (f.openHouse) n++;
  if (f.hasImages) n++;
  if (f.streetName) n++;
  if (f.area) n++;
  if (f.municipality) n++;
  return n;
}
