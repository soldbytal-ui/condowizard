import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type AmenitiesLike = string[] | Record<string, unknown> | null | undefined;

function normalizeAmenities(value: AmenitiesLike): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((x): x is string => typeof x === 'string');
  if (typeof value === 'object') {
    return Object.keys(value).filter((k) => (value as Record<string, unknown>)[k]);
  }
  return [];
}

function normalizeImage(images: unknown, mainImageUrl: string | null): string {
  if (mainImageUrl) return mainImageUrl;
  if (Array.isArray(images) && images.length > 0 && typeof images[0] === 'string') {
    return images[0] as string;
  }
  return '';
}

function priceRange(min: number | null, max: number | null): string {
  if (min && max) return `$${(min / 1000).toFixed(0)}K – $${(max / 1000).toFixed(0)}K`;
  if (min) return `From $${(min / 1000).toFixed(0)}K`;
  if (max) return `Up to $${(max / 1000).toFixed(0)}K`;
  return 'Contact for pricing';
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      where: { status: { not: 'COMPLETED' } },
      include: { neighborhood: true, developer: true },
      orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
    });

    const shaped = projects.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      neighborhood: p.neighborhood?.name || '—',
      developer: p.developer?.name || '—',
      price: priceRange(p.priceMin, p.priceMax),
      completion: p.estCompletion || 'TBD',
      floors: p.floors ?? null,
      units: p.totalUnits ?? null,
      amenities: normalizeAmenities(p.amenities as AmenitiesLike),
      status: p.status,
      image: normalizeImage(p.images, p.mainImageUrl),
    }));

    return NextResponse.json({ projects: shaped });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ projects: [], error: message }, { status: 200 });
  }
}
