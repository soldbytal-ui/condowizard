import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type AmenitiesLike = string[] | Record<string, unknown> | null | undefined;

function normalizeAmenities(value: AmenitiesLike): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((x) => (typeof x === 'string' ? x : typeof x === 'object' && x && 'name' in x ? String((x as { name: unknown }).name) : ''))
      .filter(Boolean);
  }
  if (typeof value === 'object') {
    return Object.keys(value).filter((k) => (value as Record<string, unknown>)[k]);
  }
  return [];
}

/**
 * Project.images in the schema is `Json?`. In practice the field has been
 * populated in a few different shapes across seed + enrichment scripts:
 *   - string[]                             — array of URLs
 *   - Array<{ url: string, caption? }>    — array of objects with a url key
 *   - string                               — a single URL stuffed in as JSON string
 * Normalize to string[].
 */
function normalizeImages(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const o = item as Record<string, unknown>;
          if (typeof o.url === 'string') return o.url;
          if (typeof o.src === 'string') return o.src;
          if (typeof o.image === 'string') return o.image;
        }
        return '';
      })
      .filter(Boolean);
  }
  return [];
}

function pickImage(images: string[], mainImageUrl: string | null): string {
  if (mainImageUrl) return mainImageUrl;
  return images[0] || '';
}

function priceRange(min: number | null, max: number | null): string {
  if (min && max) return `$${(min / 1000).toFixed(0)}K – $${(max / 1000).toFixed(0)}K`;
  if (min) return `From $${(min / 1000).toFixed(0)}K`;
  if (max) return `Up to $${(max / 1000).toFixed(0)}K`;
  return 'Contact for pricing';
}

