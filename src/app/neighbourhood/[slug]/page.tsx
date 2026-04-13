import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { repliersRequest, RepliersListingsResponse } from '@/lib/repliers';
import { mapMLSToUnified } from '@/lib/data-merge';
import ListingCard from '@/components/search/ListingCard';
import { generateBreadcrumbSchema } from '@/lib/seo';
import NeighbourhoodTabsClient from './NeighbourhoodTabs';

const ToggleMap = dynamic(() => import('@/components/neighbourhood/ToggleMap'), { ssr: false });

interface Props { params: { slug: string }; }

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// Resolve slug to exact Repliers community name + boundary
async function resolveNeighbourhood(slug: string) {
  // Fetch all communities from Repliers (cached 24h at API layer)
  try {
    const data = await repliersRequest<any>({
      path: '/locations',
      query: { city: 'Toronto', resultsPerPage: '200' },
      revalidate: 86400,
    });
    const locations = data.locations || [];

    // Also fetch page 2 if needed
    let allLocations = [...locations];
    if (data.numPages > 1) {
      const p2 = await repliersRequest<any>({
        path: '/locations',
        query: { city: 'Toronto', resultsPerPage: '200', pageNum: '2' },
        revalidate: 86400,
      });
      allLocations.push(...(p2.locations || []));
    }

    // Match slug against all community names
    const match = allLocations.find((c: any) => slugify(c.name) === slug);
    if (match) {
      return {
        name: match.name,
        boundary: match.map?.boundary || null,
        city: match.address?.city || 'Toronto',
        lat: parseFloat(match.map?.latitude) || 0,
        lng: parseFloat(match.map?.longitude) || 0,
      };
    }
  } catch (e) {
    console.error('Failed to resolve neighbourhood:', e);
  }

  // Fallback: try naive slug-to-name (works for simple names like "annex")
  const fallbackName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return { name: fallbackName, boundary: null, city: 'Toronto', lat: 0, lng: 0 };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const hood = await resolveNeighbourhood(params.slug);
  return {
    title: `${hood.name} Real Estate — Condos, Homes & Pre-Construction | CondoWizard`,
    description: `Browse MLS listings and pre-construction projects in ${hood.name}, Toronto. Resale condos, homes for sale, rentals, sold data, and new developments.`,
    alternates: { canonical: `https://condowizard.ca/neighbourhood/${params.slug}` },
  };
}

