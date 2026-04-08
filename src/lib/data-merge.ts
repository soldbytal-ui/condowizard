import { UnifiedListing, ListingFilters, classifyBuildingType } from '@/types/listing';
import { RepliersListing, RepliersListingsResponse, repliersRequest } from './repliers';
import { supabase } from './supabase';
import { formatPrice } from './utils';

// Map a Repliers MLS listing to UnifiedListing
export function mapMLSToUnified(listing: RepliersListing): UnifiedListing {
  const addr = listing.address;
  const det = listing.details;
  const fullAddress = [addr.streetNumber, addr.streetName, addr.streetSuffix, addr.unitNumber ? `#${addr.unitNumber}` : '']
    .filter(Boolean)
    .join(' ')
    .trim();

  const price = listing.soldPrice || listing.listPrice;
  const stories = det.stories || null;
  const neighborhood = addr.neighborhood || addr.district || addr.area || '';

  return {
    id: listing.mlsNumber,
    source: 'mls',
    address: fullAddress,
    city: addr.city || 'Toronto',
    neighborhood,
    community: addr.communityCode || addr.community || '',
    lat: listing.map.latitude,
    lng: listing.map.longitude,
    price,
    priceDisplay: `$${price.toLocaleString()}`,
    beds: det.numBedrooms + (det.numBedroomsPlus || 0),
    baths: det.numBathrooms,
    sqft: det.sqft || '',
    propertyType: det.propertyType || det.type || 'Condo Apt',
    buildingType: classifyBuildingType({
      stories,
      style: det.style,
      price,
      neighborhood,
      source: 'mls',
    }),
    status: listing.lastStatus || listing.status,
    dom: listing.daysOnMarket || 0,
    images: listing.images || [],
    maintenanceFee: det.maintenanceFee ? parseFloat(det.maintenanceFee) : null,
    yearBuilt: det.yearBuilt ? parseInt(det.yearBuilt) : null,
    developer: null,
    occupancy: null,
    description: det.description || '',
    features: listing.condominium?.ammenities || [],
    slug: listing.mlsNumber,
    mlsNumber: listing.mlsNumber,
    estimatedValue: null,
    listDate: listing.listDate || '',
    updatedAt: listing.updatedOn || '',
    parking: det.numParkingSpaces || null,
    stories,
    lotSize: listing.lot?.acres || listing.lot?.width ? `${listing.lot.width} x ${listing.lot.depth}` : null,
    taxes: listing.taxes?.annualAmount || null,
    soldPrice: listing.soldPrice || null,
    soldDate: listing.soldDate || null,
    originalPrice: listing.originalPrice || null,
  };
}

// Map a Supabase pre-con project to UnifiedListing
export function mapPreconToUnified(project: Record<string, unknown>): UnifiedListing {
  const priceFrom = project.price_from as number | null;
  const priceTo = project.price_to as number | null;
  const price = priceFrom || priceTo || 0;

  return {
    id: project.id as string,
    source: 'precon',
    address: (project.address as string) || (project.name as string) || '',
    city: (project.city as string) || 'Toronto',
    neighborhood: (project.neighborhood as string) || '',
    community: (project.community as string) || '',
    lat: (project.lat as number) || 0,
    lng: (project.lng as number) || 0,
    price,
    priceDisplay: priceFrom ? `From ${formatPrice(priceFrom)}` : 'Contact for pricing',
    beds: (project.beds_from as number) || 0,
    baths: (project.baths_from as number) || 0,
    sqft: project.sqft_from && project.sqft_to ? `${project.sqft_from}-${project.sqft_to}` : (project.sqft_from as string) || '',
    propertyType: (project.building_type as string) || 'Condo',
    buildingType: 'precon',
    status: (project.status as string) || 'Selling',
    dom: 0,
    images: (project.images as string[]) || [],
    maintenanceFee: null,
    yearBuilt: null,
    developer: (project.developer as string) || null,
    occupancy: project.occupancy_year ? `${project.occupancy_year}${project.occupancy_quarter ? ' ' + project.occupancy_quarter : ''}` : null,
    description: (project.description as string) || '',
    features: (project.amenities as string[]) || [],
    slug: (project.slug as string) || '',
    mlsNumber: null,
    estimatedValue: null,
    listDate: (project.created_at as string) || '',
    updatedAt: (project.updated_at as string) || '',
    parking: null,
    stories: (project.floors as number) || null,
    lotSize: null,
    taxes: null,
    soldPrice: null,
    soldDate: null,
    originalPrice: null,
  };
}

