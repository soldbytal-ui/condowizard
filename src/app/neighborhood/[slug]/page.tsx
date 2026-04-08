import { Metadata } from 'next';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ListingCard from '@/components/search/ListingCard';
import { mapMLSToUnified, mapPreconToUnified } from '@/lib/data-merge';
import { repliersRequest, RepliersListingsResponse } from '@/lib/repliers';

interface Props {
  params: { slug: string };
}

function slugToName(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = slugToName(params.slug);
  return {
    title: `${name} Real Estate - Condos & Homes For Sale`,
    description: `Browse MLS listings and pre-construction condos in ${name}, Toronto. View sold prices, market stats, and neighborhood info on CondoWizard.ca.`,
  };
}

export default async function NeighborhoodPage({ params }: Props) {
  const name = slugToName(params.slug);

  // Fetch MLS listings for this neighborhood
  let mlsListings: any[] = [];
  let stats: any = {};
  try {
    const data = await repliersRequest<RepliersListingsResponse>({
      path: '/listings',
      body: {
        city: 'Toronto',
        neighborhood: name,
        status: 'A',
        type: 'sale',
        resultsPerPage: 12,
        sortBy: 'updatedOnDesc',
        statistics: 'avg-listPrice,med-listPrice,cnt-available',
      },
      revalidate: 300,
    });
    mlsListings = (data.listings || []).map(mapMLSToUnified);
    const rawStats = data.statistics as Record<string, any> || {};
    stats = {
      averagePrice: rawStats.listPrice?.avg,
      medianPrice: rawStats.listPrice?.med,
      totalActive: data.count,
    };
  } catch {}

  // Fetch pre-con projects in this neighborhood
  const { data: preconData } = await supabase
    .from('precon_projects')
    .select('*')
    .ilike('neighborhood', `%${name}%`)
    .eq('is_published', true)
    .order('updated_at', { ascending: false })
    .limit(6);

  const preconListings = (preconData || []).map(mapPreconToUnified);

  // Fetch neighborhood info from supabase
  const { data: neighborhoodInfo } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('slug', params.slug)
    .single();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${name}, Toronto`,
    description: neighborhoodInfo?.description || `Real estate in ${name}, Toronto`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Toronto',
      addressRegion: 'ON',
      addressCountry: 'CA',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="pt-14 bg-bg min-h-screen">
        <div className="container-main py-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-text-muted mb-4">
            <Link href="/" className="hover:text-accent-blue">Home</Link>
            <span>/</span>
            <span className="text-text-primary">{name}</span>
          </nav>

          <h1 className="text-3xl font-bold text-text-primary">{name} Real Estate</h1>
          {neighborhoodInfo?.description ? (
            <p className="text-text-muted mt-2 max-w-3xl">{neighborhoodInfo.description}</p>
          ) : (
            <p className="text-text-muted mt-2">Browse MLS listings and pre-construction condos in {name}, Toronto</p>
          )}

          {/* Market stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs text-text-muted">Active Listings</p>
              <p className="font-serif text-2xl font-bold text-accent-blue mt-1">
                {stats.totalActive || mlsListings.length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs text-text-muted">Avg Price</p>
              <p className="font-serif text-2xl font-bold mt-1">
                {stats.averagePrice ? `$${Math.round(stats.averagePrice).toLocaleString()}` : '—'}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs text-text-muted">Avg DOM</p>
              <p className="font-serif text-2xl font-bold mt-1">
                {stats.averageDom ? Math.round(stats.averageDom) : '—'}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs text-text-muted">Pre-Con Projects</p>
              <p className="font-serif text-2xl font-bold text-bt-precon mt-1">
                {preconListings.length}
              </p>
            </div>
          </div>

          {/* MLS Listings */}
          {mlsListings.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-text-primary">For Sale in {name}</h2>
                <Link href={`/search?neighborhood=${encodeURIComponent(name)}`} className="text-sm text-accent-blue hover:underline">
                  View All &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mlsListings.map((listing: any) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </section>
          )}

          {/* Pre-construction */}
          {preconListings.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-text-primary">Pre-Construction in {name}</h2>
                <Link href={`/search?tab=precon&neighborhood=${encodeURIComponent(name)}`} className="text-sm text-accent-blue hover:underline">
                  View All &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {preconListings.map((listing: any) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </section>
          )}

          {/* Walk/Transit scores */}
          {neighborhoodInfo && (neighborhoodInfo.walk_score || neighborhoodInfo.transit_score) && (
            <section className="mt-10">
              <h2 className="text-2xl font-bold text-text-primary mb-6">Scores</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {neighborhoodInfo.walk_score && (
                  <div className="bg-white rounded-xl border border-border p-5 text-center">
                    <p className="font-serif text-3xl font-bold text-accent-green">{neighborhoodInfo.walk_score}</p>
                    <p className="text-sm text-text-muted mt-1">Walk Score</p>
                  </div>
                )}
                {neighborhoodInfo.transit_score && (
                  <div className="bg-white rounded-xl border border-border p-5 text-center">
                    <p className="font-serif text-3xl font-bold text-accent-blue">{neighborhoodInfo.transit_score}</p>
                    <p className="text-sm text-text-muted mt-1">Transit Score</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="mt-12 bg-white rounded-xl border border-border p-8 text-center">
            <h3 className="text-xl font-bold text-text-primary mb-2">Looking to buy in {name}?</h3>
            <p className="text-text-muted mb-4">Get expert guidance from a licensed real estate professional</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/search?neighborhood=${encodeURIComponent(name)}`} className="bg-accent-blue text-white px-6 py-2.5 rounded-lg font-medium hover:bg-accent-blue/90 transition-colors">
                View All Listings
              </Link>
              <Link href="/contact-us" className="border border-border text-text-primary px-6 py-2.5 rounded-lg font-medium hover:border-accent-blue/30 transition-colors">
                Contact Tal Shelef
              </Link>
            </div>
          </section>

          {/* RECO */}
          <div className="mt-8 p-4 bg-white rounded-xl border border-border text-xs text-text-muted">
            <p>Tal Shelef, Sales Representative | Rare Real Estate Inc., Brokerage | 1701 Avenue Rd, Toronto, ON M5M 3Y3 | 647-890-4082</p>
          </div>
        </div>
      </div>
    </>
  );
}