export default async function NeighbourhoodPage({ params }: Props) {
  const hood = await resolveNeighbourhood(params.slug);
  const name = hood.name;
  const boundary = hood.boundary;
  const city = hood.city;

  // Fetch MLS — For Sale
  let forSale: any[] = [];
  let stats: any = {};
  try {
    const data = await repliersRequest<RepliersListingsResponse>({
      path: '/listings',
      body: { city, neighborhood: name, status: 'A', type: 'sale', resultsPerPage: 24, sortBy: 'updatedOnDesc', statistics: 'avg-listPrice,med-listPrice,cnt-available' },
      revalidate: 300,
    });
    forSale = (data.listings || []).map(mapMLSToUnified);
    const rs = data.statistics as Record<string, any> || {};
    stats = { avgPrice: rs.listPrice?.avg, medPrice: rs.listPrice?.med, totalActive: data.count };
  } catch {}

  // Fetch MLS — For Rent
  let forRent: any[] = [];
  let rentCount = 0;
  try {
    const data = await repliersRequest<RepliersListingsResponse>({
      path: '/listings',
      body: { city, neighborhood: name, status: 'A', type: 'lease', resultsPerPage: 12, sortBy: 'updatedOnDesc' },
      revalidate: 300,
    });
    forRent = (data.listings || []).map(mapMLSToUnified);
    rentCount = data.count || 0;
  } catch {}

  // Fetch MLS — Recently Sold
  let sold: any[] = [];
  let soldCount = 0;
  try {
    const data = await repliersRequest<RepliersListingsResponse>({
      path: '/listings',
      body: { city, neighborhood: name, status: 'U', lastStatus: 'Sld', resultsPerPage: 12, sortBy: 'soldDateDesc', minSoldDate: new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0] },
      revalidate: 600,
    });
    sold = (data.listings || []).map(mapMLSToUnified);
    soldCount = data.count || 0;
  } catch {}

  // Fetch Pre-con projects from Supabase
  const { data: preconRaw } = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
    .neq('status', 'COMPLETED');

  // Filter precon by name match (neighbourhood name in either the Supabase hood name or address)
  const preconProjects = (preconRaw || [])
    .filter((p: any) => {
      const hoodName = p.neighborhood?.name?.toLowerCase() || '';
      const addr = (p.address || '').toLowerCase();
      const searchName = name.toLowerCase();
      return hoodName.includes(searchName) || addr.includes(searchName);
    })
    .map((p: any) => ({
      name: p.name, slug: p.slug,
      lat: p.latitude || 0, lng: p.longitude || 0,
      floors: p.floors, priceMin: p.priceMin,
      developer: p.developer?.name || null,
      image: p.mainImageUrl || null,
      units: p.totalUnits, estCompletion: p.estCompletion,
    }));

  const { data: hoodInfo } = await supabase.from('neighborhoods').select('*').eq('slug', params.slug).single();

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name, url: `https://condowizard.ca/neighbourhood/${params.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <div className="pt-14 bg-bg min-h-screen">
        <div className="container-main py-10">
          <nav className="flex items-center gap-2 text-sm text-text-muted mb-4">
            <Link href="/" className="hover:text-accent-blue">Home</Link><span>/</span>
            <span className="text-text-primary">{name}</span>
          </nav>

          <h1 className="text-3xl font-bold text-text-primary">{name}</h1>
          {hoodInfo?.description ? (
            <p className="text-text-muted mt-2 max-w-3xl">{hoodInfo.description}</p>
          ) : (
            <p className="text-text-muted mt-2">MLS listings, pre-construction projects, sold data and market stats for {name}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-8">
            <div className="bg-white rounded-xl border border-border p-4 text-center">
              <p className="font-serif text-xl font-bold text-accent-blue">{stats.totalActive || forSale.length}</p>
              <p className="text-[11px] text-text-muted mt-0.5">For Sale</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-4 text-center">
              <p className="font-serif text-xl font-bold">{stats.avgPrice ? `$${Math.round(stats.avgPrice).toLocaleString()}` : '—'}</p>
              <p className="text-[11px] text-text-muted mt-0.5">Avg Price</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-4 text-center">
              <p className="font-serif text-xl font-bold">{rentCount}</p>
              <p className="text-[11px] text-text-muted mt-0.5">For Rent</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-4 text-center">
              <p className="font-serif text-xl font-bold text-gray-500">{soldCount}</p>
              <p className="text-[11px] text-text-muted mt-0.5">Sold (6mo)</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-4 text-center">
              <p className="font-serif text-xl font-bold text-bt-precon">{preconProjects.length}</p>
              <p className="text-[11px] text-text-muted mt-0.5">Pre-Construction</p>
            </div>
          </div>

          {/* Map with toggle */}
          <section className="mt-10">
            <ToggleMap listings={forSale} preconProjects={preconProjects} boundary={boundary} neighbourhoodName={name} />
          </section>

          {/* Resale tabs */}
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-text-primary">Properties in {name}</h2>
              <Link href={`/search?neighborhood=${encodeURIComponent(name)}`} className="text-sm text-accent-blue hover:underline">View all on map &rarr;</Link>
            </div>
            <NeighbourhoodTabsClient forSale={forSale} forRent={forRent} sold={sold} name={name} />
          </section>

          {/* Pre-con cards */}
          {preconProjects.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-text-primary">New Developments in {name}</h2>
                <Link href="/new-condos" className="text-sm text-accent-blue hover:underline">Browse all &rarr;</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {preconProjects.map((p: any) => (
                  <Link key={p.slug} href={`/properties/${p.slug}`} className="group bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-all">
                    <div className="relative aspect-[16/10] bg-surface2 overflow-hidden">
                      {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-text-muted text-sm">No Image</div>}
                      <div className="absolute top-2 left-2 bg-bt-precon text-black text-[10px] font-bold rounded px-2 py-0.5">PRE-CONSTRUCTION</div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-text-primary group-hover:text-accent-blue transition-colors">{p.name}</h3>
                      {p.developer && <p className="text-xs text-text-muted mt-0.5">{p.developer}</p>}
                      <p className="font-serif font-bold text-sm mt-1">{p.priceMin ? formatPrice(p.priceMin) + '+' : 'Contact for pricing'}</p>
                      <div className="flex gap-2 text-[11px] text-text-muted mt-1">
                        {p.floors && <span>{p.floors} floors</span>}
                        {p.units && <span>{p.units} units</span>}
                        {p.estCompletion && <span>Est. {p.estCompletion}</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Scores */}
          {hoodInfo && (hoodInfo.walk_score || hoodInfo.transit_score) && (
            <section className="mt-10">
              <h2 className="text-xl font-bold text-text-primary mb-4">Scores</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {hoodInfo.walk_score && <div className="bg-white rounded-xl border border-border p-5 text-center"><p className="font-serif text-3xl font-bold text-accent-green">{hoodInfo.walk_score}</p><p className="text-sm text-text-muted mt-1">Walk Score</p></div>}
                {hoodInfo.transit_score && <div className="bg-white rounded-xl border border-border p-5 text-center"><p className="font-serif text-3xl font-bold text-accent-blue">{hoodInfo.transit_score}</p><p className="text-sm text-text-muted mt-1">Transit Score</p></div>}
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="mt-12 bg-white rounded-xl border border-border p-8 text-center">
            <h3 className="text-xl font-bold text-text-primary mb-2">Looking to buy in {name}?</h3>
            <p className="text-text-muted mb-4">Get expert guidance from a licensed real estate professional</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/search?neighborhood=${encodeURIComponent(name)}`} className="bg-accent-blue text-white px-6 py-2.5 rounded-lg font-medium hover:bg-accent-blue/90">View All Listings</Link>
              <Link href="/contact-us" className="border border-border text-text-primary px-6 py-2.5 rounded-lg font-medium hover:border-accent-blue/30">Contact Tal Shelef</Link>
            </div>
          </section>

          <div className="mt-8 p-4 bg-white rounded-xl border border-border text-xs text-text-muted">
            <p>Tal Shelef, Sales Representative | Rare Real Estate Inc., Brokerage | 1701 Avenue Rd, Toronto, ON M5M 3Y3 | 647-890-4082</p>
          </div>
        </div>
      </div>
    </>
  );
}