function prettyCategory(c: string | null): string {
  if (!c) return '';
  return c
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ─────────────────────────────────────────────────────────────
// 12 fallback projects covering different neighborhoods — used
// when Prisma isn't reachable or the projects table is empty.
// ─────────────────────────────────────────────────────────────
const FALLBACK_PROJECTS = [
  { id: 'fb-king',       name: 'KING Toronto',       slug: 'king-toronto',       neighborhood: 'King West',         developer: 'Westbank',          price: '$900K – $3.2M',  completion: '2027', floors: 16, units: 514, amenities: ['Rooftop garden', 'Fitness centre', 'Co-working lounge'], status: 'PRE_CONSTRUCTION',     image: '', images: [] as string[], description: 'Iconic BIG-designed terraced towers in the heart of King West.',     buildingType: 'Luxury Branded' },
  { id: 'fb-walmer',     name: '429 Walmer',         slug: '429-walmer',         neighborhood: 'Forest Hill',       developer: 'Camrost Felcorp',   price: '$1.4M – $4.8M',  completion: '2026', floors: 12, units: 88,  amenities: ['Concierge', 'Private dining', 'Wellness spa'],          status: 'UNDER_CONSTRUCTION',   image: '', images: [],                 description: 'Boutique Forest Hill residences with private elevator access.',       buildingType: 'Luxury' },
  { id: 'fb-bellwoods',  name: 'Bellwoods House',    slug: 'bellwoods-house',    neighborhood: 'Trinity Bellwoods', developer: 'Curated Properties',price: '$750K – $2.1M',  completion: '2028', floors: 8,  units: 64,  amenities: ['Park-view terrace', 'Library', 'Pet spa'],               status: 'PRE_LAUNCH',           image: '', images: [],                 description: 'Park-facing boutique condo across from Trinity Bellwoods.',            buildingType: 'Premium' },
  { id: 'fb-rosedale',   name: 'Rosedale on Bloor',  slug: 'rosedale-on-bloor',  neighborhood: 'Yorkville',         developer: 'Easton',            price: '$1.1M – $5.6M',  completion: '2027', floors: 38, units: 412, amenities: ['Sky lounge', 'Pool', 'Valet'],                            status: 'PRE_CONSTRUCTION',     image: '', images: [],                 description: 'Luxury Yorkville tower with a dramatic rooftop infinity pool.',        buildingType: 'Ultra Luxury' },
  { id: 'fb-junction',   name: 'Junction House',     slug: 'junction-house',     neighborhood: 'The Junction',      developer: 'Slate Asset',       price: '$620K – $1.4M',  completion: '2026', floors: 9,  units: 148, amenities: ['Bike room', 'Landscaped courtyard'],                     status: 'NEAR_COMPLETION',      image: '', images: [],                 description: 'Mid-rise condo tucked into the rejuvenated Junction neighbourhood.',   buildingType: 'Premium' },
  { id: 'fb-leslie',     name: 'Leslieville Lofts',  slug: 'leslieville-lofts',  neighborhood: 'Leslieville',       developer: 'Streetcar',         price: '$580K – $1.9M',  completion: '2028', floors: 11, units: 196, amenities: ['Dog run', 'Gym', 'Maker space'],                         status: 'PRE_LAUNCH',           image: '', images: [],                 description: 'Brick-and-beam inspired lofts steps from Queen East.',                  buildingType: 'Affordable Luxury' },
  { id: 'fb-distillery', name: 'Distillery Commons', slug: 'distillery-commons', neighborhood: 'Distillery District',developer: 'Cityzen',           price: '$690K – $2.3M',  completion: '2027', floors: 22, units: 288, amenities: ['Cobblestone courtyard', 'Gallery lounge'],                status: 'PRE_CONSTRUCTION',     image: '', images: [],                 description: 'Heritage-inspired tower anchoring the Distillery District expansion.', buildingType: 'Luxury' },
  { id: 'fb-liberty',    name: 'Liberty Central',    slug: 'liberty-central',    neighborhood: 'Liberty Village',   developer: 'CanAlfa',           price: '$540K – $1.3M',  completion: '2026', floors: 18, units: 354, amenities: ['Gym', 'Co-working', 'Rooftop BBQ'],                      status: 'UNDER_CONSTRUCTION',   image: '', images: [],                 description: 'Tech-forward condo at the heart of Liberty Village.',                   buildingType: 'Premium' },
  { id: 'fb-harbour',    name: 'Harbourfront 88',    slug: 'harbourfront-88',    neighborhood: 'Harbourfront',      developer: 'Menkes',            price: '$820K – $4.1M',  completion: '2028', floors: 42, units: 598, amenities: ['Lakeside promenade', 'Pool', 'Yacht club'],              status: 'PRE_CONSTRUCTION',     image: '', images: [],                 description: 'Waterfront skyscraper with unobstructed lake and skyline views.',       buildingType: 'Ultra Luxury' },
  { id: 'fb-stclair',    name: 'The St. Clair',      slug: 'the-st-clair',       neighborhood: 'Forest Hill South', developer: 'Tridel',            price: '$690K – $2.8M',  completion: '2027', floors: 14, units: 198, amenities: ['Concierge', 'Library', 'Yoga studio'],                   status: 'PRE_LAUNCH',           image: '', images: [],                 description: 'Understated luxury on St. Clair with a refined residential feel.',      buildingType: 'Luxury' },
  { id: 'fb-annex',      name: 'Annex Residences',   slug: 'annex-residences',   neighborhood: 'The Annex',         developer: 'Collecdev',         price: '$710K – $2.2M',  completion: '2026', floors: 13, units: 172, amenities: ['Courtyard garden', 'Library lounge'],                     status: 'NEAR_COMPLETION',      image: '', images: [],                 description: 'Intimate mid-rise amongst the Annex\u2019s Victorian streetscape.',     buildingType: 'Premium' },
  { id: 'fb-queen',      name: 'Queen & Portland',   slug: 'queen-portland',     neighborhood: 'Queen West',        developer: 'Lamb Dev Corp',     price: '$590K – $1.7M',  completion: '2027', floors: 17, units: 266, amenities: ['Rooftop bar', 'Sound studio', 'Co-working'],              status: 'PRE_CONSTRUCTION',     image: '', images: [],                 description: 'Creative-class tower at Queen and Portland.',                           buildingType: 'Premium' },
];

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: { neighborhood: true, developer: true },
      orderBy: { name: 'asc' },
    });

    if (projects.length === 0) {
      return NextResponse.json({ projects: FALLBACK_PROJECTS, source: 'fallback' });
    }

    const shaped = projects.map((p) => {
      const images = normalizeImages(p.images);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        neighborhood: p.neighborhood?.name || '—',
        developer: p.developer?.name || '—',
        price: priceRange(p.priceMin, p.priceMax),
        priceMin: p.priceMin,
        priceMax: p.priceMax,
        completion: p.estCompletion || 'TBD',
        floors: p.floors ?? null,
        units: p.totalUnits ?? null,
        amenities: normalizeAmenities(p.amenities as AmenitiesLike),
        description: p.description || '',
        buildingType: prettyCategory(p.category),
        status: p.status,
        featured: p.featured,
        image: pickImage(images, p.mainImageUrl),
        images,
      };
    });

    return NextResponse.json({ projects: shaped, source: 'db' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { projects: FALLBACK_PROJECTS, source: 'fallback', error: message },
      { status: 200 }
    );
  }
}
