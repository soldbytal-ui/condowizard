import { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { repliersRequest, RepliersListingsResponse } from '@/lib/repliers';
import { mapMLSToUnified } from '@/lib/data-merge';
import ListingCard from '@/components/search/ListingCard';
import { generateBreadcrumbSchema } from '@/lib/seo';

const ToggleMap = dynamic(() => import('@/components/neighbourhood/ToggleMap'), { ssr: false });

interface Props { params: { slug: string }; }

function slugToName(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = slugToName(params.slug);
  return {
    title: `${name} Real Estate — Condos, Homes & Pre-Construction | CondoWizard`,
    description: `Browse MLS listings and pre-construction projects in ${name}, Toronto. Resale condos, homes for sale, rentals, sold data, and new developments.`,
    alternates: { canonical: `https://condowizard.ca/neighbourhood/${params.slug}` },
  };
}

export default async function NeighbourhoodPage({ params }: Props) {
  const name = slugToName(params.slug);

  // Fetch boundary polygon from Repliers communities API
  let boundary: number[][][] | null = null;
  try {
    const commRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? '' : 'http://localhost:3000'}/api/repliers/communities`, { next: { revalidate: 86400 } });
    if (commRes.ok) {
      const commData = await commRes.json();
      const match = (commData.locations || []).find((c: any) => c.name.toLowerCase() === name.toLowerCase());
      if (match?.boundary) boundary = match.boundary;
    }
  } catch {}

  // Fallback: try fetching boundary directly from Repliers
  if (!boundary) {
    try {
      const locData = await repliersRequest<any>({ path: '/locations', query: { city: 'Toronto', type: 'neighborhood' }, revalidate: 86400 });
      const match = (locData.locations || []).find((l: any) => l.name.toLowerCase() === name.toLowerCase());
      if (match?.map?.boundary) boundary = match.map.boundary;
    } catch {}
  }

  // Fetch MLS listings — For Sale
  let forSale: any[] = [];
  let stats: any = {};
  try {
    const data = await repliersRequest<RepliersListingsResponse>({
      path: '/listings',
      body: { city: 'Toronto', neighborhood: name, status: 'A', type: 'sale', resultsPerPage: 24, sortBy: 'updatedOnDesc', statistics: 'avg-listPrice,med-listPrice,cnt-available' },
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
      body: { city: 'Toronto', neighborhood: name, status: 'A', type: 'lease', resultsPerPage: 12, sortBy: 'updatedOnDesc' },
      revalidate: 300,
    });
    forRent = (data.listings || []).map(mapMLSToUnified);
    rentCount = data.count || 0;
  } catch {}

  // Fetch MLS — Recently Sold
  let sold: any[] = [];
  let soldCount = 0;
  try {
    const sixMonthsAgo = new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0];
    const data = await repliersRequest<RepliersListingsResponse>({
      path: '/listings',
      body: { city: 'Toronto', neighborhood: name, status: 'U', lastStatus: 'Sld', resultsPerPage: 12, sortBy: 'soldDateDesc', minSoldDate: sixMonthsAgo },
      revalidate: 600,
    });
    sold = (data.listings || []).map(mapMLSToUnified);
    soldCount = data.count || 0;
  } catch {}

  // Fetch Pre-con projects from Supabase (projects table — the original Prisma table)
  const { data: preconRaw } = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
    .neq('status', 'COMPLETED')
    .or(`neighborhood.name.ilike.%${name}%`);

  // Also try the precon_projects table
  const { data: precon2 } = await supabase
    .from('precon_projects')
    .select('*')
    .ilike('neighborhood', `%${name}%`)
    .eq('is_published', true);

  const preconProjects = (preconRaw || []).map((p: any) => ({
    name: p.name, slug: p.slug,
    lat: p.latitude || 0, lng: p.longitude || 0,
    floors: p.floors, priceMin: p.priceMin,
    developer: p.developer?.name || null,
    image: p.mainImageUrl || null,
    units: p.totalUnits,
    estCompletion: p.estCompletion,
  }));

  // Neighbourhood info from Supabase
  const { data: hoodInfo } = await supabase.from('neighborhoods').select('*').eq('slug', params.slug).single();

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name: name, url: `https://condowizard.ca/neighbourhood/${params.slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <div className="pt-14 bg-bg min-h-screen">
        <div className="container-main py-10">
          {/* Breadcrumbs */}
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

          {/* Market stats */}
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

          {/* Single map with Resale / Pre-Construction toggle */}
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-text-primary mb-4">{name} Map</h2>
            <ToggleMap listings={forSale} preconProjects={preconProjects} boundary={boundary} neighbourhoodName={name} />
          </section>

          {/* Resale listings tabs */}
          <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-text-primary">Resale Properties in {name}</h2>
              <Link href={`/search?neighborhood=${encodeURIComponent(name)}`} className="text-sm text-accent-blue hover:underline">View all on map &rarr;</Link>
            </div>
            <NeighbourhoodListingTabs forSale={forSale} forRent={forRent} sold={sold} name={name} />
          </section>

          {/* Pre-con project cards */}
          {preconProjects.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-text-primary">New Developments in {name}</h2>
                <Link href="/new-condos" className="text-sm text-accent-blue hover:underline">Browse all &rarr;</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {preconProjects.map((p: any) => (
                  <Link key={p.slug} href={`/properties/${p.slug}`} className="group bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-all">
                    <div className="relative aspect-[4/3] bg-surface2 overflow-hidden">
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

// Client component for the listing tabs
function NeighbourhoodListingTabs({ forSale, forRent, sold, name }: { forSale: any[]; forRent: any[]; sold: any[]; name: string }) {
  return <NeighbourhoodTabsClient forSale={forSale} forRent={forRent} sold={sold} name={name} />;
}

// We need a separate client component for the tabs since this is a server component page
import NeighbourhoodTabsClient from './NeighbourhoodTabs';