// Build Repliers API params from our unified filter format
function buildRepliersParams(filters: ListingFilters): Record<string, string | number | boolean | undefined> {
  const params: Record<string, string | number | boolean | undefined> = {
    city: 'Toronto',
    resultsPerPage: filters.pageSize || 24,
    pageNum: filters.page || 1,
  };

  // Tab determines status/type
  if (filters.tab === 'sale') {
    params.status = 'A';
    params.type = 'sale';
  } else if (filters.tab === 'sold') {
    params.status = 'U';
    params.lastStatus = 'Sld';
  } else if (filters.tab === 'rent') {
    params.status = 'A';
    params.type = 'lease';
  }

  // Sort
  switch (filters.sortBy) {
    case 'newest': params.sortBy = 'updatedOnDesc'; break;
    case 'price_asc': params.sortBy = 'listPriceAsc'; break;
    case 'price_desc': params.sortBy = 'listPriceDesc'; break;
    case 'largest': params.sortBy = 'sqftDesc'; break;
    default: params.sortBy = 'updatedOnDesc';
  }

  // Price range
  if (filters.priceMin) params.minPrice = filters.priceMin;
  if (filters.priceMax) params.maxPrice = filters.priceMax;

  // Beds/baths
  if (filters.bedsMin) params.minBeds = filters.bedsMin;
  if (filters.bathsMin) params.minBaths = filters.bathsMin;

  // Sqft
  if (filters.sqftMin) params.minSqft = filters.sqftMin;
  if (filters.sqftMax) params.maxSqft = filters.sqftMax;

  // DOM
  if (filters.domMax) params.maxDom = filters.domMax;

  // Neighborhood/community
  if (filters.neighborhood) params.neighborhood = filters.neighborhood;
  if (filters.community) params.area = filters.community;

  // Clustering for map
  if (filters.cluster) params.cluster = true;

  return params;
}

// Fetch MLS listings from Repliers
export async function fetchMLSListings(filters: ListingFilters): Promise<{
  listings: UnifiedListing[];
  total: number;
  statistics?: RepliersListingsResponse['statistics'];
}> {
  const params = buildRepliersParams(filters);

  const body: Record<string, unknown> = { ...params };

  // Add map bounds if present
  if (filters.bounds) {
    body.map = JSON.stringify({
      type: 'Polygon',
      coordinates: [[
        [filters.bounds.sw.lng, filters.bounds.ne.lat],
        [filters.bounds.ne.lng, filters.bounds.ne.lat],
        [filters.bounds.ne.lng, filters.bounds.sw.lat],
        [filters.bounds.sw.lng, filters.bounds.sw.lat],
        [filters.bounds.sw.lng, filters.bounds.ne.lat],
      ]],
    });
  }

  if (filters.polygon) {
    body.map = JSON.stringify({
      type: 'Polygon',
      coordinates: [filters.polygon],
    });
  }

  const data = await repliersRequest<RepliersListingsResponse>({
    method: 'POST',
    path: '/listings',
    body,
    revalidate: 300,
  });

  return {
    listings: data.listings.map(mapMLSToUnified),
    total: data.count,
    statistics: data.statistics,
  };
}

// Fetch pre-construction listings from Supabase
export async function fetchPreconListings(filters: ListingFilters): Promise<{
  listings: UnifiedListing[];
  total: number;
}> {
  let query = supabase
    .from('precon_projects')
    .select('*', { count: 'exact' })
    .eq('is_published', true);

  if (filters.priceMin) query = query.gte('price_from', filters.priceMin);
  if (filters.priceMax) query = query.lte('price_from', filters.priceMax);
  if (filters.bedsMin) query = query.gte('beds_to', filters.bedsMin);
  if (filters.bathsMin) query = query.gte('baths_to', filters.bathsMin);
  if (filters.neighborhood) query = query.ilike('neighborhood', `%${filters.neighborhood}%`);
  if (filters.community) query = query.eq('community', filters.community);
  if (filters.developer) query = query.ilike('developer', `%${filters.developer}%`);
  if (filters.occupancyYear) query = query.eq('occupancy_year', filters.occupancyYear);

  // Sort
  switch (filters.sortBy) {
    case 'price_asc': query = query.order('price_from', { ascending: true }); break;
    case 'price_desc': query = query.order('price_from', { ascending: false }); break;
    case 'largest': query = query.order('sqft_to', { ascending: false }); break;
    default: query = query.order('updated_at', { ascending: false });
  }

  const pageSize = filters.pageSize || 24;
  const page = filters.page || 1;
  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error('Supabase precon query error:', error);
    return { listings: [], total: 0 };
  }

  return {
    listings: (data || []).map(mapPreconToUnified),
    total: count || 0,
  };
}

// Fetch all listings merged from both sources
export async function fetchAllListings(filters: ListingFilters): Promise<{
  listings: UnifiedListing[];
  total: number;
  statistics?: RepliersListingsResponse['statistics'];
}> {
  // Pre-con tab only uses Supabase
  if (filters.tab === 'precon') {
    return fetchPreconListings(filters);
  }

  // Sale tab merges both, sold/rent only uses MLS
  if (filters.tab === 'sold' || filters.tab === 'rent') {
    return fetchMLSListings(filters);
  }

  // For sale: fetch both in parallel and merge
  const [mls, precon] = await Promise.all([
    fetchMLSListings(filters),
    fetchPreconListings(filters),
  ]);

  // Interleave: MLS first, then precon appended at end of each page
  const merged = [...mls.listings, ...precon.listings];

  // Re-sort the merged list
  merged.sort((a, b) => {
    switch (filters.sortBy) {
      case 'price_asc': return a.price - b.price;
      case 'price_desc': return b.price - a.price;
      case 'largest': return parseInt(b.sqft || '0') - parseInt(a.sqft || '0');
      default: return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });

  return {
    listings: merged,
    total: mls.total + precon.total,
    statistics: mls.statistics,
  };
}
