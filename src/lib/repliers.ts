// Repliers API client for MLS data

const REPLIERS_BASE = 'https://api.repliers.io';
const API_KEY = process.env.REPLIERS_API_KEY || '';

interface RepliersRequestOptions {
  method?: 'GET' | 'POST';
  path: string;
  body?: Record<string, unknown>;
  query?: Record<string, string | number | boolean | undefined>;
  revalidate?: number;
}

export async function repliersRequest<T = unknown>(opts: RepliersRequestOptions): Promise<T> {
  const url = new URL(`${REPLIERS_BASE}${opts.path}`);
  const usePost = opts.method === 'POST';

  // For GET requests: merge query + body into query params (Repliers uses query params)
  // For POST requests (NLP, estimates): send body as JSON
  if (!usePost) {
    const allParams = { ...opts.query, ...opts.body };
    for (const [key, val] of Object.entries(allParams)) {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.set(key, String(val));
      }
    }
  } else if (opts.query) {
    for (const [key, val] of Object.entries(opts.query)) {
      if (val !== undefined && val !== '') {
        url.searchParams.set(key, String(val));
      }
    }
  }

  const fetchOpts: RequestInit & { next?: { revalidate: number } } = {
    method: usePost ? 'POST' : 'GET',
    headers: {
      'REPLIERS-API-KEY': API_KEY,
      ...(usePost && { 'Content-Type': 'application/json' }),
    },
    ...(usePost && opts.body && { body: JSON.stringify(opts.body) }),
    next: { revalidate: opts.revalidate ?? 300 },
  };

  const res = await fetch(url.toString(), fetchOpts);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Repliers API error ${res.status}: ${text}`);
  }

  return res.json();
}

// Repliers response types
export interface RepliersListing {
  mlsNumber: string;
  listPrice: number;
  soldPrice?: number;
  soldDate?: string;
  originalPrice?: number;
  address: {
    streetNumber: string;
    streetName: string;
    streetSuffix: string;
    unitNumber?: string;
    city: string;
    area: string;
    district: string;
    neighborhood: string;
    community?: string;
    communityCode?: string;
    zip: string;
    state: string;
  };
  map: {
    latitude: number;
    longitude: number;
  };
  details: {
    numBedrooms: number;
    numBedroomsPlus?: number;
    numBathrooms: number;
    numParkingSpaces?: number;
    sqft?: string;
    style?: string;
    type?: string;
    propertyType?: string;
    stories?: number;
    yearBuilt?: string;
    maintenanceFee?: string;
    description?: string;
    extras?: string;
  };
  condominium?: {
    fees?: {
      maintenance?: string;
    };
    ammenities?: string[];
    buildingAmenities?: string[];
  };
  images?: string[];
  status: string;
  lastStatus?: string;
  listDate?: string;
  updatedOn?: string;
  daysOnMarket?: number;
  lot?: {
    width?: string;
    depth?: string;
    acres?: string;
  };
  taxes?: {
    annualAmount?: number;
  };
  class?: string;
  type?: string;
  simpleDaysOnMarket?: number;
  boardId?: number;
  comparables?: RepliersListing[];
  history?: RepliersHistoryEntry[];
  [key: string]: unknown;
}

export interface RepliersHistoryEntry {
  mlsNumber: string;
  listDate: string;
  listPrice: number;
  soldDate?: string;
  soldPrice?: number;
  status: string;
  lastStatus?: string;
}

export interface RepliersListingsResponse {
  listings: RepliersListing[];
  count: number;
  numPages: number;
  currentPage: number;
  statistics?: {
    medianPrice?: number;
    averagePrice?: number;
    averageDom?: number;
    totalActive?: number;
    totalSold?: number;
  };
  aggregates?: Record<string, unknown>;
  clusters?: Array<{
    lat: number;
    lng: number;
    count: number;
    bounds: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } };
  }>;
}

export interface RepliersBuilding {
  buildingId: string;
  name: string;
  address: string;
  city: string;
  neighborhood: string;
  lat: number;
  lng: number;
  yearBuilt: number;
  stories: number;
  units: number;
  amenities: string[];
  management: string;
  activeListings: number;
  soldListings: number;
  averagePrice: number;
  averageSqft: number;
  [key: string]: unknown;
}

export interface RepliersLocationSuggestion {
  name: string;
  type: string;
  city?: string;
  area?: string;
  district?: string;
  neighborhood?: string;
  slug?: string;
}

export interface RepliersEstimate {
  estimatedValue: number;
  confidenceScore: number;
  low: number;
  high: number;
  comparables: RepliersListing[];
}
