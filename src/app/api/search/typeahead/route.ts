import { NextRequest, NextResponse } from 'next/server';
import { repliersRequest, type RepliersListingsResponse } from '@/lib/repliers';
import { supabase } from '@/lib/supabase';
import { mapHomeListing } from '@/lib/homepage-data';
import { torontoTodayISO } from '@/lib/toronto-time';

// Typeahead UI aggregator. Does not introduce a new data feed —
// it just fans out to the existing Repliers and Supabase sources
// the site already uses and normalises the response.

const SECTION_LIMIT = 6;

type Tab = 'sale' | 'rent' | 'sold' | 'precon';

function tabToStatus(tab: Tab): { status: string; type?: string; lastStatus?: string; sortBy: string } {
  switch (tab) {
    case 'rent':
      return { status: 'A', type: 'lease', sortBy: 'updatedOnDesc' };
    case 'sold':
      return { status: 'U', type: 'sale', lastStatus: 'Sld', sortBy: 'soldDateDesc' };
    case 'precon':
    case 'sale':
    default:
      return { status: 'A', type: 'sale', sortBy: 'updatedOnDesc' };
  }
}

async function fetchListings(q: string, tab: Tab) {
  const params = tabToStatus(tab);
  try {
    const body: Record<string, unknown> = {
      city: 'Toronto',
      status: params.status,
      sortBy: params.sortBy,
      resultsPerPage: SECTION_LIMIT,
      hasImages: true,
      search: q,
    };
    if (params.type) body.type = params.type;
    if (params.lastStatus) body.lastStatus = params.lastStatus;

    const data = await repliersRequest<RepliersListingsResponse>({
      path: '/listings',
      body,
      revalidate: 60,
    });
    const listings = (data.listings || []).map(mapHomeListing);
    return { items: listings, total: data.count ?? listings.length };
  } catch {
    return { items: [], total: 0 };
  }
}

async function fetchLocations(q: string) {
  try {
    const data = await repliersRequest<any>({
      path: '/locations/autocomplete',
      query: { search: q, city: 'Toronto' },
      revalidate: 3600,
    });
    return data?.locations || [];
  } catch {
    return [];
  }
}

async function fetchProjects(q: string) {
  try {
    const { data } = await supabase
      .from('projects')
      .select('id, slug, name, mainImageUrl, priceMin, priceMax, status, estCompletion, neighborhood:neighborhoods(name), developer:developers(name)')
      .ilike('name', `%${q}%`)
      .neq('status', 'ARCHIVED')
      .limit(SECTION_LIMIT + 1);
    return (data || []).map((p: any) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      mainImageUrl: p.mainImageUrl,
      priceMin: p.priceMin,
      priceMax: p.priceMax,
      status: p.status,
      estCompletion: p.estCompletion,
      neighborhoodName: p.neighborhood?.name || null,
      developerName: p.developer?.name || null,
    }));
  } catch {
    return [];
  }
}

async function fetchDevelopers(q: string) {
  try {
    const { data } = await supabase
      .from('developers')
      .select('id, slug, name, logoUrl')
      .ilike('name', `%${q}%`)
      .limit(SECTION_LIMIT + 1);
    return (data || []).map((d: any) => ({
      id: d.id,
      slug: d.slug,
      name: d.name,
      logoUrl: d.logoUrl,
    }));
  } catch {
    return [];
  }
}

async function fetchSupabaseNeighborhoods(q: string) {
  try {
    const { data } = await supabase
      .from('neighborhoods')
      .select('slug, name')
      .ilike('name', `%${q}%`)
      .limit(SECTION_LIMIT + 1);
    return (data || []) as Array<{ slug: string; name: string }>;
  } catch {
    return [];
  }
}

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const tabRaw = (searchParams.get('tab') || 'sale') as Tab;
  const tab: Tab = ['sale', 'rent', 'sold', 'precon'].includes(tabRaw) ? tabRaw : 'sale';

  if (q.length < 2) {
    return NextResponse.json({
      query: q,
      listings: [], neighbourhoods: [], buildings: [], projects: [], developers: [],
      hasMore: { listings: false, neighbourhoods: false, buildings: false, projects: false, developers: false },
    });
  }

  const today = torontoTodayISO();

  const [listings, locations, projects, developers, hoodRows] = await Promise.all([
    fetchListings(q, tab),
    fetchLocations(q),
    tab === 'sold' || tab === 'rent' ? Promise.resolve([]) : fetchProjects(q),
    tab === 'sold' || tab === 'rent' ? Promise.resolve([]) : fetchDevelopers(q),
    fetchSupabaseNeighborhoods(q),
  ]);

  // Locations from Repliers → split into neighbourhoods and buildings.
  // Repliers' /locations/autocomplete returns a broad list, so post-filter
  // by whether the name actually contains the query (case-insensitive).
  const qLower = q.toLowerCase();
  const supabaseHoodByName = new Map(hoodRows.map((r) => [r.name.toLowerCase(), r.slug]));
  const seenHoods = new Set<string>();
  const neighbourhoods: Array<{ name: string; slug: string; city: string }> = [];
  const buildings: Array<{ name: string; city: string; neighborhood: string }> = [];

  for (const loc of locations) {
    const type = String(loc?.type || '').toLowerCase();
    const name = String(loc?.name || '').trim();
    const city = String(loc?.address?.city || 'Toronto');
    const neighborhood = String(loc?.address?.neighborhood || '');

    if (!name) continue;
    if (!name.toLowerCase().includes(qLower)) continue;

    if (type === 'neighborhood' || type === 'area' || type === 'community') {
      const key = name.toLowerCase();
      if (seenHoods.has(key)) continue;
      seenHoods.add(key);
      const slug = supabaseHoodByName.get(key) || slugifyName(name);
      neighbourhoods.push({ name, slug, city });
    } else if (type === 'building' || type === 'condo' || type === 'condominium') {
      buildings.push({ name, city, neighborhood });
    }
  }

  // Include Supabase-only hood matches (e.g. our editorial slugs not in Repliers).
  for (const r of hoodRows) {
    const key = r.name.toLowerCase();
    if (seenHoods.has(key)) continue;
    seenHoods.add(key);
    neighbourhoods.push({ name: r.name, slug: r.slug, city: 'Toronto' });
  }

  const listingsList = listings.items.slice(0, SECTION_LIMIT).map((l) => ({
    mlsNumber: l.mlsNumber,
    address: l.address,
    neighborhood: l.neighborhood,
    city: l.city,
    price: l.price,
    soldPrice: l.soldPrice,
    beds: l.beds,
    bedsPlus: l.bedsPlus,
    baths: l.baths,
    sqft: l.sqft,
    propertyType: l.propertyType,
    image: l.image,
    daysOnMarket: l.daysOnMarket,
    listDate: l.listDate,
    isNewToday: !!(l.listDate && String(l.listDate).slice(0, 10) === today),
    href: l.href,
  }));

  return NextResponse.json({
    query: q,
    tab,
    listings: listingsList,
    neighbourhoods: neighbourhoods.slice(0, SECTION_LIMIT),
    buildings: buildings.slice(0, SECTION_LIMIT),
    projects: projects.slice(0, SECTION_LIMIT),
    developers: developers.slice(0, SECTION_LIMIT),
    hasMore: {
      listings: listings.total > SECTION_LIMIT,
      neighbourhoods: neighbourhoods.length > SECTION_LIMIT,
      buildings: buildings.length > SECTION_LIMIT,
      projects: projects.length > SECTION_LIMIT,
      developers: developers.length > SECTION_LIMIT,
    },
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
    },
  });
}
