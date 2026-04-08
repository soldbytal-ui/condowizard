import { NextResponse } from 'next/server';
import { repliersRequest } from '@/lib/repliers';

// Cached in-memory for the process lifetime (boundaries never change)
let cachedBoundaries: any[] | null = null;

export async function GET() {
  try {
    if (cachedBoundaries) {
      return NextResponse.json({ locations: cachedBoundaries });
    }

    const all: any[] = [];
    for (let page = 1; page <= 5; page++) {
      const data = await repliersRequest<any>({
        path: '/locations',
        query: {
          city: 'Toronto',
          pageNum: String(page),
          resultsPerPage: '100',
        },
        revalidate: 86400,
      });
      const locs = data.locations || [];
      for (const loc of locs) {
        if (loc.map?.boundary) {
          all.push({
            name: loc.name,
            type: loc.type,
            locationId: loc.locationId,
            area: loc.address?.area,
            boundary: loc.map.boundary,
            lat: parseFloat(loc.map.latitude),
            lng: parseFloat(loc.map.longitude),
          });
        }
      }
      if (page >= (data.numPages || 1)) break;
    }

    cachedBoundaries = all;
    console.log(`[Communities] Loaded ${all.length} neighbourhood boundaries`);

    return NextResponse.json({ locations: all });
  } catch (error) {
    console.error('Communities API error:', error);
    return NextResponse.json({ error: 'Failed to load communities', locations: [] }, { status: 500 });
  }
}
