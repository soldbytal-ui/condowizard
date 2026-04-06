import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  // Simple query — no joins, no fancy columns, just what we need
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, slug, latitude, longitude, floors, totalUnits, priceMin, priceMax, status, category, address, estCompletion, description, mainImageUrl, footprint, neighborhoodId')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  if (error) {
    console.error('buildings-geojson error:', error.message);
    return NextResponse.json({ error: error.message, count: 0 }, { status: 500 });
  }

  console.log(`buildings-geojson: ${(projects || []).length} total projects with coords`);

  // Get neighborhoods separately for the join
  const { data: neighborhoods } = await supabase
    .from('neighborhoods')
    .select('id, name, slug');
  const nhLookup: Record<string, { name: string; slug: string }> = {};
  for (const n of neighborhoods || []) {
    nhLookup[n.id] = { name: n.name, slug: n.slug };
  }

  const features = (projects || [])
    .filter((p: any) => p.footprint) // Only include those with footprints
    .map((p: any) => ({
      type: 'Feature' as const,
      geometry: p.footprint,
      properties: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        floors: p.floors || 10,
        totalUnits: p.totalUnits,
        priceMin: p.priceMin,
        priceMax: p.priceMax,
        status: p.status,
        category: p.category,
        address: p.address,
        estCompletion: p.estCompletion,
        description: p.description,
        mainImageUrl: p.mainImageUrl,
        neighborhood: nhLookup[p.neighborhoodId]?.name || null,
        neighborhoodSlug: nhLookup[p.neighborhoodId]?.slug || null,
        latitude: p.latitude,
        longitude: p.longitude,
      },
    }));

  console.log(`buildings-geojson: ${features.length} features with footprints`);

  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features,
  };

  return NextResponse.json(geojson, {
    headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
  });
}
