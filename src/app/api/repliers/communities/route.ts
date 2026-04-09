import { NextResponse } from 'next/server';
import { repliersRequest } from '@/lib/repliers';

// Cached in-memory — boundaries never change
let cachedBoundaries: any[] | null = null;

// All GTA regions to fetch
const REGIONS = [
  { city: 'Toronto' },
  { area: 'York' },
  { area: 'Peel' },
  { area: 'Durham' },
  { area: 'Halton' },
  { city: 'Hamilton' },
  { area: 'Simcoe' },
];

async function fetchRegionBoundaries(query: Record<string, string>): Promise<any[]> {
  const results: any[] = [];
  for (let page = 1; page <= 5; page++) {
    try {
      const data = await repliersRequest<any>({
        path: '/locations',
        query: { ...query, boardId: '91', pageNum: String(page), resultsPerPage: '100' },
        revalidate: 86400,
      });
      for (const loc of data.locations || []) {
        if (loc.map?.boundary) {
          results.push({
            name: loc.name,
            type: loc.type,
            locationId: loc.locationId,
            area: loc.address?.area || '',
            city: loc.address?.city || '',
            boundary: loc.map.boundary,
            lat: parseFloat(loc.map.latitude),
            lng: parseFloat(loc.map.longitude),
          });
        }
      }
      if (page >= (data.numPages || 1)) break;
    } catch (err) {
      console.error(`[Communities] Error fetching ${JSON.stringify(query)} page ${page}:`, err);
      break;
    }
  }
  return results;
}

export async function GET() {
  try {
    if (cachedBoundaries) {
      return NextResponse.json({ locations: cachedBoundaries });
    }

    // Fetch all regions in parallel
    const regionResults = await Promise.all(
      REGIONS.map((q) => fetchRegionBoundaries(q))
    );

    // Merge and deduplicate by locationId
    const seen = new Set<string>();
    const all: any[] = [];
    for (const results of regionResults) {
      for (const loc of results) {
        const key = loc.locationId || `${loc.name}-${loc.city}`;
        if (!seen.has(key)) {
          seen.add(key);
          all.push(loc);
        }
      }
    }

    cachedBoundaries = all;
    console.log(`[Communities] Loaded ${all.length} GTA neighbourhood boundaries across ${REGIONS.length} regions`);

    return NextResponse.json({ locations: all });
  } catch (error) {
    console.error('Communities API error:', error);
    return NextResponse.json({ error: 'Failed to load communities', locations: [] }, { status: 500 });
  }
}
