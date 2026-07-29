import { repliersRequest, type RepliersListing, type RepliersListingsResponse } from '@/lib/repliers';
import { torontoTodayISO } from '@/lib/toronto-time';

export interface HomeListing {
  mlsNumber: string;
  address: string;
  neighborhood: string;
  city: string;
  price: number | null;
  originalPrice: number | null;
  soldPrice: number | null;
  soldDate: string | null;
  listDate: string | null;
  updatedOn: string | null;
  beds: number | null;
  bedsPlus: number | null;
  baths: number | null;
  sqft: string | null;
  propertyType: string | null;
  className: string | null;
  parking: number | null;
  image: string | null;
  daysOnMarket: number | null;
  href: string;
}

function normalizeImage(img?: string): string | null {
  if (!img) return null;
  return img.startsWith('http') ? img : `https://cdn.repliers.io/${img}`;
}

function firstImage(listing: RepliersListing): string | null {
  const list = listing.images || [];
  for (const img of list) {
    const url = normalizeImage(img);
    if (url) return url;
  }
  return null;
}

function joinAddress(listing: RepliersListing): string {
  const a = listing.address || ({} as RepliersListing['address']);
  const parts = [a.streetNumber, a.streetName, a.streetSuffix].filter(Boolean).join(' ').trim();
  const unit = a.unitNumber ? `#${a.unitNumber} · ` : '';
  return `${unit}${parts}`.trim();
}

function pickNeighborhood(listing: RepliersListing): string {
  const a = listing.address;
  return a?.neighborhood || a?.community || a?.district || a?.area || '';
}

export function mapHomeListing(listing: RepliersListing): HomeListing {
  const det = listing.details || ({} as RepliersListing['details']);
  return {
    mlsNumber: listing.mlsNumber,
    address: joinAddress(listing),
    neighborhood: pickNeighborhood(listing),
    city: listing.address?.city || 'Toronto',
    price: listing.listPrice ? Number(listing.listPrice) : null,
    originalPrice: listing.originalPrice ? Number(listing.originalPrice) : null,
    soldPrice: listing.soldPrice ? Number(listing.soldPrice) : null,
    soldDate: listing.soldDate ? String(listing.soldDate) : null,
    listDate: listing.listDate ? String(listing.listDate) : null,
    updatedOn: listing.updatedOn ? String(listing.updatedOn) : null,
    beds: det?.numBedrooms != null ? Number(det.numBedrooms) : null,
    bedsPlus: det?.numBedroomsPlus != null ? Number(det.numBedroomsPlus) : null,
    baths: det?.numBathrooms != null ? Number(det.numBathrooms) : null,
    sqft: det?.sqft || null,
    propertyType: det?.propertyType || det?.type || (listing.type as string) || null,
    className: (listing.class as string) || null,
    parking: det?.numParkingSpaces != null ? Number(det.numParkingSpaces) : null,
    image: firstImage(listing),
    daysOnMarket: listing.daysOnMarket != null ? Number(listing.daysOnMarket) : null,
    href: `/listing/${listing.mlsNumber}`,
  };
}

// New Toronto listings entered today (America/Toronto), active sale only.
// Repliers exposes `listDate` on each listing. Rather than trust
// `daysOnMarket === 0`, we bracket by minListDate to be explicit.
export async function fetchNewTodayListings(limit = 8): Promise<HomeListing[]> {
  const today = torontoTodayISO();
  try {
    const data = await repliersRequest<RepliersListingsResponse>({
      path: '/listings',
      body: {
        city: 'Toronto',
        status: 'A',
        type: 'sale',
        minListDate: today,
        sortBy: 'createdOnDesc',
        resultsPerPage: Math.max(limit * 2, 16),
        hasImages: true,
      },
      revalidate: 300,
    });
    const raw = data.listings || [];
    // Dedup by MLS number in case an inappropriate relist surfaces twice.
    const seen = new Set<string>();
    const out: HomeListing[] = [];
    for (const l of raw) {
      if (!l.mlsNumber || seen.has(l.mlsNumber)) continue;
      // Extra safety: confirm listDate really is today in Toronto
      const listDay = l.listDate ? String(l.listDate).slice(0, 10) : null;
      if (listDay && listDay !== today) continue;
      seen.add(l.mlsNumber);
      out.push(mapHomeListing(l));
      if (out.length >= limit) break;
    }
    return out;
  } catch (err) {
    console.error('[homepage-data] fetchNewTodayListings error:', err);
    return [];
  }
}

export async function fetchRecentSolds(limit = 6): Promise<HomeListing[]> {
  try {
    const data = await repliersRequest<RepliersListingsResponse>({
      path: '/listings',
      body: {
        city: 'Toronto',
        status: 'U',
        lastStatus: 'Sld',
        type: 'sale',
        sortBy: 'soldDateDesc',
        resultsPerPage: Math.max(limit * 2, 12),
        hasImages: true,
      },
      revalidate: 900,
    });
    const raw = data.listings || [];
    const seen = new Set<string>();
    const out: HomeListing[] = [];
    for (const l of raw) {
      if (!l.mlsNumber || seen.has(l.mlsNumber)) continue;
      seen.add(l.mlsNumber);
      out.push(mapHomeListing(l));
      if (out.length >= limit) break;
    }
    return out;
  } catch (err) {
    console.error('[homepage-data] fetchRecentSolds error:', err);
    return [];
  }
}

// Live count of neighbourhood active listings — used for hood cards.
export async function fetchNeighborhoodStat(neighborhoodName: string): Promise<{
  active: number;
  medianPrice: number | null;
}> {
  try {
    const data = await repliersRequest<any>({
      path: '/listings',
      body: {
        city: 'Toronto',
        neighborhood: neighborhoodName,
        status: 'A',
        type: 'sale',
        resultsPerPage: 1,
        statistics: 'med-listPrice,cnt-available',
      },
      revalidate: 900,
    });
    const stats = data?.statistics || {};
    return {
      active: data?.count ?? 0,
      medianPrice: stats?.listPrice?.med ?? null,
    };
  } catch (err) {
    console.error(`[homepage-data] fetchNeighborhoodStat(${neighborhoodName}) error:`, err);
    return { active: 0, medianPrice: null };
  }
}
